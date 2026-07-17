import { useState, useEffect } from 'react'
import {
  AlertTriangle, Flame, Stethoscope, ShieldAlert, Waves, Car, HelpCircle,
  Clock, CheckCircle, XCircle, Shield, MapPin, Phone, User, FileText,
  Loader2, RefreshCw, Filter, Navigation, ExternalLink,
  AlertOctagon, Ban, Unlock, Calendar, ChevronDown, ChevronUp
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import emergencyService from '../services/emergencyService'

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_MAP = {
  fire:     { label: 'Fire',         icon: Flame,       color: 'text-red-500',    bg: 'bg-red-100',    darkBg: 'bg-red-950/40' },
  medical:  { label: 'Medical',      icon: Stethoscope, color: 'text-pink-500',   bg: 'bg-pink-100',   darkBg: 'bg-pink-950/40' },
  crime:    { label: 'Crime / Theft',icon: ShieldAlert, color: 'text-orange-500', bg: 'bg-orange-100', darkBg: 'bg-orange-950/40' },
  flood:    { label: 'Flood',        icon: Waves,       color: 'text-blue-500',   bg: 'bg-blue-100',   darkBg: 'bg-blue-950/40' },
  accident: { label: 'Accident',     icon: Car,         color: 'text-yellow-500', bg: 'bg-yellow-100', darkBg: 'bg-yellow-950/40' },
  other:    { label: 'Other',        icon: HelpCircle,  color: 'text-gray-500',   bg: 'bg-gray-100',   darkBg: 'bg-gray-800/60' },
}

const SEVERITY_STYLE = {
  low:      { label: 'Low',      cls: 'bg-green-100 text-green-700' },
  medium:   { label: 'Medium',   cls: 'bg-yellow-100 text-yellow-700' },
  high:     { label: 'High',     cls: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', cls: 'bg-red-100 text-red-700 font-bold animate-pulse' },
}

const STATUS_CONFIG = {
  pending:  { icon: Clock,         label: 'Pending',           light: 'bg-orange-100 text-orange-700', dark: 'bg-orange-950/50 text-orange-400' },
  active:   { icon: Shield,        label: 'Active / Responded',light: 'bg-blue-100 text-blue-700',     dark: 'bg-blue-950/50 text-blue-400' },
  resolved: { icon: CheckCircle,   label: 'Resolved',          light: 'bg-green-100 text-green-700',   dark: 'bg-green-950/50 text-green-400' },
  rejected: { icon: XCircle,       label: 'Rejected',          light: 'bg-red-100 text-red-700',       dark: 'bg-red-950/50 text-red-400' },
  fake:     { icon: AlertOctagon,  label: 'Fake Report',       light: 'bg-purple-100 text-purple-700', dark: 'bg-purple-950/50 text-purple-400' },
}

const FILTER_TABS = ['all', 'pending', 'active', 'resolved', 'rejected', 'fake']

const SUSPENSION_PRESETS = [
  { label: '3 Days',   days: 3 },
  { label: '7 Days',   days: 7 },
  { label: '14 Days',  days: 14 },
  { label: '30 Days',  days: 30 },
  { label: '90 Days',  days: 90 },
  { label: 'Custom',   days: 'custom' },
  { label: 'Permanent',days: 'permanent' },
]

const getRelativeTime = (ts) => {
  const diff = Math.floor((new Date() - new Date(ts)) / 1000)
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const addDays = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const LocationMap = ({ coords, isDarkMode }) => {
  const [showMap, setShowMap] = useState(false)
  if (!coords?.lat || !coords?.lng) return null
  const mapsUrl = `https://maps.google.com/?q=${coords.lat},${coords.lng}`
  const embedSrc = `https://maps.google.com/maps?width=100%25&height=240&hl=en&q=${coords.lat},${coords.lng}&t=&z=16&ie=UTF8&iwloc=B&output=embed`
  return (
    <div className={`mt-3 rounded-xl overflow-hidden border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className={`flex items-center justify-between px-3 py-2 flex-wrap gap-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="flex items-center space-x-2">
          <Navigation className="w-3.5 h-3.5 text-red-500" />
          <span className={`text-xs font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Pinned Location</span>
          <code className={`text-xs font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </code>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMap(v => !v)}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'}`}
          >
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Google Maps</span>
          </a>
        </div>
      </div>
      {showMap && (
        <iframe
          src={embedSrc}
          width="100%"
          height="240"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ border: 0, display: 'block' }}
          title="Incident Location"
        />
      )}
    </div>
  )
}

const DispatchForm = ({ isDarkMode, onDispatch, onCancel }) => {
  const [tanodName, setTanodName] = useState('')
  const [tanodNote, setTanodNote] = useState('')
  const inputCls = `w-full px-3 py-2 border rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`
  return (
    <div className={`mt-3 p-4 rounded-xl border-2 ${isDarkMode ? 'bg-blue-950/30 border-blue-800/50' : 'bg-blue-50 border-blue-200'} space-y-3`}>
      <p className={`text-sm font-semibold flex items-center space-x-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
        <Shield className="w-4 h-4" /><span>Dispatch Tanod</span>
      </p>
      <div>
        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tanod Name / Unit</label>
        <input value={tanodName} onChange={e => setTanodName(e.target.value)} placeholder="e.g. Tanod Unit 3 – Juan dela Cruz" className={inputCls} />
      </div>
      <div>
        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dispatch Note (optional)</label>
        <textarea value={tanodNote} onChange={e => setTanodNote(e.target.value)} rows={2} placeholder="Additional instructions..." className={`${inputCls} resize-none`} />
      </div>
      <div className="flex space-x-2 pt-1">
        <button
          onClick={() => { if (tanodName.trim()) onDispatch(tanodName.trim(), tanodNote.trim()) }}
          disabled={!tanodName.trim()}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2 rounded-xl text-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >Confirm Dispatch</button>
        <button onClick={onCancel} className={`flex-1 py-2 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
          Cancel
        </button>
      </div>
    </div>
  )
}

const RejectForm = ({ isDarkMode, onReject, onCancel }) => {
  const [reason, setReason] = useState('')
  const inputCls = `w-full px-3 py-2 border rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`
  return (
    <div className={`mt-3 p-4 rounded-xl border-2 ${isDarkMode ? 'bg-red-950/30 border-red-800/50' : 'bg-red-50 border-red-200'} space-y-3`}>
      <p className={`text-sm font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>Reason for Rejection</p>
      <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Optional — provide a reason..." className={inputCls} />
      <div className="flex space-x-2">
        <button onClick={() => onReject(reason.trim())} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-xl text-sm transition">
          Confirm Reject
        </button>
        <button onClick={onCancel} className={`flex-1 py-2 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// Fake report + suspension form
const FakeReportForm = ({ isDarkMode, onConfirm, onCancel }) => {
  const [selectedPreset, setSelectedPreset] = useState('7')   // days as string or 'custom'/'permanent'
  const [customDate, setCustomDate] = useState(addDays(30))
  const [reason, setReason] = useState('')

  const inputCls = `w-full px-3 py-2 border rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`

  const isPermanent = selectedPreset === 'permanent'
  const isCustom = selectedPreset === 'custom'

  const getSuspendUntil = () => {
    if (isPermanent) return null
    if (isCustom) return new Date(customDate).toISOString()
    return new Date(addDays(Number(selectedPreset))).toISOString()
  }

  const getPreviewLabel = () => {
    if (isPermanent) return 'Permanent suspension'
    if (isCustom) return `Until ${new Date(customDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`
    return `${selectedPreset} days from today`
  }

  return (
    <div className={`mt-3 p-4 rounded-xl border-2 ${isDarkMode ? 'bg-purple-950/30 border-purple-800/50' : 'bg-purple-50 border-purple-200'} space-y-4`}>
      {/* Header */}
      <div className="flex items-center space-x-2">
        <AlertOctagon className="w-4 h-4 text-purple-500 flex-shrink-0" />
        <p className={`text-sm font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-800'}`}>
          Mark as Fake Report & Suspend Reporter
        </p>
      </div>

      {/* Warning notice */}
      <div className={`text-xs rounded-lg p-2.5 ${isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
        ⚠️ This will flag the report as fake, suspend the reporter from submitting new emergency reports, and send them an official warning notification.
      </div>

      {/* Suspension Duration */}
      <div>
        <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
          Suspension Duration
        </label>
        <div className="flex flex-wrap gap-2">
          {SUSPENSION_PRESETS.map(p => {
            const val = p.days === 'custom' ? 'custom' : p.days === 'permanent' ? 'permanent' : String(p.days)
            const active = selectedPreset === val
            return (
              <button
                key={val}
                type="button"
                onClick={() => setSelectedPreset(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  active
                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                    : isDarkMode
                      ? 'border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Custom date picker */}
        {isCustom && (
          <div className="mt-3">
            <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Select End Date</label>
            <input
              type="date"
              value={customDate}
              min={addDays(1)}
              onChange={e => setCustomDate(e.target.value)}
              className={inputCls}
            />
          </div>
        )}

        {/* Duration preview */}
        <div className={`mt-2 text-xs font-medium px-2.5 py-1.5 rounded-lg ${
          isPermanent
            ? isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'
            : isDarkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700'
        }`}>
          📅 {getPreviewLabel()}
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Reason / Official Note</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={2}
          placeholder="e.g. Verified on-site — no incident found. Reporter confirmed false alarm."
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Actions */}
      <div className="flex space-x-2 pt-1">
        <button
          type="button"
          onClick={() => onConfirm({ isPermanent, suspendUntil: getSuspendUntil(), reason: reason.trim() })}
          className="flex-1 flex items-center justify-center space-x-1.5 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-md"
        >
          <Ban className="w-4 h-4" />
          <span>Confirm Fake & Suspend</span>
        </button>
        <button type="button" onClick={onCancel} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Emergency Card ───────────────────────────────────────────────────────────

const EmergencyCard = ({ emergency, isDarkMode, onRefresh }) => {
  const [expanded, setExpanded]         = useState(false)
  const [loadingAction, setLoadingAction] = useState(null)
  const [showDispatch, setShowDispatch] = useState(false)
  const [showReject, setShowReject]     = useState(false)
  const [showFake, setShowFake]         = useState(false)

  const typeInfo     = TYPE_MAP[emergency.type] || TYPE_MAP.other
  const statusCfg    = STATUS_CONFIG[emergency.status] || STATUS_CONFIG.pending
  const severityInfo = SEVERITY_STYLE[emergency.severity] || SEVERITY_STYLE.medium
  const TypeIcon     = typeInfo.icon
  const StatusIcon   = statusCfg.icon
  const isFake       = emergency.status === 'fake'

  const cardBase = `${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border ${
    isFake ? (isDarkMode ? 'border-purple-800/60' : 'border-purple-300') : ''
  }`

  const act = async (fn, label) => {
    setLoadingAction(label)
    await fn()
    setLoadingAction(null)
    onRefresh()
  }

  const closeAllForms = () => { setShowDispatch(false); setShowReject(false); setShowFake(false) }

  return (
    <div className={cardBase}>

      {/* ── Collapsed header (always visible) ── */}
      <button
        onClick={() => setExpanded(p => !p)}
        className={`w-full flex items-center justify-between gap-3 p-4 text-left transition ${
          expanded ? `border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}` : 'rounded-2xl'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center ${isDarkMode ? typeInfo.darkBg : typeInfo.bg}`}>
            <TypeIcon className={`w-4.5 h-4.5 ${typeInfo.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-bold text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {typeInfo.label}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${severityInfo.cls}`}>
                {severityInfo.label}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${isDarkMode ? statusCfg.dark : statusCfg.light}`}>
                <StatusIcon className="w-3 h-3" />{statusCfg.label}
              </span>
            </div>
            <div className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />{emergency.reporterName || 'Anonymous'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />{emergency.purok || '—'}
              </span>
              <span>{getRelativeTime(emergency.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className={`p-1 rounded-lg flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-100'}`}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="p-4 space-y-3">

          {/* Meta */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="flex items-center space-x-1.5"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span>{emergency.purok}{emergency.location ? ` — ${emergency.location}` : ''}</span></div>
            <div className="flex items-center space-x-1.5"><User className="w-3.5 h-3.5 flex-shrink-0" /><span>{emergency.reporterName || 'Anonymous'}</span></div>
            {emergency.reporterPhone && <div className="flex items-center space-x-1.5"><Phone className="w-3.5 h-3.5 flex-shrink-0" /><span>{emergency.reporterPhone}</span></div>}
          </div>

          {/* Description */}
          <div className={`p-3 rounded-xl text-sm leading-relaxed ${isDarkMode ? 'bg-gray-800/60 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
            <FileText className={`w-3.5 h-3.5 inline mr-1.5 -mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            {emergency.description}
          </div>

          {/* GPS Map */}
          <LocationMap coords={emergency.coords} isDarkMode={isDarkMode} />

          {/* Info banners */}
          {emergency.responseNote && (
            <div className={`p-2.5 rounded-xl text-xs ${isDarkMode ? 'bg-blue-950/30 text-blue-300 border border-blue-800/40' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              <strong>Response note:</strong> {emergency.responseNote}
            </div>
          )}
          {emergency.rejectionReason && (
            <div className={`p-2.5 rounded-xl text-xs ${isDarkMode ? 'bg-red-950/30 text-red-300 border border-red-800/40' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <strong>Rejection reason:</strong> {emergency.rejectionReason}
            </div>
          )}
          {isFake && emergency.fakeReason && (
            <div className={`p-2.5 rounded-xl text-xs flex items-start space-x-2 ${isDarkMode ? 'bg-purple-950/30 text-purple-300 border border-purple-800/40' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
              <AlertOctagon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div><strong>Fake report reason:</strong> {emergency.fakeReason}</div>
            </div>
          )}
          {emergency.tanodDispatched && emergency.tanodInfo && (
            <div className={`p-2.5 rounded-xl text-xs flex items-start space-x-2 ${isDarkMode ? 'bg-indigo-950/30 text-indigo-300 border border-indigo-800/40' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
              <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div><strong>Tanod dispatched:</strong> {emergency.tanodInfo.tanodName}{emergency.tanodInfo.tanodNote ? ` — ${emergency.tanodInfo.tanodNote}` : ''}</div>
            </div>
          )}

          {/* Inline forms */}
          {showDispatch && (
            <DispatchForm
              isDarkMode={isDarkMode}
              onDispatch={(name, note) => act(() => emergencyService.dispatchTanod(emergency.id, { tanodName: name, tanodNote: note }), 'dispatch').then(closeAllForms)}
              onCancel={closeAllForms}
            />
          )}
          {showReject && (
            <RejectForm
              isDarkMode={isDarkMode}
              onReject={(reason) => act(() => emergencyService.rejectEmergency(emergency.id, reason), 'reject').then(closeAllForms)}
              onCancel={closeAllForms}
            />
          )}
          {showFake && (
            <FakeReportForm
              isDarkMode={isDarkMode}
              onConfirm={(opts) => act(() => emergencyService.markAsFake(emergency.id, opts), 'fake').then(closeAllForms)}
              onCancel={closeAllForms}
            />
          )}

          {/* Action buttons */}
          {!showDispatch && !showReject && !showFake && (
            <div className="flex flex-wrap gap-2 pt-1">
              {emergency.status === 'pending' && (
                <>
                  <button
                    onClick={() => act(() => emergencyService.respondToEmergency(emergency.id, ''), 'respond')}
                    disabled={!!loadingAction}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-60"
                  >
                    {loadingAction === 'respond' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    <span>Respond</span>
                  </button>
                  <button
                    onClick={() => { closeAllForms(); setShowReject(true) }}
                    disabled={!!loadingAction}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-60 ${isDarkMode ? 'bg-red-900/60 hover:bg-red-800 text-red-300' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                  >
                    <XCircle className="w-3.5 h-3.5" /><span>Reject</span>
                  </button>
                  <button
                    onClick={() => { closeAllForms(); setShowFake(true) }}
                    disabled={!!loadingAction}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-60 ${isDarkMode ? 'bg-purple-900/60 hover:bg-purple-800 text-purple-300' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'}`}
                  >
                    <AlertOctagon className="w-3.5 h-3.5" /><span>Mark as Fake</span>
                  </button>
                </>
              )}
              {emergency.status === 'active' && (
                <>
                  {!emergency.tanodDispatched && (
                    <button
                      onClick={() => { closeAllForms(); setShowDispatch(true) }}
                      disabled={!!loadingAction}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-60"
                    >
                      <Shield className="w-3.5 h-3.5" /><span>Dispatch Tanod</span>
                    </button>
                  )}
                  <button
                    onClick={() => act(() => emergencyService.resolveEmergency(emergency.id), 'resolve')}
                    disabled={!!loadingAction}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-60"
                  >
                    {loadingAction === 'resolve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    <span>Mark Resolved</span>
                  </button>
                  <button
                    onClick={() => { closeAllForms(); setShowFake(true) }}
                    disabled={!!loadingAction}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-60 ${isDarkMode ? 'bg-purple-900/60 hover:bg-purple-800 text-purple-300' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'}`}
                  >
                    <AlertOctagon className="w-3.5 h-3.5" /><span>Mark as Fake</span>
                  </button>
                </>
              )}
              {isFake && emergency.userId && (
                <button
                  onClick={() => act(() => emergencyService.liftSuspension(emergency.userId), 'lift')}
                  disabled={!!loadingAction}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-60 ${isDarkMode ? 'bg-green-900/60 hover:bg-green-800 text-green-300' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}
                >
                  {loadingAction === 'lift' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>Lift Suspension</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const EmergencyManagementPage = () => {
  const { isDarkMode } = useTheme()
  const [emergencies, setEmergencies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  const fetchEmergencies = async () => {
    try {
      setIsLoading(true)
      setEmergencies(await emergencyService.getEmergencies())
    } catch (error) {
      console.error('Error fetching emergencies:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchEmergencies() }, [])

  const filtered = activeFilter === 'all' ? emergencies : emergencies.filter(e => e.status === activeFilter)
  const pendingCount = emergencies.filter(e => e.status === 'pending').length
  const card = `${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border`

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-950/96 via-red-950/90 to-slate-950/96' : 'bg-gradient-to-br from-red-900/88 via-orange-900/85 to-red-950/90'}`} />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-screen-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600/90 to-orange-600/90 backdrop-blur-sm rounded-2xl p-6 text-white shadow-xl border border-white/20">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold">Barangay Ilihan Emergency Management</h2>
                <p className="text-red-100 text-sm">Respond, dispatch assistance, and manage false reports</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pendingCount > 0 && (
                <span className="bg-white/20 border border-white/30 text-white text-sm font-bold px-3 py-1.5 rounded-full animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
              <button
                onClick={fetchEmergencies}
                className="flex items-center space-x-1.5 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-sm font-medium px-3 py-2 rounded-xl transition"
              >
                <RefreshCw className="w-4 h-4" /><span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={`${card} p-2 flex flex-wrap gap-1`}>
          <Filter className={`w-4 h-4 m-2 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          {FILTER_TABS.map(tab => {
            const count = tab === 'all' ? emergencies.length : emergencies.filter(e => e.status === tab).length
            const isFakeTab = tab === 'fake'
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                  activeFilter === tab
                    ? isFakeTab
                      ? 'bg-purple-600 text-white shadow-sm'
                      : isDarkMode ? 'bg-red-900/70 text-red-300' : 'bg-red-600 text-white shadow-sm'
                    : isDarkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab === 'fake' ? 'Fake Reports' : tab}{' '}
                {count > 0 && <span className={`ml-1 text-xs ${activeFilter === tab ? 'opacity-80' : 'opacity-60'}`}>({count})</span>}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className={`${card} p-10 text-center`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading emergencies...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`${card} p-10 text-center`}>
            <AlertTriangle className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No {activeFilter === 'all' ? '' : activeFilter === 'fake' ? 'fake ' : activeFilter + ' '}emergencies found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filtered.map(emergency => (
              <EmergencyCard
                key={emergency.id}
                emergency={emergency}
                isDarkMode={isDarkMode}
                onRefresh={fetchEmergencies}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmergencyManagementPage
