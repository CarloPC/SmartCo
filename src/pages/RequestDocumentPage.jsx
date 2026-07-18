
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, ChevronDown, Loader2, CheckCircle, ArrowLeft,
  Calendar, ClipboardList, MapPin,
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import documentRequestService from '../services/documentRequestService'

const DOCUMENT_TYPES = [
  'Barangay Certificate',
  'Barangay Clearance',
  'Certificate of Residency',
  'Certificate of Indigency',
  'Business Clearance',
  'First Time Job Seeker Certificate',
  'Solo Parent Certificate',
  'Certificate of Good Moral',
  'Other',
]

/* glass card — same design language as HomePage/ReportEmergencyPage */
const card =
  'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all duration-300 hover:border-white/40 hover:shadow-blue-500/10'

const PageBackground = ({ isDarkMode }) => (
  <>
    <div className="fixed inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: `url(${toledoImage})` }}>
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

const RequestDocumentPage = () => {
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    documentType: '',
    otherDocument: '',
    purpose: '',
    notes: '',
    preferredClaimDate: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    setSubmitted(false)
    setFormData({ documentType: '', otherDocument: '', purpose: '', notes: '', preferredClaimDate: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.documentType) { setError('Please select a document type.'); return }
    if (formData.documentType === 'Other' && !formData.otherDocument.trim()) {
      setError('Please specify the document you need.')
      return
    }
    if (!formData.purpose.trim()) { setError('Please tell us the purpose of this request.'); return }

    setError('')
    setLoading(true)
    try {
      const result = await documentRequestService.submitRequest({
        ...formData,
        residentName: user?.fullName || '',
        residentEmail: user?.email || '',
        residentPhone: user?.phone || '',
        purok: user?.purok || '',
      })
      if (result.success) {
        setSubmitted(true)
      } else {
        setError(result.error || 'Failed to submit your document request.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:border-blue-300/60 hover:shadow-[0_0_30px_rgba(96,165,250,0.35)] focus:scale-[1.02] focus:border-blue-300 focus:ring-2 focus:ring-blue-400/70 focus:shadow-[0_0_35px_rgba(96,165,250,0.55)]'

  // Success
  if (submitted) {
    return (
      <div className="min-h-screen relative">
        <PageBackground isDarkMode={isDarkMode} />
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className={`${card} p-10 max-w-md w-full text-center`}>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/20">
              <CheckCircle className="h-10 w-10 text-emerald-300" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white">Request Submitted!</h2>
            <p className="mb-8 text-sm text-white/60">
              Your document request has been received. Barangay officials have been notified and will review it shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleReset} className="flex-1 rounded-xl bg-white/10 py-3 text-sm font-medium text-white/80 transition hover:bg-white/20">
                Request Another
              </button>
              <button
                onClick={() => navigate('/documents')}
                className="group flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-blue-300/50 hover:bg-white/15 hover:shadow-[0_0_30px_rgba(96,165,250,0.35)]"
              >
                <span className="text-sm font-medium text-white/70 transition-all duration-300 group-hover:text-white">
                  View My Requests
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <PageBackground isDarkMode={isDarkMode} />

      <div className="mx-auto max-w-3xl space-y-5 p-4 pb-24 sm:space-y-6 sm:p-6 lg:p-8">

        <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-sm font-medium text-white/80 transition hover:text-white">
          <ArrowLeft className="w-4 h-4" /><span>Back</span>
        </button>

        {/* Hero header banner */}
        <section className={`${card} overflow-hidden bg-gradient-to-r from-blue-500/30 via-indigo-500/20 to-sky-500/30`}>
          <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/20">
                <FileText className="h-3.5 w-3.5 text-yellow-300" />
                Barangay document requests
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Request Documents
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base">
                Request official barangay documents online — no need to line up at the Barangay Hall.
              </p>
            </div>

            <div className="flex w-full max-w-xs flex-col gap-3 lg:w-auto">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Requesting as</p>
              </div>
              <div className="rounded-xl border border-white/30 bg-gradient-to-br from-blue-500/25 to-cyan-500/10 p-4 backdrop-blur-sm">
                <p className="text-sm font-bold text-white">{user?.fullName || 'Resident'}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60">
                  <MapPin className="h-3 w-3" /> {user?.purok || 'Purok not set'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Request Type */}
          <div className={`${card} p-5`}>
            <label className="mb-3 block text-sm font-semibold text-white">
              Request Type <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <select
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                required
                className={`${inputCls} appearance-none pl-10`}
              >
                <option value="" className="text-gray-900">Select a document type</option>
                {DOCUMENT_TYPES.map(type => (
                  <option key={type} value={type} className="text-gray-900">{type}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            </div>

            {formData.documentType === 'Other' && (
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-medium text-white/60">Other Document</label>
                <input
                  type="text"
                  name="otherDocument"
                  value={formData.otherDocument}
                  onChange={handleChange}
                  placeholder="Please specify the document you need"
                  className={inputCls}
                  required
                />
              </div>
            )}
          </div>

          {/* Purpose */}
          <div className={`${card} p-5`}>
            <label className="mb-3 flex items-center text-sm font-semibold text-white">
              <ClipboardList className="mr-1.5 h-4 w-4" />
              Purpose <span className="ml-1 text-red-400">*</span>
            </label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              rows={3}
              placeholder="What is this document for? (e.g. employment requirement, scholarship application...)"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Additional Notes */}
          <div className={`${card} p-5`}>
            <label className="mb-3 block text-sm font-semibold text-white">
              Additional Notes <span className="text-white/40 font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Anything else the barangay office should know..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Preferred Claim Date */}
          <div className={`${card} p-5`}>
            <label className="mb-3 flex items-center text-sm font-semibold text-white">
              <Calendar className="mr-1.5 h-4 w-4" />
              Preferred Claim Date <span className="text-white/40 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="date"
              name="preferredClaimDate"
              value={formData.preferredClaimDate}
              onChange={handleChange}
              className={inputCls}
            />
          </div>

          {/* Resident info (auto-filled, read-only) */}
          <div className={`${card} space-y-3 p-5`}>
            <label className="block text-sm font-semibold text-white">Requested By</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                <p className="text-xs font-medium text-white/50">Resident Name</p>
                <p className="mt-0.5 text-white">{user?.fullName || '—'}</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                <p className="text-xs font-medium text-white/50">Resident ID</p>
                <p className="mt-0.5 truncate text-white">{user?.id || '—'}</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                <p className="text-xs font-medium text-white/50">Purok</p>
                <p className="mt-0.5 text-white">{user?.purok || '—'}</p>
              </div>
            </div>
            <p className="text-xs text-white/40">These details are pulled automatically from your account.</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-4 text-base font-bold text-white transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 hover:from-blue-600 hover:to-indigo-700 hover:shadow-[0_0_45px_rgba(59,130,246,0.60)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Submitting Request...</span></>
                : <><FileText className="w-5 h-5" /><span>Submit Document Request</span></>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RequestDocumentPage
