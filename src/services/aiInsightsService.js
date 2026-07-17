/**
 * AI Insights Service — the engine behind the "AI Decision Support" dashboard.
 *
 * DESIGN NOTE (read me before editing):
 * This service intentionally does NOT dump raw Firestore data into an LLM prompt
 * and ask it to "figure things out." That produces vague, unreliable, hard-to-audit
 * recommendations. Instead it follows a two-layer approach:
 *
 *   Layer 1 — Deterministic analysis (this file): reads live Firestore data through
 *   the EXISTING services (healthService/bhwService, foodAidService, eventsService,
 *   emergencyService) and computes concrete signals — overdue puroks, low inventory,
 *   volunteer shortages, hotspots, conflicts, trends. This layer always works, even
 *   with no AI key configured, and every number it produces is traceable back to a
 *   specific Firestore field.
 *
 *   Layer 2 — AI explanation (Groq, reusing the same client pattern as
 *   aiHealthService.js): turns the computed signals into a clear, human-readable
 *   "why" for officials, in the required Summary / Reason / Confidence / Suggested
 *   Action format. If the AI call fails or no key is configured, a rule-based
 *   explanation is used instead so the dashboard never breaks.
 *
 * This keeps the AI explainable ("what was analyzed, why, how confident, what to do")
 * and prevents the AI from ever making a decision — it only ever recommends.
 */

import { collection, getDocs, addDoc, query, where, orderBy, limit as fbLimit } from 'firebase/firestore'
import { db } from '../config/firebase'
import foodAidService from './foodAidService'
import eventsService from './eventsService'
import emergencyService from './emergencyService'
import { PUROKS_ILIHAN, getShortPurokName } from '../constants/puroks'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const MODELS = ['llama-3.3-70b-versatile', 'llama3-8b-8192', 'gemma2-9b-it']

const AI_HISTORY_COLLECTION = 'aiInsightsHistory'
const HEALTH_REQUESTS_COLLECTION = 'health_requests'

export const MODULES = {
  HEALTH: 'health',
  FOOD_AID: 'food_aid',
  EVENTS: 'events',
  EMERGENCY: 'emergency',
}

export const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

// ── Shared Groq caller (mirrors aiHealthService.js so we don't duplicate retry logic twice) ──
async function callGroqJSON(systemPrompt, userPrompt) {
  if (!GROQ_API_KEY) return null

  for (const model of MODELS) {
    try {
      const res = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 400,
          response_format: { type: 'json_object' },
        }),
      })

      if (!res.ok) {
        if (res.status === 429) continue // rate-limited, try next model
        return null
      }

      const data = await res.json()
      const text = data.choices?.[0]?.message?.content
      if (!text) return null
      return JSON.parse(text)
    } catch (err) {
      console.warn(`[aiInsightsService] Groq model ${model} failed:`, err.message)
      continue
    }
  }
  return null
}

/**
 * Ask the AI to phrase the reasoning for a signal we already computed.
 * Falls back to the deterministic text if the AI is unavailable — the
 * recommendation itself never depends on the AI being reachable.
 */
async function explain(signal) {
  const fallback = {
    summary: signal.summary,
    reason: signal.reason,
    suggestedAction: signal.suggestedAction,
  }

  const aiResult = await callGroqJSON(
    `You are the AI Decision Support engine inside SmartCo, the barangay management system for Barangay Ilihan, Toledo City, Cebu. ` +
    `You assist Barangay Officials, Barangay Health Workers, and Food Aid Coordinators. You NEVER make decisions and NEVER diagnose — ` +
    `you only explain data-driven recommendations so a human can decide. Respond ONLY with a JSON object with exactly these keys: ` +
    `"summary" (1 sentence), "reason" (1-2 sentences explaining why, citing the numbers given), "suggestedAction" (1 short actionable sentence). ` +
    `Do not invent numbers that were not given to you.`,
    `Signal type: ${signal.title}\nData analyzed: ${JSON.stringify(signal.dataAnalyzed)}\nDraft summary: ${signal.summary}\nDraft reason: ${signal.reason}\nDraft action: ${signal.suggestedAction}`
  )

  if (aiResult?.summary && aiResult?.reason && aiResult?.suggestedAction) {
    return { ...fallback, ...aiResult, aiGenerated: true }
  }
  return { ...fallback, aiGenerated: false }
}

