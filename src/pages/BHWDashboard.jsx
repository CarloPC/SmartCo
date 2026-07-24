import FoodAidProjectionChart from '../components/FoodAidProjectionChart'
import EventAttendanceChart from '../components/EventAttendanceChart'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Search, Stethoscope, Sparkles, Clock3, UserRound, MapPin, CheckCircle2, ArrowRight, Loader2, Loader, Filter, X, Bot, ChevronUp, ChevronDown } from 'lucide-react'
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
 const [triageExpanded, setTriageExpanded] = useState(true)
const [isAnimating, setIsAnimating] = useState(false)
  const [selectedHistoryRequest, setSelectedHistoryRequest] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('recent')
  const [scheduleError, setScheduleError] = useState('')
 const [triageSummary, setTriageSummary] = useState('')
const [loadingSummary, setLoadingSummary] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedTriageIds, setExpandedTriageIds] = useState(new Set())
const [floatingResident, setFloatingResident] = useState(null)
const [lastTap, setLastTap] = useState(0)
  const [historyActionLoading, setHistoryActionLoading] = useState(false)

  const toggleTriageExpand = (requestId) => {
    setExpandedTriageIds((prev) => {
      const next = new Set(prev)
      if (next.has(requestId)) {
        next.delete(requestId)
      } else {
        next.add(requestId)
      }
      return next
    })
  }

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
      setLoading(false)
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

  useEffect(() => {
  if (!selectedRequest) return

  setIsAnimating(true)
  setTriageExpanded(true)

  const timer = setTimeout(() => {
    setIsAnimating(false)
  }, 350)

  return () => clearTimeout(timer)
}, [selectedRequest?.id])

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

  setLoadingSummary(true)

  setTriageSummary('')

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

       const summary =
result.text?.slice(0,320)
||
'Triage summary will appear here.'

