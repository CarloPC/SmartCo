/**
 * AI Health Service — powered by Groq (llama-3.3-70b-versatile)
 * Set VITE_GROQ_API_KEY in your .env file to enable.
 *
 * Groq is OpenAI-compatible: POST https://api.groq.com/openai/v1/chat/completions
 *
 * Model fallback order (all free-tier capable on Groq):
 *   1. llama-3.3-70b-versatile
 *   2. llama3-8b-8192
 *   3. gemma2-9b-it
 *
 * If all models are rate-limited the service falls back to
 * a built-in demo mode so the UI remains usable.
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const MODELS = ['llama-3.3-70b-versatile', 'llama3-8b-8192', 'gemma2-9b-it']

const SYSTEM_PROMPT = `You are HealthBot, a compassionate and professional AI health assistant embedded in SmartCo, the Smart Barangay Management System for Barangay Ilihan, Toledo City, Cebu, Philippines.

Your role is to help Barangay Ilihan residents understand their health concerns and guide them toward appropriate care at the Barangay Ilihan Health Center.

CONVERSATION FLOW:
1. Greet the user warmly and ask how they feel today.
2. Ask about their main symptom or concern first, then gather details ONE question at a time:
   - How long have they had it?
   - Severity on a scale of 1–10?
   - Any other accompanying symptoms (fever, nausea, fatigue, etc.)?
   - Recent lifestyle changes (diet, sleep, stress, activity)?
3. After collecting enough context (at least 2–3 exchanges), provide a structured health analysis:
   - 🔍 Possible condition(s) (mention 1–3 likely ones, not as diagnosis)
   - 💊 Home remedy & self-care advice
   - ⚠️ Warning signs to watch out for
4. For SERIOUS symptoms (high fever >38.5°C, chest pain, difficulty breathing, persistent vomiting >24h, severe headache with stiff neck, signs of stroke), include this exact marker at the END of your response: [SUGGEST_CHECKUP]
5. For mild concerns (common cold, mild headache, minor cuts, seasonal allergy), give home remedies without suggesting a checkup.

TONE & STYLE:
- Warm, caring, and easy to understand — avoid overly medical jargon.
- Keep each response to 3–5 short sentences or bullet points.
- Always end serious analyses with: "Note: I'm an AI health assistant, not a licensed doctor. Please seek professional care if symptoms worsen."
- Do NOT discuss non-health topics. Politely redirect if asked.
- Respond in English by default, but if the user writes in Filipino/Cebuano, respond in the same language.`

/** ── Demo mode responses (used when all API quota is exhausted) ────────── */
const DEMO_RESPONSES = [
  "I understand you're not feeling well. Could you tell me more about your main symptom? For example, is it a headache, fever, body pain, or something else?",
  "Thank you for sharing that. How long have you been experiencing this? And on a scale of 1–10, how severe would you say it is?",
  "I see. Are you experiencing any other symptoms alongside this — such as fever, nausea, fatigue, or dizziness?",
  "Based on what you've shared, this sounds like it could be related to fatigue or a mild viral infection.\n\n🔍 **Possible conditions:** Common cold, mild flu, or stress-related fatigue.\n💊 **Self-care:** Rest well, stay hydrated (8+ glasses of water), and take paracetamol for any fever or pain.\n⚠️ **Watch out for:** High fever above 38.5°C, difficulty breathing, or symptoms lasting more than 5 days.\n\n*Note: I'm an AI health assistant, not a licensed doctor. Please seek professional care if symptoms worsen.*",
]
let demoIdx = 0

/**
 * Call a single Groq model with the given messages.
 */
async function callGroq(model, systemText, messages) {
  const groqMessages = [
    { role: 'system', content: systemText },
    ...messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))
  ]

  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 512,
      top_p: 0.95
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const status = res.status
    const apiMsg = err?.error?.message || ''
    console.warn(`Groq [${model}] error ${status}:`, apiMsg)
    const quotaErr = new Error(apiMsg || `Error ${status}`)
    quotaErr.status = status
    quotaErr.isRateLimit = status === 429
    throw quotaErr
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * Send conversation history to Groq and get the next AI reply.
 * @param {Array<{role:'user'|'assistant', content:string}>} messages
 * @param {object} userContext  optional user context (name, purok, etc.)
 * @returns {Promise<{text: string, suggestCheckup: boolean}>}
 */
export async function sendHealthMessage(messages, userContext = {}) {
  if (!GROQ_API_KEY) {
    return {
      text: "⚠️ The AI Health Assistant is not configured yet. Please add your **VITE_GROQ_API_KEY** to the `.env` file and restart the dev server.",
      suggestCheckup: false
    }
  }

  // Build conversation — skip leading assistant messages (greeting shown in UI)
  const allMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant')
  const firstUserIdx = allMessages.findIndex(m => m.role === 'user')
  const chatMessages = firstUserIdx >= 0 ? allMessages.slice(firstUserIdx) : allMessages

  const systemText = userContext.name
    ? `${SYSTEM_PROMPT}\n\nUser context: The user's name is ${userContext.name}, living in ${userContext.purok || 'the barangay'}.`
    : SYSTEM_PROMPT

  // Try each model in order; fall back to demo mode if all are rate-limited.
  for (const model of MODELS) {
    try {
      const rawText = await callGroq(model, systemText, chatMessages)
      const suggestCheckup = rawText.includes('[SUGGEST_CHECKUP]')
      const cleanText = rawText.replace('[SUGGEST_CHECKUP]', '').trim()
      return { text: cleanText, suggestCheckup, model }
    } catch (err) {
      if (err.isRateLimit) {
        console.warn(`Model ${model} rate-limited, trying next…`)
        continue
      }
      if (err.status === 400) throw new Error(`Invalid request to AI service. (${err.message})`)
      if (err.status === 401) throw new Error('Invalid API key. Please check your VITE_GROQ_API_KEY.')
      if (err.status === 404) throw new Error(`Model not found: ${model}`)
      throw err
    }
  }

  // All models rate-limited — use demo mode
  console.warn('All Groq models rate-limited. Using demo mode.')
  const demoText = DEMO_RESPONSES[demoIdx % DEMO_RESPONSES.length]
  demoIdx++
  return {
    text: `${demoText}\n\n---\n⚠️ *Demo mode — Groq rate limit reached. Try again in a moment.*`,
    suggestCheckup: false,
    isDemo: true
  }
}

/**
 * Build a summary of the conversation for checkup notes.
 * Includes the user's reported symptoms AND the last AI health analysis.
 */
export function buildConversationSummary(messages) {
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' | ')

  // Find the last assistant (AI) message to include the analysis
  const assistantMessages = messages.filter(m => m.role === 'assistant')
  const lastAiAnalysis = assistantMessages.length > 1
    ? assistantMessages[assistantMessages.length - 1].content
    : ''

  let summary = `Patient Symptoms: ${userMessages}`
  if (lastAiAnalysis) {
    summary += `\n\nAI Health Analysis:\n${lastAiAnalysis}`
  }
  return summary.slice(0, 1200)
}