function makeInsight({ module, title, priority, confidence, dataAnalyzed, summary, reason, suggestedAction }) {
  return {
    id: `${module}-${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    module,
    title,
    priority,       // 'high' | 'medium' | 'low'
    confidence,     // 'High' | 'Medium' | 'Low'
    dataAnalyzed,   // raw numbers this insight is based on, for transparency
    summary,
    reason,
    suggestedAction,
    timestamp: new Date().toISOString(),
  }
}

const daysSince = (isoDate) => {
  if (!isoDate) return Infinity
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24))
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH AI — reads the existing `health_requests` collection (already used by
// the BHW dashboard) so we don't duplicate data or add new collections.
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeHealth() {
  const signals = []
  let requests = []

  try {
    const snapshot = await getDocs(collection(db, HEALTH_REQUESTS_COLLECTION))
    requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('[aiInsightsService] Failed to read health requests:', err)
    return signals
  }

  if (requests.length === 0) return signals

  // Residents needing immediate follow-up: critical/urgent assessments still pending review
  const urgentPending = requests.filter(r =>
    (r.healthAssessment?.overallStatus === 'critical' || r.healthAssessment?.urgencyLevel === 'urgent') &&
    r.status !== 'completed' && r.status !== 'rejected'
  )
  if (urgentPending.length > 0) {
    signals.push({
      module: MODULES.HEALTH,
      title: 'Residents needing immediate follow-up',
      priority: PRIORITY.HIGH,
      confidence: 'High',
      dataAnalyzed: { urgentPendingCount: urgentPending.length, names: urgentPending.slice(0, 5).map(r => r.residentName) },
      summary: `${urgentPending.length} resident${urgentPending.length > 1 ? 's have' : ' has'} critical or urgent health flags still awaiting BHW review.`,
      reason: `These records were flagged critical/urgent by the health checkup assessment and have not yet been marked completed.`,
      suggestedAction: 'Prioritize BHW review and schedule same-day visits for these residents.',
    })
  }

  // Overdue for checkups / multiple missed appointments — approximate using stale pending requests
  const stalePending = requests.filter(r => r.status === 'pending_review' && daysSince(r.createdAt) >= 3)
  if (stalePending.length > 0) {
    signals.push({
      module: MODULES.HEALTH,
      title: 'Residents overdue for BHW review',
      priority: stalePending.length >= 5 ? PRIORITY.HIGH : PRIORITY.MEDIUM,
      confidence: 'Medium',
      dataAnalyzed: { staleCount: stalePending.length, oldestDays: Math.max(...stalePending.map(r => daysSince(r.createdAt))) },
      summary: `${stalePending.length} health request${stalePending.length > 1 ? 's have' : ' has'} been waiting 3+ days without review.`,
      reason: `These requests are still in "pending review" status well past the typical review window.`,
      suggestedAction: 'Assign a BHW to clear the review backlog this week.',
    })
  }

  // Health trend per purok — concerning/critical rate
  const byPurok = {}
  requests.forEach(r => {
    const p = r.purok || 'Unspecified'
    byPurok[p] = byPurok[p] || { total: 0, concerning: 0 }
    byPurok[p].total += 1
    if (['concerning', 'critical'].includes(r.healthAssessment?.overallStatus)) byPurok[p].concerning += 1
  })
  const trendPurok = Object.entries(byPurok)
    .filter(([, v]) => v.total >= 3)
    .map(([p, v]) => ({ purok: p, rate: v.concerning / v.total, ...v }))
    .sort((a, b) => b.rate - a.rate)[0]

  if (trendPurok && trendPurok.rate >= 0.3) {
    signals.push({
      module: MODULES.HEALTH,
      title: 'Health trend summary',
      priority: trendPurok.rate >= 0.5 ? PRIORITY.HIGH : PRIORITY.MEDIUM,
      confidence: 'Medium',
      dataAnalyzed: { purok: trendPurok.purok, concerning: trendPurok.concerning, total: trendPurok.total, rate: Math.round(trendPurok.rate * 100) },
      summary: `${trendPurok.purok} shows ${Math.round(trendPurok.rate * 100)}% of recent health requests flagged concerning or critical.`,
      reason: `${trendPurok.concerning} out of ${trendPurok.total} recent health requests from this purok were flagged concerning/critical, higher than other puroks.`,
      suggestedAction: `Consider a targeted BHW health monitoring visit to ${trendPurok.purok}.`,
    })
  }

  // Possible outbreak signal — many requests in a short window mentioning similar symptoms
  const recent = requests.filter(r => daysSince(r.createdAt) <= 7)
  if (recent.length >= 6) {
    const symptomWords = recent
      .map(r => (r.symptoms || '').toLowerCase())
      .join(' ')
    const commonSymptoms = ['fever', 'cough', 'colds', 'diarrhea', 'vomiting', 'flu', 'sore throat']
      .map(sym => ({ sym, count: (symptomWords.match(new RegExp(sym, 'g')) || []).length }))
      .filter(s => s.count >= 3)
      .sort((a, b) => b.count - a.count)[0]

    if (commonSymptoms) {
      signals.push({
        module: MODULES.HEALTH,
        title: 'Possible outbreak pattern',
        priority: PRIORITY.HIGH,
        confidence: 'Medium',
        dataAnalyzed: { symptom: commonSymptoms.sym, mentions: commonSymptoms.count, windowDays: 7, totalRequests: recent.length },
        summary: `"${commonSymptoms.sym}" mentioned in ${commonSymptoms.count} of ${recent.length} health requests filed in the last 7 days.`,
        reason: `A cluster of similar symptom reports in a short time window can indicate a spreading illness in the barangay.`,
        suggestedAction: 'BHWs should verify affected households and consider a community health advisory. This is a pattern flag, not a diagnosis.',
      })
    }
  }

  return signals
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOD AID AI — builds on the existing `_buildAIRecommendation`/priority-purok
// logic already in foodAidService, and adds inventory/volunteer/risk analysis.
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeFoodAid() {
  const signals = []
  const all = await foodAidService.getAllFoodAidSchedules()
  if (all.length === 0) return signals

  // Priority purok: longest since last completed distribution (reuse same logic style as foodAidService)
  const lastServedByPurok = {}
  all.forEach(d => {
    const completedAt = d.completedAt || (d.progress?.workflowStatus === 'completed' ? d.updatedAt : null)
    if (completedAt && (!lastServedByPurok[d.purok] || completedAt > lastServedByPurok[d.purok])) {
      lastServedByPurok[d.purok] = completedAt
    }
  })
  const priorityRanking = [...PUROKS_ILIHAN]
    .map(p => ({ purok: getShortPurokName(p), lastServed: lastServedByPurok[p] || null, days: daysSince(lastServedByPurok[p]) }))
    .sort((a, b) => b.days - a.days)

  const topPriority = priorityRanking[0]
  if (topPriority && topPriority.days > 14) {
    signals.push({
      module: MODULES.FOOD_AID,
      title: "Today's priority purok",
      priority: topPriority.days > 30 ? PRIORITY.HIGH : PRIORITY.MEDIUM,
      confidence: 'High',
      dataAnalyzed: { purok: topPriority.purok, daysSinceLastServed: topPriority.days === Infinity ? 'never' : topPriority.days },
      summary: `${topPriority.purok} has ${topPriority.days === Infinity ? 'no recorded' : `gone ${topPriority.days} days without a`} completed distribution.`,
      reason: `Ranked highest among all puroks by time since last completed food aid distribution.`,
      suggestedAction: `Schedule the next distribution in ${topPriority.purok} within the next planning cycle.`,
    })
  }

  // Active distributions needing attention: pending approval too long, or in-progress with low completion rate
  const pendingApproval = all.filter(d => d.progress?.workflowStatus === 'pending_approval')
  if (pendingApproval.length > 0) {
    signals.push({
      module: MODULES.FOOD_AID,
      title: 'Distribution approval recommendations',
      priority: pendingApproval.length >= 3 ? PRIORITY.HIGH : PRIORITY.MEDIUM,
      confidence: 'High',
      dataAnalyzed: { pendingCount: pendingApproval.length, puroks: pendingApproval.map(d => d.purok) },
      summary: `${pendingApproval.length} food aid distribution${pendingApproval.length > 1 ? 's are' : ' is'} awaiting official approval.`,
      reason: `These distributions cannot proceed to AI scheduling or volunteer assignment until approved.`,
      suggestedAction: 'Review and approve pending distributions to avoid delays.',
    })
  }

  // Volunteer shortage: distributions approved/ai_scheduled with no volunteer assigned
  const needsVolunteer = all.filter(d => ['approved', 'ai_scheduled'].includes(d.progress?.workflowStatus) && !d.assignedVolunteer)
  if (needsVolunteer.length > 0) {
    const totalHouseholds = needsVolunteer.reduce((s, d) => s + (d.progress?.householdsTarget || 0), 0)
    const estimatedVolunteersNeeded = Math.max(needsVolunteer.length, Math.ceil(totalHouseholds / 15))
    signals.push({
      module: MODULES.FOOD_AID,
      title: 'Volunteer shortage warning',
      priority: needsVolunteer.length >= 3 ? PRIORITY.HIGH : PRIORITY.MEDIUM,
      confidence: 'Medium',
      dataAnalyzed: { unassignedDistributions: needsVolunteer.length, totalHouseholds, estimatedVolunteersNeeded },
      summary: `${needsVolunteer.length} scheduled distribution${needsVolunteer.length > 1 ? 's have' : ' has'} no volunteer assigned yet.`,
      reason: `Estimated ~1 volunteer per 15 households across ${totalHouseholds} target households means roughly ${estimatedVolunteersNeeded} volunteers are needed.`,
      suggestedAction: 'Recruit or assign volunteers before the scheduled distribution date.',
    })
  }

  // Distribution risk: in_progress with completion far behind expected pace
  const atRisk = all.filter(d => {
    if (d.progress?.workflowStatus !== 'in_progress' || !d.date) return false
    const daysIntoEvent = daysSince(d.date)
    return daysIntoEvent >= 1 && d.progress.percentage < 50
  })
  if (atRisk.length > 0) {
    signals.push({
      module: MODULES.FOOD_AID,
      title: 'Distribution risk assessment',
      priority: PRIORITY.HIGH,
      confidence: 'Medium',
      dataAnalyzed: { atRiskCount: atRisk.length, puroks: atRisk.map(d => `${d.purok} (${d.progress.percentage}%)`) },
      summary: `${atRisk.length} in-progress distribution${atRisk.length > 1 ? 's are' : ' is'} behind schedule (under 50% complete a day after the start date).`,
      reason: `These distributions started but have low household completion rates relative to elapsed time, suggesting delays.`,
      suggestedAction: 'Check in with the assigned volunteer coordinator and consider reallocating manpower.',
    })
  }

  // Inventory sufficiency — approximate via householdsTarget vs householdsCompleted gap across all active items
  const totalTarget = all.reduce((s, d) => s + (d.progress?.householdsTarget || 0), 0)
  const totalServed = all.reduce((s, d) => s + (d.progress?.householdsServed || 0), 0)
  const upcoming = all.filter(d => ['approved', 'ai_scheduled', 'volunteer_assigned'].includes(d.progress?.workflowStatus))
  const upcomingHouseholds = upcoming.reduce((s, d) => s + (d.progress?.householdsTarget || 0), 0)
  if (upcomingHouseholds > 0) {
    signals.push({
      module: MODULES.FOOD_AID,
      title: 'Inventory sufficiency analysis',
      priority: PRIORITY.LOW,
      confidence: 'Low',
      dataAnalyzed: { totalTarget, totalServed, upcomingHouseholds },
      summary: `${upcomingHouseholds} households are expected to be served across ${upcoming.length} upcoming distribution${upcoming.length > 1 ? 's' : ''}.`,
      reason: `Based on households targeted in approved/scheduled distributions not yet completed. SmartCo does not yet track a dedicated inventory count field, so this is a demand estimate rather than a stock check.`,
      suggestedAction: 'Confirm actual food stock on hand covers the upcoming household count before distribution day.',
    })
  }

  return signals
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT MANAGEMENT AI
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeEvents() {
  const signals = []
  const events = await eventsService.getEvents().catch(() => [])
  if (!events || events.length === 0) return signals

  const upcoming = events.filter(e => e.status === 'upcoming' && e.date)

  // Conflict detection: two+ upcoming events on the same date
  const byDate = {}
  upcoming.forEach(e => {
    byDate[e.date] = byDate[e.date] || []
    byDate[e.date].push(e)
  })
  const conflicts = Object.entries(byDate).filter(([, list]) => list.length > 1)
  if (conflicts.length > 0) {
    const [date, list] = conflicts[0]
    signals.push({
      module: MODULES.EVENTS,
      title: 'Upcoming event conflict detected',
      priority: PRIORITY.MEDIUM,
      confidence: 'High',
      dataAnalyzed: { date, events: list.map(e => e.title) },
      summary: `${list.length} events are scheduled on ${date}: ${list.map(e => e.title).join(', ')}.`,
      reason: `Multiple events on the same date can split volunteer availability and attendance.`,
      suggestedAction: 'Consider rescheduling one event or coordinating shared resources in advance.',
    })
  }

  // Estimated attendance / volunteer requirements for the next event using historical average
  const past = events.filter(e => e.status !== 'upcoming' && Array.isArray(e.attendees))
  if (upcoming.length > 0 && past.length > 0) {
    const avgAttendance = Math.round(past.reduce((s, e) => s + e.attendees.length, 0) / past.length)
    const nextEvent = [...upcoming].sort((a, b) => a.date.localeCompare(b.date))[0]
    signals.push({
      module: MODULES.EVENTS,
      title: 'Estimated attendance & volunteer needs',
      priority: PRIORITY.LOW,
      confidence: 'Medium',
      dataAnalyzed: { nextEvent: nextEvent.title, avgAttendance, historicalEventsUsed: past.length },
      summary: `"${nextEvent.title}" is projected to draw around ${avgAttendance} attendees, based on ${past.length} past events.`,
      reason: `Average attendance across past recorded events was used as the estimate for the next upcoming event.`,
      suggestedAction: `Plan for roughly ${avgAttendance} attendees and ${Math.max(2, Math.ceil(avgAttendance / 20))} volunteers.`,
    })
  }

  return signals
}

// ─────────────────────────────────────────────────────────────────────────────
// EMERGENCY AI
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeEmergency() {
  const signals = []
  const emergencies = await emergencyService.getEmergencies().catch(() => [])
  if (!emergencies || emergencies.length === 0) return signals

  const recent = emergencies.filter(e => daysSince(e.createdAt) <= 30)

  // Hotspot detection: purok with the most reports in the last 30 days
  const byPurok = {}
  recent.forEach(e => {
    const p = e.purok || 'Unspecified'
    byPurok[p] = (byPurok[p] || 0) + 1
  })
  const hotspot = Object.entries(byPurok).sort((a, b) => b[1] - a[1])[0]
  if (hotspot && hotspot[1] >= 3) {
    signals.push({
      module: MODULES.EMERGENCY,
      title: 'Emergency hotspot detected',
      priority: hotspot[1] >= 5 ? PRIORITY.HIGH : PRIORITY.MEDIUM,
      confidence: 'High',
      dataAnalyzed: { purok: hotspot[0], reportsLast30Days: hotspot[1] },
      summary: `${hotspot[0]} recorded ${hotspot[1]} emergency reports in the last 30 days — the highest of any purok.`,
      reason: `Report frequency by purok over a 30-day rolling window flags this area as a recurring hotspot.`,
      suggestedAction: `Recommend increased tanod patrol presence in ${hotspot[0]}.`,
    })
  }

  // Incident type trend
  const byType = {}
  recent.forEach(e => { byType[e.type] = (byType[e.type] || 0) + 1 })
  const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]
  if (topType && topType[1] >= 3) {
    signals.push({
      module: MODULES.EMERGENCY,
      title: 'Emergency trend analysis',
      priority: PRIORITY.MEDIUM,
      confidence: 'Medium',
      dataAnalyzed: { type: topType[0], count: topType[1], windowDays: 30 },
      summary: `"${topType[0]}" is the most frequently reported emergency type this month (${topType[1]} reports).`,
      reason: `This incident type occurred more often than any other in the last 30 days of reports.`,
      suggestedAction: `Plan a preparedness activity or advisory focused on ${topType[0]}.`,
    })
  }

  // Unresolved/pending emergencies needing dispatch
  const pending = emergencies.filter(e => e.status === 'pending')
  if (pending.length > 0) {
    signals.push({
      module: MODULES.EMERGENCY,
      title: 'Pending emergencies need dispatch',
      priority: PRIORITY.HIGH,
      confidence: 'High',
      dataAnalyzed: { pendingCount: pending.length },
      summary: `${pending.length} emergency report${pending.length > 1 ? 's are' : ' is'} still pending response.`,
      reason: `These reports have not yet been responded to, dispatched, or resolved.`,
      suggestedAction: 'Review and dispatch tanod or responders immediately.',
    })
  }

  return signals
}

// ─────────────────────────────────────────────────────────────────────────────
// AI HISTORY — persists generated recommendations for later review
// ─────────────────────────────────────────────────────────────────────────────
export async function saveInsightToHistory(insight) {
  try {
    await addDoc(collection(db, AI_HISTORY_COLLECTION), {
      module: insight.module,
      title: insight.title,
      summary: insight.summary,
      reason: insight.reason,
      suggestedAction: insight.suggestedAction,
      confidence: insight.confidence,
      priority: insight.priority,
      status: 'generated', // generated | acknowledged | acted_on | dismissed
      createdAt: insight.timestamp,
    })
  } catch (err) {
    console.warn('[aiInsightsService] Could not save insight history:', err.message)
  }
}

export async function getInsightHistory(max = 50) {
  try {
    let snapshot
    try {
      const q = query(collection(db, AI_HISTORY_COLLECTION), orderBy('createdAt', 'desc'), fbLimit(max))
      snapshot = await getDocs(q)
    } catch {
      snapshot = await getDocs(collection(db, AI_HISTORY_COLLECTION))
    }
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, max)
  } catch (err) {
    console.error('[aiInsightsService] Failed to load insight history:', err)
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: generate all insights, enrich with AI-phrased explanations, and log history
// ─────────────────────────────────────────────────────────────────────────────
export async function generateAllInsights({ persistHistory = true } = {}) {
  const [health, foodAid, events, emergency] = await Promise.all([
    analyzeHealth().catch(err => { console.error('Health AI failed:', err); return [] }),
    analyzeFoodAid().catch(err => { console.error('Food Aid AI failed:', err); return [] }),
    analyzeEvents().catch(err => { console.error('Events AI failed:', err); return [] }),
    analyzeEmergency().catch(err => { console.error('Emergency AI failed:', err); return [] }),
  ])

  const rawSignals = [...health, ...foodAid, ...events, ...emergency]

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  rawSignals.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  // Enrich each signal with AI-phrased explanation (bounded concurrency isn't needed —
  // dashboard-scale insight counts are small, typically under 15)
  const insights = await Promise.all(
    rawSignals.map(async (signal) => {
      const explained = await explain(signal)
      return makeInsight({ ...signal, ...explained })
    })
  )

  if (persistHistory) {
    // fire-and-forget; don't block the dashboard on history writes
    insights.forEach(i => saveInsightToHistory(i))
  }

  return insights
}

export default {
  generateAllInsights,
  getInsightHistory,
  saveInsightToHistory,
  MODULES,
  PRIORITY,
}