setTimeout(()=>{

setTriageSummary(summary)

setLoadingSummary(false)

},250)
      } catch(err){

setLoadingSummary(false)

setTriageSummary(
'Unable to generate a triage summary right now. Please review manually.'
)

}
    }

    generateSummary()
  }, [selectedRequest])

  const filteredHistory = useMemo(() => {
    const searchTerm = search.toLowerCase()
    const filtered = processedRequests.filter((request) => {
      const residentName = (request.residentName || '').toLowerCase()
      const status = (request.status || '').toLowerCase()
      const purok = (request.purok || '').toLowerCase()
      const matchesSearch = residentName.includes(searchTerm) || status.includes(searchTerm) || purok.includes(searchTerm)
      const matchesFilter = statusFilter === 'all' || request.status === statusFilter
      return matchesSearch && matchesFilter
    })

    const getRecentTimestamp = (request) =>
      new Date(request.updatedAt || request.reviewedAt || request.createdAt || 0).getTime()
    const getCreatedTimestamp = (request) =>
      new Date(request.createdAt || request.requestedAt || 0).getTime()

    return [...filtered].sort((a, b) => {
      if (sortOrder === 'dateCreated') {
        return getCreatedTimestamp(b) - getCreatedTimestamp(a)
      }
      return getRecentTimestamp(b) - getRecentTimestamp(a)
    })
  }, [processedRequests, search, statusFilter, sortOrder])

  const getStatusBadgeClass = (status) => {
    if (status === 'rejected') return 'border-rose-400/40 bg-rose-500/15 text-rose-200'
    if (status === 'inreview') return 'border-blue-400/40 bg-blue-500/15 text-blue-200'
    if (['scheduled', 'completed'].includes(status)) {
      return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
    }
    return 'border-white/20 bg-white/10 text-white/80'
  }

  const getStatusLabel = (status) => {
    if (status === 'inreview') return 'In Review'
    if (!status) return 'Processed'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

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
      setFloatingResident(null)
setSelectedRequest(null)
      setReviewMessage('')
      setTriageSummary('')
      setScheduleError('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkHistoryStatus = async (newStatus) => {
    if (!selectedHistoryRequest) return
    setHistoryActionLoading(true)
    try {
      await updateHealthRequestStatus(selectedHistoryRequest.id, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...(newStatus === 'inreview'
          ? { reviewedAt: new Date().toISOString(), reviewedBy: user?.fullName || 'BHW' }
          : {}),
      })
      setSelectedHistoryRequest((prev) => (prev ? { ...prev, status: newStatus } : prev))
    } finally {
      setHistoryActionLoading(false)
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
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Barangay Ilihan Health Operations</h1>
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
        <section
className={`
grid
gap-4
lg:grid-cols-[1.1fr_0.9fr]

transition-all

duration-500

${
floatingResident

?

"blur-[2px] scale-[.99]"

:

"blur-0 scale-100"

}
`}
>
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
                {pendingRequests.map((request) => {
                  const isExpanded = expandedTriageIds.has(request.id)
                  return (
                    <div
key={request.id}
className={`overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)]
${
selectedRequest?.id===request.id
? "border-cyan-400/70 bg-cyan-500/10 shadow-[0_0_35px_rgba(34,211,238,.35)] scale-[1.01]"
: "border-white/15 bg-white/5 hover:border-cyan-300/40 hover:bg-white/10"
}`}
>
                      {/*  Minimized header: name, purok, date only  */}
                      <button
                        type="button"
                        onClick={() => {

const now = Date.now()

if (selectedRequest?.id !== request.id) {
    setSelectedRequest(request)
}

setTriageExpanded(true)

toggleTriageExpand(request.id)

if (now - lastTap < 300) {
    setFloatingResident(request)
}

setLastTap(now)

}}
                       className="
flex
w-full
items-center
justify-between
gap-3
p-4
text-left

transition-all

duration-500

ease-[cubic-bezier(.22,1,.36,1)]

hover:bg-white/5

hover:scale-[1.02]
hover:-translate-y-2
hover:shadow-[0_20px_45px_rgba(0,0,0,.35)]
ring-2
ring-cyan-400/40

hover:-translate-y-1

active:scale-[.98]
"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <UserRound className="h-4 w-4 shrink-0 text-emerald-300" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{request.residentName || 'Resident'}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/60">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {request.purok || 'Unassigned'}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" />
                                {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : 'Recently submitted'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end">
    {selectedRequest?.id === request.id && (
        <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,.8)] animate-pulse" />
    )}
</div>
                      </button>

                      {/*  Expanded detail: full data + close button  */}
                      <div
className={`grid transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)]
${
isExpanded
? "grid-rows-[1fr] opacity-100"
: "grid-rows-[0fr] opacity-0"
}`}
>

<div className="overflow-hidden">
                        <div
className={`border-t border-white/10 px-4 pb-4 pt-3
transition-all duration-500
ease-[cubic-bezier(.22,1,.36,1)]
${
isExpanded
? "translate-y-0 scale-100"
: "-translate-y-2 scale-95"
}`}
>
                         
                          <p className="text-sm leading-6 text-white/70">
                            {request.symptoms || 'Resident requested a health consultation.'}
                          </p>
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700"
                            >
                              Review & schedule
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className={`${card} p-5`}>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-300" />
              <h2 className="text-lg font-semibold text-white">AI Triage Summary</h2>
            </div>
            {selectedRequest ? (
              <div
className={`
space-y-4

transition-all

duration-700

ease-[cubic-bezier(.22,1,.36,1)]

${
isAnimating

?

"opacity-0 translate-y-3 scale-95"

:

"opacity-100 translate-y-0 scale-100"

}
`}
>
                {/*  Minimized header: name, purok, date only  */}
                <button
                  type="button"
                  onClick={() => setTriageExpanded((prev) => !prev)}
                  className="
flex
w-full
items-center
justify-between
gap-3
p-4
text-left

transition-all

duration-500

ease-[cubic-bezier(.22,1,.36,1)]

hover:bg-white/5

hover:scale-[1.02]
hover:-translate-y-2
hover:shadow-[0_20px_45px_rgba(0,0,0,.35)]
ring-2
ring-cyan-400/40

hover:-translate-y-1

active:scale-[.98]
"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Selected resident</p>
                    <p className="mt-1 truncate text-sm text-white/70">{selectedRequest.residentName || 'Resident'}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/50">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {selectedRequest.purok || 'Unassigned'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {selectedRequest.requestedAt ? new Date(selectedRequest.requestedAt).toLocaleString() : 'Recently submitted'}
                      </span>
                    </div>
                  </div>
                  {triageExpanded ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-white/50" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-white/50" />
                  )}
                </button>

                {/*  Expanded detail: full data + close button  */}
                {triageExpanded && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setTriageExpanded(false)}
                        aria-label="Close"
                        className="rounded-full p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                      {selectedRequest.preferredAppointmentDate && (
                        <p className="text-sm text-white/60">
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
                    <div
className={`
rounded-2xl
border
border-cyan-400/20
bg-white/5
p-4
backdrop-blur-sm

transition-all

duration-500

ease-[cubic-bezier(.22,1,.36,1)]

${
loadingSummary
? "scale-[.98] opacity-70"
: "scale-100 opacity-100 shadow-[0_0_25px_rgba(34,211,238,.18)]"
}
`}
>
                      <p className="text-sm font-semibold text-white">Suggested summary</p>
                     {loadingSummary ? (

<div className="space-y-3 animate-pulse">

<div className="h-4 w-full rounded-full bg-white/10"/>

<div className="h-4 w-5/6 rounded-full bg-white/10"/>

<div className="h-4 w-4/6 rounded-full bg-white/10"/>

<div className="h-4 w-3/4 rounded-full bg-white/10"/>

</div>

):(

<p className="mt-2 text-sm leading-6 text-white/70">

{triageSummary}

</p>

)}
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
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/20 py-10 text-center text-sm text-white/60">
                Select a pending request to view the AI-generated summary and schedule a visit.
              </div>
            )}
          </div>
        </section>
{floatingResident && (

<div
className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 backdrop-blur-sm animate-in fade-in duration-300"

onClick={()=>{
setFloatingResident(null)
setSelectedRequest(null)
}}
>

<div

onClick={(e)=>e.stopPropagation()}

className="
relative
w-[720px]
max-w-[95vw]
rounded-3xl

border

border-cyan-400/30

bg-slate-900/95

shadow-[0_0_60px_rgba(34,211,238,.25)]

backdrop-blur-2xl

animate-in

zoom-in-95

duration-300

"

>

<div className="p-6">

<div className="flex justify-between items-start">

<div>

<h2 className="text-xl font-bold text-white">

{floatingResident.residentName}

</h2>

<p className="text-sm text-white/60">

{floatingResident.purok}

</p>

</div>

<button

onClick={()=>{
setFloatingResident(null)
}}

className="
h-10
w-10
rounded-full

border

border-red-400/40

bg-red-500/20

text-red-300

transition-all

duration-300

hover:bg-red-500

hover:text-white

hover:rotate-90

hover:scale-110

hover:shadow-[0_0_30px_rgba(239,68,68,.7)]
"

>

<X className="mx-auto h-5 w-5"/>

</button>

</div>

<div className="mt-6">

<p className="text-white/70 leading-7">

{floatingResident.symptoms}

</p>

</div>

<div className="mt-8 flex justify-end">

<button

onClick={()=>{
setFloatingResident(null)
}}

className="
rounded-full

bg-cyan-500

px-5

py-2

font-semibold

text-white

transition-all

duration-300

hover:scale-105

hover:shadow-[0_0_30px_rgba(34,211,238,.45)]
"

>

Continue Review →

</button>

</div>

</div>

</div>

</div>

)}
        {/* ── History + analytics ── */}
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className={`${card} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Patient History Logs</h2>
                <p className="text-sm text-white/60">Previously processed requests and outcomes</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
                  <Search className="h-4 w-4 text-white/50" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search"
                    className="w-24 bg-transparent text-white placeholder-white/40 outline-none sm:w-40"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
                  <Filter className="h-4 w-4 text-white/50" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-white outline-none [&>option]:text-gray-900"
                  >
                    <option value="all">All statuses</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="inreview">In Review</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
                  <Clock3 className="h-4 w-4 text-white/50" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="bg-transparent text-white outline-none [&>option]:text-gray-900"
                  >
                    <option value="recent">Most recent</option>
                    <option value="dateCreated">Date created</option>
                  </select>
                </div>
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
                      <tr
                        key={request.id}
                        onClick={() => setSelectedHistoryRequest(request)}
                        className="cursor-pointer border-t border-white/10 text-white/80 transition hover:bg-white/5"
                      >
                        <td className="py-3 pr-3 font-medium">{request.residentName || 'Resident'}</td>
                        <td className="py-3 pr-3">{request.scheduledAt || request.updatedAt ? new Date(request.scheduledAt || request.updatedAt).toLocaleDateString() : '—'}</td>
                        <td className="py-3 pr-3">{request.purok || 'Unassigned'}</td>
                        <td className="py-3">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusBadgeClass(request.status)}`}>
                            {getStatusLabel(request.status)}
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

      {/* ── Patient history detail modal ── */}
      {selectedHistoryRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedHistoryRequest(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/15 bg-gradient-to-br from-slate-900/95 via-indigo-950/95 to-blue-950/95 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-emerald-300" />
                  <h3 className="text-lg font-bold text-white">
                    {selectedHistoryRequest.residentName || 'Resident'}
                  </h3>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/60">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {selectedHistoryRequest.purok || 'Unassigned'}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusBadgeClass(selectedHistoryRequest.status)}`}
                  >
                    {getStatusLabel(selectedHistoryRequest.status)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedHistoryRequest(null)}
                className="rounded-lg border border-white/20 bg-white/10 p-2 text-white/70 transition hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedHistoryRequest.status === 'scheduled' && (
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleMarkHistoryStatus('inreview')}
                  disabled={historyActionLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-400/40 bg-blue-500/15 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {historyActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Mark as In Review
                </button>
              </div>
            )}

            {selectedHistoryRequest.status === 'inreview' && (
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleMarkHistoryStatus('completed')}
                  disabled={historyActionLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {historyActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Mark as Complete
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">Resident's symptoms / request</p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {selectedHistoryRequest.symptoms || 'No details provided.'}
                </p>
                {selectedHistoryRequest.preferredAppointmentDate && (
                  <p className="mt-2 text-sm text-white/60">
                    Requested slot: {selectedHistoryRequest.preferredAppointmentDate}
                    {selectedHistoryRequest.preferredAppointmentTime ? ` at ${selectedHistoryRequest.preferredAppointmentTime}` : ''}
                  </p>
                )}
              </div>

              {selectedHistoryRequest.groqSummary && (
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">AI triage summary</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">{selectedHistoryRequest.groqSummary}</p>
                </div>
              )}

              {selectedHistoryRequest.reviewMessage && (
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">BHW review note</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">{selectedHistoryRequest.reviewMessage}</p>
                  <p className="mt-2 text-xs text-white/40">
                    {selectedHistoryRequest.reviewedBy ? `Reviewed by ${selectedHistoryRequest.reviewedBy}` : ''}
                    {selectedHistoryRequest.reviewedAt ? ` · ${new Date(selectedHistoryRequest.reviewedAt).toLocaleString()}` : ''}
                  </p>
                </div>
              )}

              {Array.isArray(selectedHistoryRequest.aiConversation) && selectedHistoryRequest.aiConversation.length > 0 ? (
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-300" />
                    <p className="text-sm font-semibold text-white">AI health conversation</p>
                  </div>
                  <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                    {selectedHistoryRequest.aiConversation.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'rounded-br-sm bg-blue-600 text-white'
                              : 'rounded-bl-sm border border-white/15 bg-white/10 text-white/85'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/20 py-6 text-center text-sm text-white/50">
                  No AI chat conversation was recorded for this request.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BHWDashboard