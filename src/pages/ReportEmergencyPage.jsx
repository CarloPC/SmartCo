
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Flame, Stethoscope, ShieldAlert, Waves,
  Car, HelpCircle, MapPin, Phone, FileText, ChevronDown,
  Loader2, CheckCircle, ArrowLeft, Ban, Clock, ShieldOff
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import emergencyService from '../services/emergencyService'
import LocationPicker from '../components/LocationPicker'
import { PUROKS_ILIHAN } from '../constants/puroks'

const EMERGENCY_TYPES = [
  { value: 'fire',     label: 'Fire',         icon: Flame,       color: 'text-red-300',    grad: 'from-red-500/30 to-orange-500/10',    ring: 'ring-red-400/50' },
  { value: 'medical',  label: 'Medical',       icon: Stethoscope, color: 'text-pink-300',   grad: 'from-pink-500/30 to-rose-500/10',     ring: 'ring-pink-400/50' },
  { value: 'crime',    label: 'Crime / Theft', icon: ShieldAlert, color: 'text-orange-300', grad: 'from-orange-500/30 to-amber-500/10',  ring: 'ring-orange-400/50' },
  { value: 'flood',    label: 'Flood',         icon: Waves,       color: 'text-blue-300',   grad: 'from-blue-500/30 to-cyan-500/10',     ring: 'ring-blue-400/50' },
  { value: 'accident', label: 'Accident',      icon: Car,         color: 'text-yellow-300', grad: 'from-yellow-500/30 to-amber-500/10',  ring: 'ring-yellow-400/50' },
  { value: 'other',    label: 'Other',         icon: HelpCircle,  color: 'text-slate-300',  grad: 'from-slate-500/30 to-slate-400/10',   ring: 'ring-slate-400/50' },
]

const SEVERITIES = [
  { value: 'low',      label: 'Low',      desc: 'Minor, not life-threatening',         color: 'text-emerald-300', selBg: 'bg-gradient-to-br from-emerald-500/90 to-green-600/90' },
  { value: 'medium',   label: 'Medium',   desc: 'Needs attention soon',                color: 'text-yellow-300',  selBg: 'bg-gradient-to-br from-yellow-500/90 to-amber-600/90' },
  { value: 'high',     label: 'High',     desc: 'Urgent response needed',              color: 'text-orange-300',  selBg: 'bg-gradient-to-br from-orange-500/90 to-red-600/90' },
  { value: 'critical', label: 'Critical', desc: 'Life-threatening / immediate danger', color: 'text-red-300',     selBg: 'bg-gradient-to-br from-red-600/90 to-rose-700/90' },
]

/* glass card  same design language as HomePage/HealthPage/FoodAidPage/EventsPage */
const card =
  'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all duration-300 hover:border-white/40 hover:shadow-blue-500/10'

/* shared full-bleed background  matches HomePage/HealthPage/FoodAidPage/EventsPage's hero shell */
const PageBackground = ({ isDarkMode }) => (
  <>
    <div className="fixed inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: `url(${toledoImage})` }}>
      <div className={`absolute inset-0 ${isDarkMode
        ? 'bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-indigo-950/95'
        : 'bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-800/90'}`}
      />
    </div>
    {/* Decorative blobs  matches HomePage/HealthPage/FoodAidPage/EventsPage's gradient shell */}
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

//  Suspension Banner 

const SuspensionBanner = ({ suspension, isDarkMode, onBack }) => {
  const isPermanent = suspension.isPermanent
  const isRepeat = suspension.count >= 2

  const endDateStr = isPermanent
    ? 'Permanent  no expiry'
    : new Date(suspension.suspendedUntil).toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6">
      <PageBackground isDarkMode={isDarkMode} />

      <div className="w-full max-w-lg space-y-4">
        <button onClick={onBack} className="flex items-center space-x-2 text-sm font-medium text-white/80 transition hover:text-white">
          <ArrowLeft className="w-4 h-4" /><span>Back</span>
        </button>

        {/* Main Suspension Card */}
        <div className={`${card} overflow-hidden`}>
          <div className="bg-gradient-to-r from-red-500/80 to-orange-600/80 p-6 text-center text-white backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Ban className="w-9 h-9" />
            </div>
            <h2 className="mb-1 text-2xl font-bold">Reporting Suspended</h2>
            <p className="text-sm text-white/80">Your emergency reporting access has been restricted</p>
          </div>

          <div className="space-y-4 p-6">
            {/* Duration */}
            <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
              <Clock className={`mt-0.5 h-5 w-5 flex-shrink-0 ${isPermanent ? 'text-red-300' : 'text-orange-300'}`} />
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/50">Suspension Period</p>
                <p className={`text-sm font-bold ${isPermanent ? 'text-red-300' : 'text-orange-300'}`}>{endDateStr}</p>
                {suspension.count > 1 && (
                  <p className="mt-0.5 text-xs text-white/40">Offense #{suspension.count}</p>
                )}
              </div>
            </div>

            {/* Reason */}
            {suspension.reason && (
              <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
                <ShieldOff className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/50" />
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/50">Reason</p>
                  <p className="text-sm text-white/70">{suspension.reason}</p>
                </div>
              </div>
            )}

            {/* Warning message */}
            <div className={`rounded-xl border-l-4 p-4 ${
              isRepeat
                ? 'border-red-400 bg-red-500/10 text-red-200'
                : 'border-orange-400 bg-orange-500/10 text-orange-200'
            }`}>
              <p className="mb-2 text-sm font-bold">
                {isRepeat ? 'Final Warning' : 'Official Warning'}
              </p>
              {isRepeat ? (
                <p className="text-xs leading-relaxed">
                  This is your <strong>repeated offense #{suspension.count}</strong> for filing false emergency reports.
                  Continued violations will result in <strong>permanent account termination</strong> and you will be
                  formally <strong>summoned to the Barangay Hall</strong> for a hearing under applicable local ordinances.
                </p>
              ) : (
                <p className="text-xs leading-relaxed">
                  Your emergency reporting has been suspended after your report was verified as false by barangay officials.
                  Please be reminded that filing false emergency reports is a serious offense.
                  <strong> Repeated violations may result in account termination and a formal summons to the Barangay Hall.</strong>
                </p>
              )}
            </div>

            {/* Contact */}
            <div className="text-center text-xs text-white/40">
              To appeal this suspension, please visit or contact the Barangay Hall directly.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

//  Main Page 

const ReportEmergencyPage = () => {
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [suspension, setSuspension] = useState(null)
  const [checkingSuspension, setCheckingSuspension] = useState(true)
  const [selectedType, setSelectedType] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [coords, setCoords] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    purok: '',
    location: '',
    description: '',
    reporterName: user?.fullName || '',
    reporterPhone: user?.phone || '',
  })

  // Check suspension on mount
  useEffect(() => {
    const check = async () => {
      const result = await emergencyService.checkUserSuspension()
      setSuspension(result.suspended ? result : null)
      setCheckingSuspension(false)
    }
    check()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    setSubmitted(false)
    setSelectedType('')
    setSeverity('medium')
    setCoords(null)
    setFormData({ purok: '', location: '', description: '', reporterName: user?.fullName || '', reporterPhone: user?.phone || '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedType) { setError('Please select an emergency type.'); return }
    setError('')
    setLoading(true)
    try {
      const result = await emergencyService.reportEmergency({
        ...formData,
        type: selectedType,
        severity,
        coords: coords || null,
      })
      if (result.success) {
        setSubmitted(true)
      } else {
        setError(result.error || 'Failed to submit emergency report.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:border-red-300/60 hover:shadow-[0_0_30px_rgba(248,113,113,0.35)] focus:scale-[1.02] focus:border-red-300 focus:ring-2 focus:ring-red-400/70 focus:shadow-[0_0_35px_rgba(248,113,113,0.55)]'

  // Checking suspension
  if (checkingSuspension) {
    return (
      <div className="min-h-screen relative">
        <PageBackground isDarkMode={isDarkMode} />
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className={`${card} px-8 py-10 text-center`}>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-white" />
            <p className="font-semibold text-white">Checking access</p>
          </div>
        </div>
      </div>
    )
  }

  // Suspended
  if (suspension) {
    return <SuspensionBanner suspension={suspension} isDarkMode={isDarkMode} onBack={() => navigate(-1)} />
  }

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
            <h2 className="mb-3 text-2xl font-bold text-white">Report Submitted!</h2>
            <p className="mb-2 text-sm text-white/60">
              Your emergency report has been received. Barangay officials have been notified.
            </p>
            {coords && (
              <a
                href={`https://maps.google.com/?q=${coords.lat},${coords.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mb-4 inline-flex items-center space-x-1.5 text-xs text-blue-300 underline"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Your pinned location was included in the report</span>
              </a>
            )}
            <p className="mb-8 text-xs font-medium text-red-300">
              Please ensure this is a real emergency. Filing false reports may result in account suspension.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleReset} className="flex-1 rounded-xl bg-white/10 py-3 text-sm font-medium text-white/80 transition hover:bg-white/20">
                Report Another
              </button>
              <div className="inline-block">
  <button
    onClick={() => navigate(-1)}
    className="group flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-xl transition-all duration-300 hover:-translate-x-1 hover:scale-105 hover:border-red-300/50 hover:bg-white/15 hover:shadow-[0_0_30px_rgba(248,113,113,0.35)]"
  >
    <ArrowLeft className="w-4 h-4 text-white/70 transition-all duration-300 group-hover:-translate-x-1 group-hover:text-red-300" />
    <span className="text-sm font-medium text-white/70 transition-all duration-300 group-hover:text-white">
      Back
    </span>
  </button>
</div>
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

        {/*  Hero header banner  */}
        <section className={`${card} overflow-hidden bg-gradient-to-r from-red-500/30 via-orange-500/20 to-rose-500/30`}>
          <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/20">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-300" />
                Live emergency reporting
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Report Emergency
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base">
                Notify barangay officials immediately  every second counts.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="tel:911"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-red-600 hover:to-orange-700"
                >
                  <Phone className="h-4 w-4" /> Call 911
                </a>
                <button
                  onClick={() => navigate('/home')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Back to dashboard
                </button>
              </div>
            </div>

            {/* At-a-glance mini panel */}
            <div className="flex w-full max-w-xs flex-col gap-3 lg:w-auto">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Emergency info</p>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Active
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/30 bg-gradient-to-br from-red-500/25 to-orange-500/10 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(248,113,113,0.30)]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-200">
                    <Phone className="h-3.5 w-3.5" /> Hotline
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">911</p>
                </div>
                <div className="rounded-xl border border-white/30 bg-gradient-to-br from-orange-500/25 to-amber-500/10 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(251,146,60,0.30)]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-200">
                    <Clock className="h-3.5 w-3.5" /> Response
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">24/7</p>
                </div>
              </div>
              <p className="text-center text-xs text-white/40">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Warning notice */}
          <div className="mx-5 mb-5 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 sm:mx-7">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-yellow-300" />
            <p className="text-xs text-white/70">
              For life-threatening situations, call <strong className="text-white">911</strong> immediately. False reports may result in account suspension.
            </p>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emergency Type */}
          <div className={`${card} p-5`}>
            <label className="mb-4 block text-sm font-semibold text-white">
              Emergency Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {EMERGENCY_TYPES.map((type) => {
                const active = selectedType === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(type.value)}
                    className={`flex flex-col items-center rounded-xl border p-4 transition-all duration-200 ${
                      active
                        ? `bg-gradient-to-br ${type.grad} border-white/30 ring-2 ${type.ring} scale-[1.03] shadow-lg`
                        : 'border-white/15 bg-white/5 hover:bg-white/10 hover:scale-[1.03] hover:-translate-y-1 hover:border-red-300/50 hover:shadow-[0_0_30px_rgba(248,113,113,0.30)]'
                    }`}
                  >
                    <type.icon className={`mb-2 h-7 w-7 ${active ? type.color : 'text-white/50'}`} />
                    <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-white/70'}`}>{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Severity */}
          <div className={`${card} p-5`}>
            <label className="mb-4 block text-sm font-semibold text-white">
              Severity Level <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SEVERITIES.map((s) => {
                const active = severity === s.value
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      active
                        ? `${s.selBg} border-transparent text-white shadow-lg`
                        : 'border-white/15 bg-white/5 hover:bg-white/10 hover:scale-[1.03] hover:-translate-y-1 hover:border-orange-300/50 hover:shadow-[0_0_30px_rgba(251,146,60,0.30)]'
                    }`}
                  >
                    <div className={`mb-0.5 text-sm font-bold ${active ? 'text-white' : s.color}`}>{s.label}</div>
                    <div className={`text-xs leading-tight ${active ? 'text-white/80' : 'text-white/50'}`}>{s.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Location */}
          <div className={`${card} space-y-4 p-5`}>
            <label className="block text-sm font-semibold text-white">
              Location Details <span className="text-red-400">*</span>
            </label>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Purok</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <select name="purok" value={formData.purok} onChange={handleChange} required className={`${inputCls} appearance-none pl-10`}>
                  <option value="" className="text-gray-900">Select Purok</option>
                  {PUROKS_ILIHAN.map((p) => (
                    <option key={p} value={p} className="text-gray-900">{p}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Specific Location / Landmark</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Near the old chapel..." className={inputCls} />
            </div>
            <LocationPicker value={coords} onChange={setCoords} isDarkMode={isDarkMode} />
          </div>

          {/* Description */}
          <div className={`${card} p-5`}>
            <label className="mb-3 flex items-center text-sm font-semibold text-white">
              <FileText className="mr-1.5 h-4 w-4" />
              Emergency Description <span className="ml-1 text-red-400">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Describe what is happening, how many people are affected, and any immediate danger..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Reporter Info */}
          <div className={`${card} space-y-4 p-5`}>
            <label className="block text-sm font-semibold text-white">Your Contact Information</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Full Name</label>
                <input type="text" name="reporterName" value={formData.reporterName} onChange={handleChange} placeholder="Your full name" className={inputCls} required />
              </div>
              <div>
                <label className="mb-1.5 flex items-center text-xs font-medium text-white/60">
                  <Phone className="mr-1 h-3.5 w-3.5" />Phone Number
                </label>
                <input type="tel" name="reporterPhone" value={formData.reporterPhone} onChange={handleChange} placeholder="+63 xxx xxx xxxx" className={inputCls} required />
              </div>
            </div>
          </div>

          <div className="pt-2">
  <button
    type="submit"
    disabled={loading}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 py-4 text-base font-bold text-white transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 hover:from-red-600 hover:to-orange-700 hover:shadow-[0_0_45px_rgba(239,68,68,0.60)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Submitting Report...</span></>
              : <><AlertTriangle className="w-5 h-5" /><span>Submit Emergency Report</span></>
            }
          </button>
</div>
        </form>
      </div>
    </div>
  )
}

export default ReportEmergencyPage

