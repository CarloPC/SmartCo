
import { useState, useEffect, useMemo } from 'react'
import {
  Shield, Clock, CheckCircle, XCircle, Loader2, Users2, ChevronDown, ChevronUp,
  Search, ArrowUpDown, FileText, ExternalLink, RefreshCw, AlertCircle
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import roleUpgradeService, { REQUESTABLE_ROLES, getRoleLabel } from '../services/roleUpgradeService'
import ProofPreviewModal from '../components/ProofPreviewModal'

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

const RequestCard = ({ request, isDarkMode, onApprove, onReject, processing, canReview, onPreview }) => {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [rejectError, setRejectError] = useState('')

  const handleRejectClick = () => {
    if (!remarks.trim()) {
      setRejectError(t('roleUpgrade.rejectReasonRequired', 'Please provide a reason for rejecting this application.'))
      return
    }
    setRejectError('')
    onReject(request.id, remarks.trim())
  }

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
              {request.isResubmission && (
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
                  isDarkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700'
                }`}>
                  <RefreshCw className="w-3 h-3" /> {t('roleUpgrade.resubmittedBadge', 'Resubmitted')}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isDarkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {getRoleLabel(request.requestedRole)}
              </span>
              {request.purok && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>{request.purok}</span>
              )}
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {formatDate(request.submittedAt)}
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
          {/* Position */}
          {request.position && (
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Position</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{request.position}</p>
            </div>
          )}

          {/* Reason */}
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reason</p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{request.reason}</p>
          </div>

          {/* Notes */}
          {request.notes && (
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Notes</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{request.notes}</p>
            </div>
          )}

          {/* Proof document — thumbnail + click to open the full preview modal */}
          {request.proofFileUrl && (
            <button
              type="button"
              onClick={() => onPreview(request.proofFileUrl, request.proofFileName)}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition w-full text-left ${
                isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center ${
                isDarkMode ? 'bg-gray-900' : 'bg-gray-200'
              }`}>
                {(request.proofFileName || request.proofFileUrl || '').toLowerCase().includes('.pdf') ? (
                  <FileText className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                ) : (
                  <img src={request.proofFileUrl} alt="Proof thumbnail" className="w-full h-full object-cover" />
                )}
              </div>
              <span className={`truncate flex-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                {request.proofFileName || 'View submitted document'}
              </span>
              <ExternalLink className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </button>
          )}

          {/* Review note if reviewed */}
          {request.remarks && request.status !== 'pending' && (
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Admin Remarks</p>
              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>{request.remarks}</p>
            </div>
          )}

          {/* Approve / Reject actions — only for pending, and only for a
              full admin. barangay_official/bhw can view this page (per
              AdminRoute) but can't complete the role promotion, so we show
              a notice instead of buttons that would just fail. */}
          {request.status === 'pending' && canReview && (
            <div className="space-y-2">
              <div>
                <textarea
                  value={remarks}
                  onChange={(e) => { setRemarks(e.target.value); if (rejectError) setRejectError('') }}
                  rows={2}
                  placeholder="Remarks — required if rejecting…"
                  className={`w-full px-3 py-2 rounded-xl border text-sm resize-none ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500 transition`}
                />
                {rejectError && (
                  <p className={`mt-1 flex items-center gap-1.5 text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {rejectError}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onApprove(request.id, remarks)}
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
                  onClick={handleRejectClick}
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

          {request.status === 'pending' && !canReview && (
            <p className={`text-xs italic ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Only a full Administrator can approve or reject role upgrade requests.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const RoleUpgradeRequestsPage = () => {
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const canReview = user?.role === 'admin'
  const [requests, setRequests] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [previewProof, setPreviewProof] = useState(null) // { url, fileName } | null

  useEffect(() => { fetchRequests() }, [])

  const fetchRequests = async () => {
    setIsLoading(true)
    const data = await roleUpgradeService.getAllRequests()
    setRequests(data)
    setIsLoading(false)
  }

  const handleApprove = async (id, remarks) => {
    if (!confirm('Approve this role upgrade request? The user\'s role will be updated immediately.')) return
    setProcessing(id)
    try {
      await roleUpgradeService.approveRequest(id, remarks)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', remarks } : r))
    } catch (e) {
      alert('Failed to approve: ' + e.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id, remarks) => {
    if (!confirm('Reject this role upgrade request?')) return
    setProcessing(id)
    try {
      await roleUpgradeService.rejectRequest(id, remarks)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', remarks } : r))
    } catch (e) {
      alert('Failed to reject: ' + e.message)
    } finally {
      setProcessing(null)
    }
  }

  const filtered = useMemo(() => {
    let list = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab)
    if (roleFilter !== 'all') list = list.filter(r => r.requestedRole === roleFilter)
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase()
      list = list.filter(r =>
        (r.fullName || '').toLowerCase().includes(term) ||
        (r.email || '').toLowerCase().includes(term) ||
        (r.position || '').toLowerCase().includes(term)
      )
    }
    list = [...list].sort((a, b) => {
      const diff = new Date(b.submittedAt) - new Date(a.submittedAt)
      return sortOrder === 'newest' ? diff : -diff
    })
    return list
  }, [requests, activeTab, roleFilter, searchTerm, sortOrder])

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const inputCls = isDarkMode
    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'

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
            <h2 className="text-xl font-bold">Role Upgrade Requests</h2>
            {pendingCount > 0 && (
              <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
          <p className={isDarkMode ? 'text-purple-200' : 'text-purple-100'}>
            Review and manage resident requests to become a Barangay Official or BHW
          </p>
        </div>

        {/* Search + Filters */}
        <div className={`${
          isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
        } backdrop-blur-lg rounded-xl border shadow-lg p-3 space-y-3`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or position…"
              className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm ${inputCls} focus:outline-none focus:ring-2 focus:ring-purple-500 transition`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status tabs */}
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map(tab => {
                const count = tab === 'all' ? requests.length : requests.filter(r => r.status === tab).length
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap capitalize transition flex items-center gap-1.5 ${
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

            <div className="flex-1" />

            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs ${inputCls} focus:outline-none focus:ring-2 focus:ring-purple-500 transition`}
            >
              <option value="all">All Roles</option>
              {REQUESTABLE_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            {/* Sort order */}
            <button
              onClick={() => setSortOrder(o => o === 'newest' ? 'oldest' : 'newest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
            </button>
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
                canReview={canReview}
                onPreview={(url, fileName) => setPreviewProof({ url, fileName })}
              />
            ))}
          </div>
        ) : (
          <div className={`${
            isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
          } backdrop-blur-lg rounded-xl border p-10 text-center shadow-lg`}>
            <Users2 className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No matching requests found
            </p>
          </div>
        )}
      </div>

      {previewProof && (
        <ProofPreviewModal
          url={previewProof.url}
          fileName={previewProof.fileName}
          isDarkMode={isDarkMode}
          onClose={() => setPreviewProof(null)}
        />
      )}
    </div>
  )
}

export default RoleUpgradeRequestsPage
