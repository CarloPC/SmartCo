
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Send, CheckCircle, Clock, XCircle,
  ArrowLeft, Loader2, Lock, AlertCircle, Upload, FileText, Eye, RefreshCw
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import roleUpgradeService, { REQUESTABLE_ROLES, getRoleLabel } from '../services/roleUpgradeService'
import storageService from '../services/storageService'
import ProofPreviewModal from '../components/ProofPreviewModal'

const StatusBadge = ({ status, isDarkMode }) => {
  const { t } = useLanguage()
  if (status === 'pending') return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
      isDarkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
    }`}>
      <Clock className="w-3.5 h-3.5" /> {t('roleUpgrade.statusPending', 'Pending Review')}
    </span>
  )
  if (status === 'approved') return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
      isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'
    }`}>
      <CheckCircle className="w-3.5 h-3.5" /> {t('roleUpgrade.statusApproved', 'Approved')}
    </span>
  )
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
      isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'
    }`}>
      <XCircle className="w-3.5 h-3.5" /> {t('roleUpgrade.statusRejected', 'Rejected')}
    </span>
  )
}

const RequestRoleUpgradePage = () => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const { t } = useLanguage()

  const [existingRequest, setExistingRequest] = useState(null)
  const [loadingRequest, setLoadingRequest] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  // Step 11 — Resubmission: true while showing the (pre-filled) form again
  // for a previously REJECTED request. `justSubmittedType` drives a one-time
  // success banner ('new' vs 'resubmit') shown once we're back on the
  // status card, since the status card is what actually renders right
  // after a successful submit (see the render logic below).
  const [resubmitMode, setResubmitMode] = useState(false)
  const [justSubmittedType, setJustSubmittedType] = useState(null) // 'new' | 'resubmit' | null
  const [error, setError] = useState('')

  const [requestedRole, setRequestedRole] = useState('')
  const [position, setPosition] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [proofPreviewUrl, setProofPreviewUrl] = useState(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [previewModal, setPreviewModal] = useState(null) // { url, fileName } | null

  useEffect(() => {
    const fetchRequest = async () => {
      if (!user?.id) return
      const req = await roleUpgradeService.getUserRequest(user.id)
      setExistingRequest(req)
      setLoadingRequest(false)
    }
    fetchRequest()
  }, [user])

  // Revoke the local preview URL on unmount
  useEffect(() => {
    return () => {
      if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl)
    }
  }, [proofPreviewUrl])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, WEBP images or PDF files are accepted.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10MB.')
      return
    }
    setError('')
    if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl)
    setProofFile(file)
    setProofPreviewUrl(URL.createObjectURL(file))
  }

  // Step 11 — Resubmission: reopen the same request form, pre-filled from
  // the rejected application, so the resident only has to fix what the
  // rejection reason pointed out (not retype everything from scratch).
  // The proof file itself is intentionally left blank — Firestore stores a
  // URL, not a File object, so a fresh upload is required; the previously
  // submitted document stays viewable for reference via the button below.
  const openResubmit = () => {
    setRequestedRole(existingRequest.requestedRole || '')
    setPosition(existingRequest.position || '')
    setReason(existingRequest.reason || '')
    setNotes(existingRequest.notes || '')
    setProofFile(null)
    if (proofPreviewUrl) { URL.revokeObjectURL(proofPreviewUrl); setProofPreviewUrl(null) }
    setError('')
    setResubmitMode(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!requestedRole) {
      setError('Please select the role you are requesting.')
      return
    }
    if (!position.trim()) {
      setError('Please enter the position you are requesting.')
      return
    }
    if (!reason.trim() || reason.trim().length < 20) {
      setError('Please provide a reason of at least 20 characters.')
      return
    }
    if (!proofFile) {
      setError('Please upload a supporting document (Employee ID, Barangay Certification, or Appointment Letter).')
      return
    }

    const wasResubmission = existingRequest?.status === 'rejected'

    setError('')
    setSubmitting(true)
    try {
      setUploadingProof(true)
      const { url: proofFileUrl, fileName: proofFileName } = await storageService.uploadRoleUpgradeProof(user.id, proofFile)
      setUploadingProof(false)

      const result = await roleUpgradeService.submitRequest({
        requestedRole,
        fullName: user?.fullName || '',
        position: position.trim(),
        email: user?.email || '',
        purok: user?.purok || '',
        reason: reason.trim(),
        notes: notes.trim(),
        proofFileUrl,
        proofFileName
      })
      if (result.success) {
        setSubmitted(true)
        setResubmitMode(false)
        setJustSubmittedType(wasResubmission ? 'resubmit' : 'new')
        setExistingRequest({
          status: 'pending',
          requestedRole,
          position: position.trim(),
          reason: reason.trim(),
          notes: notes.trim(),
          proofFileUrl,
          proofFileName,
          submittedAt: new Date().toISOString(),
          isResubmission: wasResubmission
        })
      } else {
        setError(result.error || 'Failed to submit request.')
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setUploadingProof(false)
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
              <h1 className="text-xl font-bold">Request Role Upgrade</h1>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-purple-200' : 'text-purple-100'}`}>
              Barangay Official and BHW accounts are granted, not self-selected. Submit your request
              with a supporting document and an administrator will review it.
            </p>
          </div>

          {loadingRequest ? (
            <div className={`${card} p-10 flex flex-col items-center gap-3`}>
              <Loader2 className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Checking your request status…</p>
            </div>
          ) : existingRequest && !resubmitMode ? (
            /* Existing request status */
            <div className={`${card} p-6 space-y-4`}>
              {justSubmittedType && existingRequest.status === 'pending' && (
                <div className={`flex items-start gap-2 p-3 rounded-xl ${
                  isDarkMode ? 'bg-emerald-900/20 border border-emerald-800/40' : 'bg-emerald-50 border border-emerald-200'
                }`}>
                  <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <p className={`text-xs ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    {justSubmittedType === 'resubmit'
                      ? t('roleUpgrade.resubmitSuccessMessage', 'Your corrected request has been resubmitted for review.')
                      : t('roleUpgrade.submitSuccessMessage', 'Your role upgrade request has been sent for review.')}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h2 className={`font-bold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  Your Request
                </h2>
                <StatusBadge status={existingRequest.status} isDarkMode={isDarkMode} />
              </div>

              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Requested role</p>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {getRoleLabel(existingRequest.requestedRole)}
                </p>
              </div>

              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reason submitted</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{existingRequest.reason}</p>
              </div>

              {existingRequest.proofFileUrl && (
                <button
                  type="button"
                  onClick={() => setPreviewModal({ url: existingRequest.proofFileUrl, fileName: existingRequest.proofFileName })}
                  className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition w-full text-left ${
                    isDarkMode ? 'bg-gray-800 text-blue-300 hover:bg-gray-700' : 'bg-gray-50 text-blue-600 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-900' : 'bg-gray-200'
                  }`}>
                    {(existingRequest.proofFileName || '').toLowerCase().includes('.pdf') ? (
                      <FileText className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    ) : (
                      <img src={existingRequest.proofFileUrl} alt="Proof thumbnail" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="truncate flex-1">{existingRequest.proofFileName || 'View submitted document'}</span>
                  <Eye className="w-4 h-4 flex-shrink-0" />
                </button>
              )}

              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Submitted on{' '}
                {new Date(existingRequest.submittedAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </p>

              {existingRequest.status === 'pending' && (
                <div className={`flex items-start gap-2 p-3 rounded-xl ${
                  isDarkMode ? 'bg-yellow-900/20 border border-yellow-800/40' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <p className={`text-xs ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    {t('roleUpgrade.pendingNotice', 'Your request is under review. You will be notified once an administrator responds.')}
                  </p>
                </div>
              )}

              {existingRequest.status === 'approved' && (
                <div className={`flex items-start gap-2 p-3 rounded-xl ${
                  isDarkMode ? 'bg-green-900/20 border border-green-800/40' : 'bg-green-50 border border-green-200'
                }`}>
                  <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <p className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                    {t('roleUpgrade.approvedNoticePrefix', 'Your role has been upgraded to')} {getRoleLabel(existingRequest.requestedRole)}{t('roleUpgrade.approvedNoticeSuffix', '! Please log out and log back in for changes to take effect.')}
                  </p>
                </div>
              )}

              {existingRequest.status === 'rejected' && (
                <div className={`flex flex-col gap-3 p-4 rounded-xl ${
                  isDarkMode ? 'bg-red-900/20 border border-red-800/40' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <XCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                        {t('roleUpgrade.rejectedNotice', 'Your application was rejected.')}
                      </p>
                      {existingRequest.remarks && (
                        <>
                          <p className={`text-xs font-medium mt-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                            {t('roleUpgrade.reasonLabel', 'Reason')}
                          </p>
                          <p className={`text-xs mt-0.5 break-words whitespace-pre-wrap ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                            {existingRequest.remarks}
                          </p>
                        </>
                      )}
                      <p className={`text-xs font-medium mt-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        {t('roleUpgrade.nextStepLabel', 'Next Step')}
                      </p>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                        {t('roleUpgrade.nextStepText', 'Please correct the issue and resubmit your application.')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openResubmit}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t('roleUpgrade.reviewResubmitButton', 'Review & Resubmit')}</span>
                  </button>
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
                Your role upgrade request has been sent. An administrator will review it and get back to you.
              </p>
              <button
                onClick={() => navigate('/home')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition"
              >
                Back to Home
              </button>
            </div>
          ) : (
            /* Request Form — shared by first-time submission AND
               resubmission after a rejection (resubmitMode) */
            <div className={`${card} p-6`}>
              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className={`font-bold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  {resubmitMode ? t('roleUpgrade.resubmitFormTitle', 'Resubmit Your Request') : 'Submit a Request'}
                </h2>
                {resubmitMode && (
                  <button
                    type="button"
                    onClick={() => { setResubmitMode(false); setError('') }}
                    className={`text-xs font-semibold flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t('roleUpgrade.cancelResubmitButton', 'Cancel')}
                  </button>
                )}
              </div>
              <p className={`text-sm mb-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {resubmitMode
                  ? t('roleUpgrade.resubmitFormDescription', 'Correct the issue below and, if needed, upload updated documentation before resubmitting.')
                  : 'Tell an administrator which role you need and why.'}
              </p>

              {resubmitMode && existingRequest?.proofFileUrl && (
                <button
                  type="button"
                  onClick={() => setPreviewModal({ url: existingRequest.proofFileUrl, fileName: existingRequest.proofFileName })}
                  className={`mb-4 flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition w-full text-left ${
                    isDarkMode ? 'bg-gray-800 text-blue-300 hover:bg-gray-700' : 'bg-gray-50 text-blue-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate flex-1">{t('roleUpgrade.previousDocumentLabel', 'Previously submitted document')}: {existingRequest.proofFileName || 'view'}</span>
                  <Eye className="w-4 h-4 flex-shrink-0" />
                </button>
              )}

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
                </div>

                {/* Requested Role + Position grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Requesting to become <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-gray-100'
                          : 'bg-white border-gray-300 text-gray-800'
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition`}
                      required
                    >
                      <option value="">Select role</option>
                      {REQUESTABLE_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Position <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="e.g. Kagawad, Purok Leader"
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Reason for Requesting This Role <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder="Explain why you need this role and how you plan to use it…"
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

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Notes <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Anything else the admin should know…"
                    className={`w-full px-4 py-3 rounded-xl border text-sm resize-none ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-purple-500'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-purple-500'
                    } focus:outline-none focus:ring-2 focus:border-transparent transition`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Supporting Document <span className="text-red-500">*</span>
                  </label>
                  <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Employee ID, Barangay Certification, or Appointment Letter — image or PDF, up to 10MB.
                  </p>
                  <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm cursor-pointer transition ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}>
                    <Upload className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{proofFile ? proofFile.name : 'Choose a file…'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {proofFile && (
                    <button
                      type="button"
                      onClick={() => setPreviewModal({ url: proofPreviewUrl, fileName: proofFile.name })}
                      className={`mt-2 flex items-center gap-3 p-2 rounded-xl border w-full text-left transition ${
                        isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`group relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center ${
                        isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
                      }`}>
                        {proofFile.type === 'application/pdf' ? (
                          <FileText className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        ) : (
                          <img src={proofPreviewUrl} alt="Proof preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-medium truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {proofFile.name}
                        </p>
                        <p className={`text-xs flex items-center gap-1 mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          <Eye className="w-3 h-3" /> Tap to preview
                        </p>
                      </div>
                    </button>
                  )}
                </div>

                <div className={`flex items-start gap-2 p-3 rounded-xl ${
                  isDarkMode ? 'bg-blue-900/20 border border-blue-800/40' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <Shield className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    Your request will be reviewed by an administrator. Approved requests immediately
                    change your account role — no new account is created.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>{uploadingProof ? 'Uploading document…' : 'Submitting…'}</span></>
                  ) : (
                    <><Send className="w-4 h-4" /><span>Submit Request</span></>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {previewModal && (
        <ProofPreviewModal
          url={previewModal.url}
          fileName={previewModal.fileName}
          isDarkMode={isDarkMode}
          onClose={() => setPreviewModal(null)}
        />
      )}
    </div>
  )
}

export default RequestRoleUpgradePage
