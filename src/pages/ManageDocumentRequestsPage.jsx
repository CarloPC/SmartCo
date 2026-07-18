
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Clock, CheckCircle2, XCircle, PackageCheck, Loader2,
  ChevronDown, ChevronUp, Search, ArrowUpDown, Users2,
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import documentRequestService from '../services/documentRequestService'
import { PUROKS_ILIHAN } from '../constants/puroks'

const tabs = ['pending', 'approved', 'rejected', 'completed', 'all']

const STATUS_STYLES = {
  pending:   { icon: Clock,        label: 'Pending',   dark: 'bg-yellow-900/40 text-yellow-300', light: 'bg-yellow-100 text-yellow-700' },
  approved:  { icon: CheckCircle2, label: 'Approved',  dark: 'bg-green-900/40 text-green-300',   light: 'bg-green-100 text-green-700' },
  rejected:  { icon: XCircle,      label: 'Rejected',  dark: 'bg-red-900/40 text-red-300',       light: 'bg-red-100 text-red-700' },
  completed: { icon: PackageCheck, label: 'Completed', dark: 'bg-blue-900/40 text-blue-300',     light: 'bg-blue-100 text-blue-700' },
}

const StatusBadge = ({ status, isDarkMode }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isDarkMode ? s.dark : s.light}`}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  )
}

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—'

const RequestRow = ({ request, isDarkMode, onApprove, onReject, onComplete, processing }) => {
  const [expanded, setExpanded] = useState(false)
  const [remarks, setRemarks] = useState('')

  const cardBg = isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
  const docLabel = request.documentType === 'Other' && request.otherDocument
    ? request.otherDocument
    : request.documentType

  return (
    <div className={`${cardBg} backdrop-blur-lg rounded-xl border shadow-lg p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-full flex-shrink-0 ${isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
            <FileText className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {docLabel} <span className={isDarkMode ? 'text-gray-500 font-normal' : 'text-gray-400 font-normal'}>· {request.residentName || 'Unknown resident'}</span>
            </p>
            <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{request.purpose}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <StatusBadge status={request.status} isDarkMode={isDarkMode} />
              {request.purok && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                  {request.purok}
                </span>
              )}
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Requested {formatDate(request.requestedAt)}
              </span>
              {request.preferredClaimDate && (
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  · Claim by {formatDate(request.preferredClaimDate)}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(p => !p)}
          className={`p-1.5 rounded-lg transition ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className={`p-3 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div>
              <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Resident Email</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{request.residentEmail || '—'}</p>
            </div>
            <div>
              <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Resident Phone</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{request.residentPhone || '—'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Purpose</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{request.purpose}</p>
            </div>
            {request.notes && (
              <div className="sm:col-span-2">
                <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Additional Notes</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{request.notes}</p>
              </div>
            )}
          </div>

          {request.remarks && (
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Remarks on file</p>
              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>{request.remarks}</p>
            </div>
          )}

          {request.status === 'pending' && (
            <div className="space-y-2">
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="Optional remarks to the resident (e.g. Ready for pickup on July 25.)"
                className={`w-full px-3 py-2 rounded-xl border text-sm resize-none ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onApprove(request.id, remarks)}
                  disabled={processing === request.id}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-sm transition ${
                    isDarkMode ? 'bg-green-900/40 hover:bg-green-900/60 text-green-300 border border-green-800/40' : 'bg-green-100 hover:bg-green-200 text-green-700'
                  } disabled:opacity-50`}
                >
                  {processing === request.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Approve
                </button>
                <button
                  onClick={() => onReject(request.id, remarks)}
                  disabled={processing === request.id}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-sm transition ${
                    isDarkMode ? 'bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800/40' : 'bg-red-100 hover:bg-red-200 text-red-700'
                  } disabled:opacity-50`}
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          )}

          {request.status === 'approved' && (
            <button
              onClick={() => onComplete(request.id)}
              disabled={processing === request.id}
              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-sm transition ${
                isDarkMode ? 'bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 border border-blue-800/40' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              } disabled:opacity-50`}
            >
              {processing === request.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}
              Mark as Claimed / Completed
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const ManageDocumentRequestsPage = () => {
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [purokFilter, setPurokFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  // Only Admin and Barangay Official may manage requests
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'barangay_official') {
      navigate('/home', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    const unsubscribe = documentRequestService.subscribeToAllRequests((items) => {
      setRequests(items)
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleApprove = async (id, remarks) => {
    setProcessing(id)
    try {
      await documentRequestService.approveRequest(id, remarks)
    } catch (e) {
      alert('Failed to approve: ' + e.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id, remarks) => {
    if (!confirm('Reject this document request?')) return
    setProcessing(id)
    try {
      await documentRequestService.rejectRequest(id, remarks)
    } catch (e) {
      alert('Failed to reject: ' + e.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleComplete = async (id) => {
    setProcessing(id)
    try {
      await documentRequestService.markCompleted(id)
    } catch (e) {
      alert('Failed to mark as completed: ' + e.message)
    } finally {
      setProcessing(null)
    }
  }

  const documentTypeOptions = useMemo(() => {
    const set = new Set(requests.map(r => r.documentType).filter(Boolean))
    return Array.from(set)
  }, [requests])

  const filtered = useMemo(() => {
    let list = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(r => (r.residentName || '').toLowerCase().includes(q))
    }
    if (purokFilter) list = list.filter(r => r.purok === purokFilter)
    if (typeFilter) list = list.filter(r => r.documentType === typeFilter)

    list = [...list].sort((a, b) => {
      const diff = new Date(a.requestedAt) - new Date(b.requestedAt)
      return sortOrder === 'newest' ? -diff : diff
    })

    return list
  }, [requests, activeTab, search, purokFilter, typeFilter, sortOrder])

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${
          isDarkMode ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95' : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85'
        }`} />
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className={`${
          isDarkMode ? 'bg-gradient-to-r from-blue-900/90 to-indigo-950/90 border-gray-700/50' : 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 border-white/20'
        } backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center gap-3 mb-1">
            <FileText className="w-6 h-6" />
            <h2 className="text-xl font-bold">Document Requests</h2>
            {pendingCount > 0 && (
              <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </div>
          <p className={isDarkMode ? 'text-blue-200' : 'text-blue-100'}>
            Review, approve, and manage residents' barangay document requests
          </p>
        </div>

        {/* Search & Filters */}
        <div className={`${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-xl border shadow-lg p-3 space-y-3`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by resident name..."
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={purokFilter}
              onChange={(e) => setPurokFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">All Puroks</option>
              {PUROKS_ILIHAN.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">All Document Types</option>
              {documentTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button
              onClick={() => setSortOrder(o => o === 'newest' ? 'oldest' : 'newest')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" /> {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-xl border shadow-lg p-3`}>
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map(tab => {
              const count = tab === 'all' ? requests.length : requests.filter(r => r.status === tab).length
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap capitalize transition flex items-center gap-1.5 ${
                    activeTab === tab
                      ? isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'
                      : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab
                      ? isDarkMode ? 'bg-blue-800 text-blue-300' : 'bg-blue-500 text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className={`${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-xl border p-10 text-center shadow-lg`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading requests…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(req => (
              <RequestRow
                key={req.id}
                request={req}
                isDarkMode={isDarkMode}
                onApprove={handleApprove}
                onReject={handleReject}
                onComplete={handleComplete}
                processing={processing}
              />
            ))}
          </div>
        ) : (
          <div className={`${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-xl border p-10 text-center shadow-lg`}>
            <Users2 className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No {activeTab === 'all' ? '' : activeTab} document requests found
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageDocumentRequestsPage
