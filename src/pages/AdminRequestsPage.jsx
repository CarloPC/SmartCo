import { useState, useEffect } from 'react'
import { Shield, Clock, CheckCircle, XCircle, Loader2, Users2, ChevronDown, ChevronUp } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import adminRequestService from '../services/adminRequestService'

const tabs = ['all', 'pending', 'approved', 'rejected']

const StatusBadge = ({ status, isDarkMode }) => {
  const map = {
    pending:  { icon: Clock,         label: 'Pending',  cls: isDarkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-700' },
    approved: { icon: CheckCircle,   label: 'Approved', cls: isDarkMode ? 'bg-green-900/40 text-green-300'  : 'bg-green-100 text-green-700'  },
    rejected: { icon: XCircle,       label: 'Rejected', cls: isDarkMode ? 'bg-red-900/40 text-red-300'      : 'bg-red-100 text-red-700'      },
  }
  const { icon: Icon, label, cls } = map[status] || map.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  )
}

const RequestCard = ({ request, isDarkMode, onApprove, onReject, processing }) => {
  const [expanded, setExpanded] = useState(false)
  const [reviewNote, setReviewNote] = useState('')

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  const cardBg = isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'

  return (
    <div className={`${cardBg} backdrop-blur-lg rounded-xl border shadow-lg p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-full flex-shrink-0 ${
            isDarkMode ? 'bg-purple-900/40' : 'bg-purple-100'
          }`}>
            <Shield className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {request.fullName || 'Unknown User'}
            </p>
            <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{request.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <StatusBadge status={request.status} isDarkMode={isDarkMode} />
              {request.purok && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>{request.purok}</span>
              )}
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {formatDate(request.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(p => !p)}
          className={`p-1.5 rounded-lg transition ${
            isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          {/* Reason */}
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reason</p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{request.reason}</p>
          </div>

          {/* Review note if reviewed */}
          {request.reviewNote && (
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Admin Note</p>
              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>{request.reviewNote}</p>
            </div>
          )}

          {/* Approve / Reject actions — only for pending */}
          {request.status === 'pending' && (
            <div className="space-y-2">
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={2}
                placeholder="Optional note to the requester…"
                className={`w-full px-3 py-2 rounded-xl border text-sm resize-none ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-purple-500 transition`}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onApprove(request.id, reviewNote)}
                  disabled={processing === request.id}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-sm transition ${
                    isDarkMode
                      ? 'bg-green-900/40 hover:bg-green-900/60 text-green-300 border border-green-800/40'
                      : 'bg-green-100 hover:bg-green-200 text-green-700'
                  } disabled:opacity-50`}
                >
                  {processing === request.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => onReject(request.id, reviewNote)}
                  disabled={processing === request.id}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-sm transition ${
                    isDarkMode
                      ? 'bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800/40'
                      : 'bg-red-100 hover:bg-red-200 text-red-700'
                  } disabled:opacity-50`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const AdminRequestsPage = () => {
  const { isDarkMode } = useTheme()
  const [requests, setRequests] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  const [isLoading, setIsLoading] = useState(true)
  const [processing, setProcessing] = useState(null)

  useEffect(() => { fetchRequests() }, [])

  const fetchRequests = async () => {
    setIsLoading(true)
    const data = await adminRequestService.getAllRequests()
    setRequests(data)
    setIsLoading(false)
  }

  const handleApprove = async (id, note) => {
    if (!confirm('Approve this admin access request? The user will be promoted to Administrator.')) return
    setProcessing(id)
    try {
      await adminRequestService.approveRequest(id, note)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', reviewNote: note } : r))
    } catch (e) {
      alert('Failed to approve: ' + e.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id, note) => {
    if (!confirm('Reject this admin access request?')) return
    setProcessing(id)
    try {
      await adminRequestService.rejectRequest(id, note)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', reviewNote: note } : r))
    } catch (e) {
      alert('Failed to reject: ' + e.message)
    } finally {
      setProcessing(null)
    }
  }

  const filtered = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95'
            : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85'
        }`} />
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className={`${
          isDarkMode
            ? 'bg-gradient-to-r from-purple-900/90 to-indigo-950/90 border-gray-700/50'
            : 'bg-gradient-to-r from-purple-600/90 to-indigo-600/90 border-white/20'
        } backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-6 h-6" />
            <h2 className="text-xl font-bold">Admin Access Requests</h2>
            {pendingCount > 0 && (
              <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
          <p className={isDarkMode ? 'text-purple-200' : 'text-purple-100'}>
            Review and manage user requests for administrator access
          </p>
        </div>

        {/* Tabs */}
        <div className={`${
          isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
        } backdrop-blur-lg rounded-xl border shadow-lg p-3`}>
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map(tab => {
              const count = tab === 'all' ? requests.length : requests.filter(r => r.status === tab).length
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap capitalize transition flex items-center gap-1.5 ${
                    activeTab === tab
                      ? isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-600 text-white'
                      : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab
                      ? isDarkMode ? 'bg-purple-800 text-purple-300' : 'bg-purple-500 text-white'
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
          <div className={`${
            isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
          } backdrop-blur-lg rounded-xl border p-10 text-center shadow-lg`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading requests…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(req => (
              <RequestCard
                key={req.id}
                request={req}
                isDarkMode={isDarkMode}
                onApprove={handleApprove}
                onReject={handleReject}
                processing={processing}
              />
            ))}
          </div>
        ) : (
          <div className={`${
            isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
          } backdrop-blur-lg rounded-xl border p-10 text-center shadow-lg`}>
            <Users2 className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No {activeTab === 'all' ? '' : activeTab} requests found
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminRequestsPage
