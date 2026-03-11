import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Send, CheckCircle, Clock, XCircle,
  ArrowLeft, Loader2, Lock, AlertCircle
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import adminRequestService from '../services/adminRequestService'

const StatusBadge = ({ status, isDarkMode }) => {
  if (status === 'pending') return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
      isDarkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
    }`}>
      <Clock className="w-3.5 h-3.5" /> Pending Review
    </span>
  )
  if (status === 'approved') return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
      isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'
    }`}>
      <CheckCircle className="w-3.5 h-3.5" /> Approved
    </span>
  )
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
      isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'
    }`}>
      <XCircle className="w-3.5 h-3.5" /> Rejected
    </span>
  )
}

const RequestAdminPage = () => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const { user } = useAuth()

  const [existingRequest, setExistingRequest] = useState(null)
  const [loadingRequest, setLoadingRequest] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    const fetchRequest = async () => {
      if (!user?.id) return
      const req = await adminRequestService.getUserRequest(user.id)
      setExistingRequest(req)
      setLoadingRequest(false)
    }
    fetchRequest()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason.trim() || reason.trim().length < 20) {
      setError('Please provide a reason of at least 20 characters.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const result = await adminRequestService.submitRequest({
        fullName: user?.fullName || '',
        email: user?.email || '',
        purok: user?.purok || '',
        currentRole: user?.role || 'resident',
        reason: reason.trim()
      })
      if (result.success) {
        setSubmitted(true)
        setExistingRequest({ status: 'pending', reason: reason.trim(), createdAt: new Date().toISOString() })
      } else {
        setError(result.error || 'Failed to submit request.')
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const card = `${
    isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
  } backdrop-blur-lg rounded-2xl border shadow-2xl`

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

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start p-4 pt-8">
        <div className="w-full max-w-lg">

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white mb-6 hover:opacity-70 transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Header Card */}
          <div className={`${
            isDarkMode
              ? 'bg-gradient-to-r from-purple-900/90 to-indigo-950/90 border-gray-700/50'
              : 'bg-gradient-to-r from-purple-600/90 to-indigo-600/90 border-white/20'
          } backdrop-blur-sm rounded-2xl p-6 text-white shadow-xl border mb-4`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-purple-800/50' : 'bg-white/20'}`}>
                <Lock className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold">Request Admin Access</h1>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-purple-200' : 'text-purple-100'}`}>
              Admin accounts are private and require approval from an existing administrator.
              Submit your request below and an admin will review it.
            </p>
          </div>

          {loadingRequest ? (
            <div className={`${card} p-10 flex flex-col items-center gap-3`}>
              <Loader2 className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Checking your request status…</p>
            </div>
          ) : existingRequest ? (
            /* Existing request status */
            <div className={`${card} p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <h2 className={`font-bold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  Your Request
                </h2>
                <StatusBadge status={existingRequest.status} isDarkMode={isDarkMode} />
              </div>

              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reason submitted</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{existingRequest.reason}</p>
              </div>

              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Submitted on{' '}
                {new Date(existingRequest.createdAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </p>

              {existingRequest.status === 'pending' && (
                <div className={`flex items-start gap-2 p-3 rounded-xl ${
                  isDarkMode ? 'bg-yellow-900/20 border border-yellow-800/40' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <p className={`text-xs ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    Your request is under review. You will be notified once an administrator responds.
                  </p>
                </div>
              )}

              {existingRequest.status === 'approved' && (
                <div className={`flex items-start gap-2 p-3 rounded-xl ${
                  isDarkMode ? 'bg-green-900/20 border border-green-800/40' : 'bg-green-50 border border-green-200'
                }`}>
                  <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <p className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                    Your admin access has been approved! Please log out and log back in for changes to take effect.
                  </p>
                </div>
              )}

              {existingRequest.status === 'rejected' && (
                <div className={`flex items-start gap-2 p-3 rounded-xl ${
                  isDarkMode ? 'bg-red-900/20 border border-red-800/40' : 'bg-red-50 border border-red-200'
                }`}>
                  <XCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                      Your request was not approved.
                    </p>
                    {existingRequest.reviewNote && (
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        Note: {existingRequest.reviewNote}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : submitted ? (
            /* Success state */
            <div className={`${card} p-8 text-center`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDarkMode ? 'bg-green-900/40' : 'bg-green-100'
              }`}>
                <CheckCircle className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Request Submitted!
              </h2>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Your admin access request has been sent. An administrator will review it and get back to you.
              </p>
              <button
                onClick={() => navigate('/home')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition"
              >
                Back to Home
              </button>
            </div>
          ) : (
            /* Request Form */
            <div className={`${card} p-6`}>
              <h2 className={`font-bold text-lg mb-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Submit a Request
              </h2>
              <p className={`text-sm mb-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Tell an administrator why you need admin access.
              </p>

              {error && (
                <div className={`mb-4 flex items-start gap-2 p-3 rounded-xl ${
                  isDarkMode ? 'bg-red-900/20 border border-red-800/40' : 'bg-red-50 border border-red-200'
                }`}>
                  <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Read-only user info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={user?.fullName || ''}
                      readOnly
                      className={`w-full px-3 py-2 rounded-xl border text-sm ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-gray-400'
                          : 'bg-gray-100 border-gray-200 text-gray-500'
                      } cursor-not-allowed`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Current Role
                    </label>
                    <input
                      type="text"
                      value={user?.role === 'barangay_official' ? 'Barangay Official' : 'Resident'}
                      readOnly
                      className={`w-full px-3 py-2 rounded-xl border text-sm capitalize ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-gray-400'
                          : 'bg-gray-100 border-gray-200 text-gray-500'
                      } cursor-not-allowed`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-400'
                        : 'bg-gray-100 border-gray-200 text-gray-500'
                    } cursor-not-allowed`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Reason for Requesting Admin Access <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={5}
                    placeholder="Explain why you need administrator access and how you plan to use it…"
                    className={`w-full px-4 py-3 rounded-xl border text-sm resize-none ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-purple-500'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-purple-500'
                    } focus:outline-none focus:ring-2 focus:border-transparent transition`}
                    required
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {reason.trim().length}/20 minimum characters
                  </p>
                </div>

                <div className={`flex items-start gap-2 p-3 rounded-xl ${
                  isDarkMode ? 'bg-blue-900/20 border border-blue-800/40' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <Shield className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    Your request will be reviewed by an existing administrator. Admin access grants elevated permissions
                    to manage users, approvals, and system settings.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting…</span></>
                  ) : (
                    <><Send className="w-4 h-4" /><span>Submit Request</span></>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RequestAdminPage
