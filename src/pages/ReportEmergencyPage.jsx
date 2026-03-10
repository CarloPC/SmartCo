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

const EMERGENCY_TYPES = [
  { value: 'fire',     label: 'Fire',         icon: Flame,       color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200',    darkBg: 'bg-red-950/40',    darkBorder: 'border-red-800/50' },
  { value: 'medical',  label: 'Medical',       icon: Stethoscope, color: 'text-pink-500',   bg: 'bg-pink-50',   border: 'border-pink-200',   darkBg: 'bg-pink-950/40',   darkBorder: 'border-pink-800/50' },
  { value: 'crime',    label: 'Crime / Theft', icon: ShieldAlert, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', darkBg: 'bg-orange-950/40', darkBorder: 'border-orange-800/50' },
  { value: 'flood',    label: 'Flood',         icon: Waves,       color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-200',   darkBg: 'bg-blue-950/40',   darkBorder: 'border-blue-800/50' },
  { value: 'accident', label: 'Accident',      icon: Car,         color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', darkBg: 'bg-yellow-950/40', darkBorder: 'border-yellow-800/50' },
  { value: 'other',    label: 'Other',         icon: HelpCircle,  color: 'text-gray-500',   bg: 'bg-gray-50',   border: 'border-gray-200',   darkBg: 'bg-gray-800/60',   darkBorder: 'border-gray-600/50' },
]

const SEVERITIES = [
  { value: 'low',      label: 'Low',      desc: 'Minor, not life-threatening',          color: 'text-green-600',  selBg: 'bg-green-600' },
  { value: 'medium',   label: 'Medium',   desc: 'Needs attention soon',                 color: 'text-yellow-600', selBg: 'bg-yellow-500' },
  { value: 'high',     label: 'High',     desc: 'Urgent response needed',               color: 'text-orange-600', selBg: 'bg-orange-600' },
  { value: 'critical', label: 'Critical', desc: 'Life-threatening / immediate danger',  color: 'text-red-600',    selBg: 'bg-red-600' },
]

// ─── Suspension Banner ────────────────────────────────────────────────────────

const SuspensionBanner = ({ suspension, isDarkMode, onBack }) => {
  const isPermanent = suspension.isPermanent
  const isRepeat = suspension.count >= 2
  const card = `${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border`

  const endDateStr = isPermanent
    ? 'Permanent — no expiry'
    : new Date(suspension.suspendedUntil).toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-950/97 via-purple-950/90 to-slate-950/97' : 'bg-gradient-to-br from-purple-900/90 via-red-900/88 to-purple-950/92'}`} />
      </div>

      <div className="w-full max-w-lg space-y-4">
        <button onClick={onBack} className="flex items-center space-x-2 text-white/80 hover:text-white transition text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /><span>Back</span>
        </button>

        {/* Main Suspension Card */}
        <div className={`${card} overflow-hidden`}>
          {/* Red/Purple header strip */}
          <div className="bg-gradient-to-r from-purple-700 to-red-700 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ban className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Reporting Suspended</h2>
            <p className="text-purple-100 text-sm">Your emergency reporting access has been restricted</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Duration */}
            <div className={`flex items-start space-x-3 p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
              <Clock className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isPermanent ? 'text-red-500' : 'text-orange-500'}`} />
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Suspension Period</p>
                <p className={`text-sm font-bold ${isPermanent ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-orange-300' : 'text-orange-700')}`}>
                  {endDateStr}
                </p>
                {suspension.count > 1 && (
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Offense #{suspension.count}
                  </p>
                )}
              </div>
            </div>

            {/* Reason */}
            {suspension.reason && (
              <div className={`flex items-start space-x-3 p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
                <ShieldOff className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reason</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{suspension.reason}</p>
                </div>
              </div>
            )}

            {/* Warning message */}
            <div className={`p-4 rounded-xl border-l-4 ${
              isRepeat
                ? isDarkMode ? 'bg-red-950/40 border-red-600 text-red-300' : 'bg-red-50 border-red-600 text-red-800'
                : isDarkMode ? 'bg-orange-950/40 border-orange-500 text-orange-300' : 'bg-orange-50 border-orange-500 text-orange-800'
            }`}>
              <p className="text-sm font-bold mb-2">
                {isRepeat ? '🚫 Final Warning' : '⚠️ Official Warning'}
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
            <div className={`text-center text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              To appeal this suspension, please visit or contact the Barangay Hall directly.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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

  const card = `${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border`
  const inputCls = `w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-red-500 focus:border-transparent ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`

  // Checking suspension…
  if (checkingSuspension) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-950/96 via-red-950/90 to-slate-950/96' : 'bg-gradient-to-br from-red-900/88 via-orange-900/85 to-red-950/90'}`} />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-white/70" />
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
      <div className="min-h-screen relative flex items-center justify-center p-6">
        <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-950/96 via-red-950/90 to-slate-950/96' : 'bg-gradient-to-br from-red-900/88 via-orange-900/85 to-red-950/90'}`} />
        </div>
        <div className={`${card} p-10 max-w-md w-full text-center`}>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Report Submitted!</h2>
          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Your emergency report has been received. Barangay officials have been notified.
          </p>
          {coords && (
            <a
              href={`https://maps.google.com/?q=${coords.lat},${coords.lng}`}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center space-x-1.5 text-xs mb-4 underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Your pinned location was included in the report</span>
            </a>
          )}
          <p className={`text-xs font-medium mb-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            ⚠️ Please ensure this is a real emergency. Filing false reports may result in account suspension.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleReset} className={`flex-1 py-3 rounded-xl font-medium text-sm ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              Report Another
            </button>
            <button onClick={() => navigate('/home')} className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 transition">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-950/96 via-red-950/90 to-slate-950/96' : 'bg-gradient-to-br from-red-900/88 via-orange-900/85 to-red-950/90'}`} />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-screen-md">
        <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-white/80 hover:text-white transition text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /><span>Back</span>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-red-600/90 to-orange-600/90 backdrop-blur-sm rounded-2xl p-6 text-white shadow-xl border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-bold">Report Emergency</h2>
              <p className="text-red-100 text-sm">Notify barangay officials immediately</p>
            </div>
          </div>
          <div className="mt-4 px-4 py-2.5 bg-white/15 border border-white/25 rounded-xl text-xs text-red-100">
            ⚠️ For life-threatening situations, call <strong className="text-white">911</strong> immediately.
            False reports may result in account suspension.
          </div>
        </div>

        {error && (
          <div className={`${isDarkMode ? 'bg-red-950/60 border-red-800/60 text-red-300' : 'bg-red-50 border-red-200 text-red-600'} border rounded-xl p-3 text-sm`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emergency Type */}
          <div className={`${card} p-5`}>
            <label className={`block text-sm font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Emergency Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {EMERGENCY_TYPES.map((type) => {
                const active = selectedType === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(type.value)}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                      active
                        ? `${isDarkMode ? type.darkBg : type.bg} ${isDarkMode ? type.darkBorder : type.border} scale-[1.03] shadow-md ring-2 ring-red-500`
                        : `${isDarkMode ? 'bg-gray-800/60 border-gray-700 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`
                    }`}
                  >
                    <type.icon className={`w-7 h-7 mb-2 ${active ? type.color : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-xs font-semibold ${active ? type.color : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Severity */}
          <div className={`${card} p-5`}>
            <label className={`block text-sm font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Severity Level <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SEVERITIES.map((s) => {
                const active = severity === s.value
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      active
                        ? `${s.selBg} border-transparent text-white shadow-md`
                        : `${isDarkMode ? 'bg-gray-800/60 border-gray-700 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`
                    }`}
                  >
                    <div className={`text-sm font-bold mb-0.5 ${active ? 'text-white' : s.color}`}>{s.label}</div>
                    <div className={`text-xs leading-tight ${active ? 'text-white/80' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Location */}
          <div className={`${card} p-5 space-y-4`}>
            <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Location Details <span className="text-red-500">*</span>
            </label>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Purok</label>
              <div className="relative">
                <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <select name="purok" value={formData.purok} onChange={handleChange} required className={`${inputCls} pl-10 appearance-none`}>
                  <option value="">Select Purok</option>
                  <option value="Purok 1">Purok 1</option>
                  <option value="Purok 2">Purok 2</option>
                  <option value="Purok 3">Purok 3</option>
                  <option value="Purok 4">Purok 4</option>
                  <option value="Purok 5">Purok 5</option>
                </select>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Specific Location / Landmark</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Near the old chapel..." className={inputCls} />
            </div>
            <LocationPicker value={coords} onChange={setCoords} isDarkMode={isDarkMode} />
          </div>

          {/* Description */}
          <div className={`${card} p-5`}>
            <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              <FileText className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Emergency Description <span className="text-red-500">*</span>
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
          <div className={`${card} p-5 space-y-4`}>
            <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Your Contact Information</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Full Name</label>
                <input type="text" name="reporterName" value={formData.reporterName} onChange={handleChange} placeholder="Your full name" className={inputCls} required />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Phone className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />Phone Number
                </label>
                <input type="tel" name="reporterPhone" value={formData.reporterPhone} onChange={handleChange} placeholder="+63 xxx xxx xxxx" className={inputCls} required />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed text-base"
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Submitting Report...</span></>
              : <><AlertTriangle className="w-5 h-5" /><span>Submit Emergency Report</span></>
            }
          </button>
        </form>
      </div>
    </div>
  )
}

export default ReportEmergencyPage
