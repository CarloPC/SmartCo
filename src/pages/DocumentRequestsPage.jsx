
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Plus, Clock, CheckCircle2, XCircle, PackageCheck,
  Loader2, ArrowLeft, Calendar, ClipboardList,
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import documentRequestService from '../services/documentRequestService'

const card =
  'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all duration-300 hover:border-white/40 hover:shadow-blue-500/10'

const STATUS_STYLES = {
  pending:   { icon: Clock,        label: 'Pending',   cls: 'bg-yellow-400/20 text-yellow-200 border-yellow-300/30' },
  approved:  { icon: CheckCircle2, label: 'Approved',  cls: 'bg-green-400/20 text-green-200 border-green-300/30' },
  rejected:  { icon: XCircle,      label: 'Rejected',  cls: 'bg-red-400/20 text-red-200 border-red-300/30' },
  completed: { icon: PackageCheck, label: 'Completed', cls: 'bg-blue-400/20 text-blue-200 border-blue-300/30' },
}

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  )
}

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—'

const RequestCard = ({ request }) => {
  const docLabel = request.documentType === 'Other' && request.otherDocument
    ? request.otherDocument
    : request.documentType

  return (
    <div className={`${card} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 border border-white/20">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white truncate">{docLabel}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/50">
              <Calendar className="h-3 w-3" /> Requested {formatDate(request.requestedAt)}
            </p>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="mt-4 space-y-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-white/50">
            <ClipboardList className="h-3 w-3" /> Purpose
          </p>
          <p className="mt-1 text-sm text-white/80">{request.purpose || '—'}</p>
        </div>

        {request.preferredClaimDate && (
          <p className="text-xs text-white/50">
            Preferred claim date: <span className="text-white/70 font-medium">{formatDate(request.preferredClaimDate)}</span>
          </p>
        )}

        {request.remarks && (
          <div className={`rounded-xl border p-3 ${
            request.status === 'rejected'
              ? 'border-red-300/20 bg-red-500/10'
              : 'border-blue-300/20 bg-blue-500/10'
          }`}>
            <p className={`text-xs font-medium ${request.status === 'rejected' ? 'text-red-200' : 'text-blue-200'}`}>
              Remarks from barangay office
            </p>
            <p className="mt-1 text-sm text-white/80">{request.remarks}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40 pt-1">
          {request.approvedAt && <span>Approved {formatDate(request.approvedAt)}</span>}
          {request.rejectedAt && <span>Rejected {formatDate(request.rejectedAt)}</span>}
          {request.completedAt && <span>Completed {formatDate(request.completedAt)}</span>}
        </div>
      </div>
    </div>
  )
}

const DocumentRequestsPage = () => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const unsubscribe = documentRequestService.subscribeToMyRequests((items) => {
      setRequests(items)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const tabs = ['all', 'pending', 'approved', 'rejected', 'completed']
  const filtered = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab)

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${isDarkMode
          ? 'bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-indigo-950/95'
          : 'bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-800/90'}`}
        />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
        <button onClick={() => navigate('/home')} className="flex items-center space-x-2 text-sm font-medium text-white/80 transition hover:text-white">
          <ArrowLeft className="w-4 h-4" /><span>Back to Home</span>
        </button>

        <section className={`${card} overflow-hidden bg-gradient-to-r from-indigo-500/30 via-blue-500/20 to-sky-500/30`}>
          <div className="flex flex-col gap-5 p-5 sm:p-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">My Document Requests</h2>
              <p className="mt-1 text-sm text-white/70">Track the status of documents you've requested from the barangay.</p>
            </div>
            <button
              onClick={() => navigate('/documents/new')}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4" /> New Request
            </button>
          </div>
        </section>

        {/* Tabs */}
        <div className={`${card} p-3`}>
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map(tab => {
              const count = tab === 'all' ? requests.length : requests.filter(r => r.status === tab).length
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                    activeTab === tab ? 'bg-white/25 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab}
                  <span className={`rounded-full px-1.5 py-0.5 text-xs ${activeTab === tab ? 'bg-white/20' : 'bg-white/10'}`}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className={`${card} p-10 text-center`}>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-white" />
            <p className="mt-3 text-sm text-white/60">Loading your requests…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(req => <RequestCard key={req.id} request={req} />)}
          </div>
        ) : (
          <div className={`${card} p-10 text-center`}>
            <FileText className="mx-auto mb-3 h-12 w-12 text-white/30" />
            <p className="text-sm text-white/60">No {activeTab === 'all' ? '' : activeTab} document requests yet.</p>
            <button
              onClick={() => navigate('/documents/new')}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <Plus className="h-4 w-4" /> Request a Document
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentRequestsPage
