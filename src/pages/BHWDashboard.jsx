import FoodAidProjectionChart from '../components/FoodAidProjectionChart'
import EventAttendanceChart from '../components/EventAttendanceChart'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Search, Stethoscope, Sparkles, Clock3, UserRound, MapPin, CheckCircle2, ArrowRight, Loader2, Loader } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import toledoImage from '../assets/Toledo.jpg'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  subscribeToPendingRequests,
  subscribeToProcessedRequests,
  subscribeToHealthRequestAnalytics,
  updateHealthRequestStatus,
} from '../services/bhwService'
import { sendHealthMessage } from '../services/aiHealthService'

const BHWDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDarkMode } = useTheme()

  const [pendingRequests, setPendingRequests] = useState([])
  const [processedRequests, setProcessedRequests] = useState([])
  const [analyticsData, setAnalyticsData] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [scheduleError, setScheduleError] = useState('')
  const [triageSummary, setTriageSummary] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.role !== 'bhw') {
      navigate('/home', { replace: true })
      return
    }

    const unsubscribePending = subscribeToPendingRequests((requests) => {
      setPendingRequests(requests)
      setLoading(false)
    })

    const unsubscribeProcessed = subscribeToProcessedRequests((requests) => {
      setProcessedRequests(requests)
    })

    const unsubscribeAnalytics = subscribeToHealthRequestAnalytics((requests) => {
      const counts = requests.reduce((acc, item) => {
        const purok = item.purok || 'Unassigned'
        acc[purok] = (acc[purok] || 0) + 1
        return acc
      }, {})

      setAnalyticsData(Object.entries(counts).map(([name, value]) => ({ name, value })))
    })

    return () => {
      unsubscribePending()
      unsubscribeProcessed()
      unsubscribeAnalytics()
    }
  }, [user?.role, navigate])

  const preferredRequestedSlot = useMemo(() => {
    if (!selectedRequest?.preferredAppointmentDate) return ''
    const date = selectedRequest.preferredAppointmentDate
    const time = selectedRequest.preferredAppointmentTime || ''
    return `${date}${time ? ` ${time}` : ''}`
  }, [selectedRequest])

  const requestedSlotTaken = useMemo(() => {
    if (!selectedRequest?.preferredAppointmentDate) return false
    return processedRequests.some((request) => {
      if (request.status !== 'scheduled') return false
      const requestedFull = preferredRequestedSlot
      if (!requestedFull) return false
      return request.scheduledAt === requestedFull
    })
  }, [processedRequests, preferredRequestedSlot, selectedRequest])

  useEffect(() => {
    if (!selectedRequest) return

    setReviewMessage('')
    setScheduleError('')

    const generateSummary = async () => {
      try {
        const promptParts = [
          `Resident: ${selectedRequest.residentName || 'Resident'}`,
          `Purok: ${selectedRequest.purok || 'Unassigned'}`,
          `Symptoms: ${selectedRequest.symptoms || 'Resident requested a health checkup.'}`,
          selectedRequest.preferredAppointmentDate
            ? `Preferred appointment: ${selectedRequest.preferredAppointmentDate}${selectedRequest.preferredAppointmentTime ? ` at ${selectedRequest.preferredAppointmentTime}` : ''}`
            : 'Preferred appointment: not provided',
          selectedRequest.healthAssessment?.vitalsSummary
            ? `Assessment summary: ${selectedRequest.healthAssessment.vitalsSummary}`
            : '',
          selectedRequest.healthAssessment?.recommendations?.length
            ? `Recommendations: ${selectedRequest.healthAssessment.recommendations.join(' | ')}`
            : '',
        ].filter(Boolean)

        const result = await sendHealthMessage([
          { role: 'user', content: promptParts.join('\n') },
        ], {
          name: selectedRequest.residentName || 'Resident',
          purok: selectedRequest.purok || 'barangay',
        })

        const summary = result.text?.slice(0, 320) || 'Triage summary will appear here.'
        setTriageSummary(summary)
      } catch (err) {
        setTriageSummary('Unable to generate a triage summary right now. Please review manually.')
      }
    }

    generateSummary()
  }, [selectedRequest])

  const filteredHistory = useMemo(() => {
    const searchTerm = search.toLowerCase()
    return processedRequests.filter((request) => {
      const residentName = (request.residentName || '').toLowerCase()
      const status = (request.status || '').toLowerCase()
      const purok = (request.purok || '').toLowerCase()
      return residentName.includes(searchTerm) || status.includes(searchTerm) || purok.includes(searchTerm)
    })
  }, [processedRequests, search])

  const handleReviewDecision = async (event, decision = 'approve') => {
    event.preventDefault()
    if (!selectedRequest) return

    const requestedSlot = preferredRequestedSlot

    if (decision === 'approve' && !requestedSlot) {
      setScheduleError('This resident did not provide a preferred date and time, so this request cannot be auto-scheduled.')
      return
    }

    if (decision === 'approve' && requestedSlotTaken) {
      setScheduleError('The resident requested a slot that is already scheduled. Please reject and ask them to resubmit with a new date.')
      return
    }

    const finalMessage = decision === 'approve'
      ? `Appointment approved for ${requestedSlot}.`
      : (reviewMessage.trim() || 'The requested date is not available. Please choose another day or one of the available dates.')

    setSubmitting(true)
    try {
      await updateHealthRequestStatus(selectedRequest.id, {
        status: decision === 'approve' ? 'scheduled' : 'rejected',
        scheduledAt: decision === 'approve' ? requestedSlot : null,
        updatedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.fullName || 'BHW',
        reviewMessage: finalMessage,
        reviewDecision: decision,
        triageSummary: triageSummary || selectedRequest.groqSummary || '',
        requestedAppointmentDate: selectedRequest.preferredAppointmentDate || null,
        requestedAppointmentTime: selectedRequest.preferredAppointmentTime || null,
      })
      setSelectedRequest(null)
      setReviewMessage('')
      setTriageSummary('')
      setScheduleError('')
    } finally {
      setSubmitting(false)
    }
  }

  /* glass card — same treatment used on HomePage / other tabs */
  const card =
    'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all duration-300 hover:border-white/40 hover:shadow-blue-500/10'

  const Background = () => (
    <>
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${isDarkMode
          ? 'bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-indigo-950/95'
          : 'bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-800/90'}`}
        />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>
    </>
  )

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <Background />
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className={`${card} px-8 py-10 text-center`}>
            <Loader className="mx-auto mb-4 h-10 w-10 animate-spin text-white" />
            <p className="font-semibold text-white">Loading your BHW workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <Background />

      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">

        {/* ── Hero header ── */}
        <section className={`${card} overflow-hidden bg-gradient-to-r from-indigo-500/30 via-violet-500/20 to-blue-500/30`}>
          <div className="flex flex-col gap-4 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <Stethoscope className="h-3.5 w-3.5 text-emerald-300" />
                BHW Workspace
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Community Health Operations</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                Review requests, triage residents, and schedule follow-up visits from a secure, role-specific dashboard.
              </p>
            </div>
            <div className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-sm">
              <p className="font-semibold text-white/60">Signed in as</p>
              <p className="font-semibold">{user?.fullName || 'Barangay Health Worker'}</p>
            </div>
          </div>
        </section>

        {/* ── Triage tracker + AI summary ── */}
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className={`${card} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Real-Time Checkup Triage Tracker</h2>
                <p className="text-sm text-white/60">Pending review requests from residents</p>
              </div>
              <div className="rounded-full border border-rose-300/30 bg-rose-400/20 px-3 py-1 text-sm font-semibold text-rose-200">
                {pendingRequests.length} pending
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/20 py-10 text-white/60">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading requests...
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 py-10 text-center text-sm text-white/60">
                No requests awaiting triage.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <UserRound className="h-4 w-4 text-emerald-300" />
                          <p className="font-semibold text-white">{request.residentName || 'Resident'}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/60">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {request.purok || 'Unassigned'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-4 w-4" />
                            {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : 'Recently submitted'}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/70">
                          {request.symptoms || 'Resident requested a health consultation.'}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700"
                      >
                        Review & schedule
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${card} p-5`}>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-300" />
              <h2 className="text-lg font-semibold text-white">AI Triage Summary</h2>
            </div>
            {selectedRequest ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">Selected resident</p>
                  <p className="mt-1 text-sm text-white/70">{selectedRequest.residentName || 'Resident'}</p>
                  <p className="mt-1 text-sm text-white/50">{selectedRequest.purok || 'Unassigned'}</p>
                  {selectedRequest.preferredAppointmentDate && (
                    <p className="mt-2 text-sm text-white/60">
                      Preferred appointment requested: {selectedRequest.preferredAppointmentDate}{selectedRequest.preferredAppointmentTime ? ` at ${selectedRequest.preferredAppointmentTime}` : ''}
                    </p>
                  )}
                  {selectedRequest.preferredAppointmentDate && (
                    <p className={`mt-2 text-sm font-medium ${requestedSlotTaken ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {requestedSlotTaken
                        ? 'Requested slot is already taken. Please choose a different date or time.'
                        : 'Requested slot appears available. You can approve it directly.'}
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">Suggested summary</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">{triageSummary || 'Generating professional summary...'}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                  <label className="mb-1 block text-sm font-medium text-white">Reply to resident</label>
                  <textarea
                    value={reviewMessage}
                    onChange={(e) => setReviewMessage(e.target.value)}
                    rows={3}
                    placeholder="If the requested date is not available, mention the alternate dates or available slots."
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none ring-0 backdrop-blur-sm"
                  />
                </div>
                <form onSubmit={(event) => handleReviewDecision(event, 'approve')} className="space-y-3">
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                    <p className="mb-1 text-sm font-medium text-white">Resident's requested date &amp; time</p>
                    {preferredRequestedSlot ? (
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <CalendarDays className="h-4 w-4 text-blue-300" />
                        {selectedRequest.preferredAppointmentDate}
                        {selectedRequest.preferredAppointmentTime && (
                          <>
                            <Clock3 className="h-4 w-4 text-blue-300" />
                            {selectedRequest.preferredAppointmentTime}
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-rose-300">
                        No preferred date/time was submitted with this request.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={submitting || !preferredRequestedSlot}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Confirm Schedule
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={(event) => handleReviewDecision(event, 'reject')}
                      className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Clock3 className="h-4 w-4" />
                      Reject & suggest another date
                    </button>
                  </div>
                  {scheduleError && (
                    <div className="rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                      {scheduleError}
                    </div>
                  )}
                </form>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/20 py-10 text-center text-sm text-white/60">
                Select a pending request to view the AI-generated summary and schedule a visit.
              </div>
            )}
          </div>
        </section>

        {/* ── History + analytics ── */}
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className={`${card} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Patient History Logs</h2>
                <p className="text-sm text-white/60">Previously processed requests and outcomes</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
                <Search className="h-4 w-4 text-white/50" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="w-24 bg-transparent text-white placeholder-white/40 outline-none sm:w-40"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-white/50">
                    <th className="pb-3 font-medium">Resident</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Purok</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-white/50">
                        No history yet.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((request) => (
                      <tr key={request.id} className="border-t border-white/10 text-white/80">
                        <td className="py-3 pr-3 font-medium">{request.residentName || 'Resident'}</td>
                        <td className="py-3 pr-3">{request.scheduledAt || request.updatedAt ? new Date(request.scheduledAt || request.updatedAt).toLocaleDateString() : '—'}</td>
                        <td className="py-3 pr-3">{request.purok || 'Unassigned'}</td>
                        <td className="py-3">
                          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                            {request.status || 'processed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`${card} p-5`}>
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-300" />
              <h2 className="text-lg font-semibold text-white">Requests by Purok</h2>
            </div>
            {analyticsData.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 py-10 text-center text-sm text-white/60">
                Analytics will appear here once health requests are available.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} stroke="rgba(255,255,255,0.1)" />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} stroke="rgba(255,255,255,0.1)" />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(30, 27, 75, 0.85)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(12px)',
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {analyticsData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={index % 2 === 0 ? '#6ee7b7' : '#93c5fd'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}

export default BHWDashboard