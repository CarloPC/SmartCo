import { useState, useEffect } from 'react'
import {
  CheckCircle, XCircle, Activity, Package, Calendar,
  Loader2, AlertCircle, User, Mail, MapPin, Clock,
  Heart, Pill, Droplets, Thermometer, Weight, ChevronDown, ChevronUp,
  Tag, Users, Info, Sparkles, CalendarCheck, FileText, MessageSquare
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import adminService from '../services/adminService'

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateTime = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  })
}

const formatAppointment = (date, time) => {
  if (!date) return null
  return new Date(`${date}T${time || '00:00'}`).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    year: 'numeric', hour: 'numeric', minute: '2-digit'
  })
}

/* ─── Parse AI notes ─────────────────────────────────────────────────────── */
const parseAiNotes = (raw = '') => {
  if (!raw) return { symptoms: '', analysis: '' }
  if (raw.includes('\n\nAI Health Analysis:\n')) {
    const [s, a] = raw.split('\n\nAI Health Analysis:\n')
    return {
      symptoms: s.replace(/^Patient Symptoms:\s*/i, '').trim(),
      analysis: a.trim()
    }
  }
  return { symptoms: raw.replace(/^Patient Symptoms:\s*/i, '').trim(), analysis: '' }
}

/* ─── Pending badge ──────────────────────────────────────────────────────── */
const PendingBadge = ({ isDarkMode }) => (
  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
    isDarkMode ? 'bg-orange-950/50 text-orange-400' : 'bg-orange-100 text-orange-700'
  }`}>
    Pending
  </span>
)

/* ─── Submitter info block ───────────────────────────────────────────────── */
const SubmitterBlock = ({ user, submittedAt, isDarkMode }) => {
  const roleLabel = {
    admin: 'Administrator',
    barangay_official: 'Barangay Official',
    resident: 'Resident'
  }[user?.role] || 'Resident'

  const roleCls = {
    admin: isDarkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700',
    barangay_official: isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700',
    resident: isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
  }[user?.role] || (isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')

  return (
    <div className={`rounded-xl p-3 mb-3 ${isDarkMode ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-100'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
        Submitted by
      </p>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ${
          isDarkMode ? 'bg-blue-800 text-blue-100' : 'bg-blue-600 text-white'
        }`}>
          {user?.fullName?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <p className={`font-semibold text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {user?.fullName || 'Unknown User'}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleCls}`}>
              {roleLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {user?.email && (
              <span className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Mail className="w-3 h-3" />{user.email}
              </span>
            )}
            {user?.purok && (
              <span className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <MapPin className="w-3 h-3" />{user.purok}
              </span>
            )}
          </div>
        </div>
      </div>
      {submittedAt && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <Clock className="w-3 h-3" />
          Submitted on {formatDateTime(submittedAt)}
        </div>
      )}
    </div>
  )
}

/* ─── Info row ───────────────────────────────────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value, isDarkMode }) => {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
      <div>
        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}: </span>
        <span className={`text-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{value}</span>
      </div>
    </div>
  )
}

/* ─── Expandable details wrapper ─────────────────────────────────────────── */
const ExpandableDetails = ({ children, isDarkMode }) => {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-1 text-xs font-medium mb-2 transition ${
          isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {open ? 'Hide details' : 'View full details'}
      </button>
      {open && (
        <div className={`rounded-xl p-3 space-y-1.5 ${isDarkMode ? 'bg-gray-800/70' : 'bg-gray-50'}`}>
          {children}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   HEALTH RECORD CARD — with AI analysis + inline reject reason
═══════════════════════════════════════════════════════════════════════════ */
const HealthRecordCard = ({ record, submitter, onApprove, onReject, actionLoading, isDarkMode }) => {
  const [expanded, setExpanded]     = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const isScheduled = record.type === 'scheduled_checkup'
  const { symptoms, analysis } = parseAiNotes(record.aiSymptomsNotes)
  const appointment = formatAppointment(record.scheduledDate, record.scheduledTime)
  const isLoading = actionLoading === record.id

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) return
    onReject(record.id, rejectReason.trim())
  }

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm resize-none ${
    isDarkMode
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-red-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-red-400'
  } focus:outline-none focus:ring-2 focus:border-transparent transition`

  return (
    <div className={`${
      isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
    } backdrop-blur-lg rounded-xl shadow-xl border`}>

      {/* ── Card Header (always visible) ── */}
      <button
        onClick={() => setExpanded(p => !p)}
        className={`w-full flex items-center justify-between p-4 text-left transition ${
          expanded
            ? `border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`
            : 'rounded-xl'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-1.5 rounded-lg flex-shrink-0 ${isScheduled
            ? isDarkMode ? 'bg-green-900/40' : 'bg-green-100'
            : isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100'
          }`}>
            {isScheduled
              ? <Heart className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              : <Activity className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`font-semibold text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {submitter?.fullName || 'Unknown User'}
              </p>
              <PendingBadge isDarkMode={isDarkMode} />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {isScheduled ? 'AI-Recommended Checkup Request' : 'Health Checkup Record'}
              </span>
              {isScheduled && (
                <span className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-green-500' : 'text-green-600'}`}>
                  <Sparkles className="w-3 h-3" /> Groq AI
                </span>
              )}
              {appointment && (
                <span className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  <CalendarCheck className="w-3 h-3" /> {record.scheduledDate}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={`ml-2 p-1 rounded-lg flex-shrink-0 transition ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-100'}`}>
          {expanded
            ? <ChevronUp className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4" />
          }
        </div>
      </button>

      {/* ── Expanded detail body ── */}
      {expanded && (
      <div className="p-4 space-y-4">
        {/* ── Submitter ── */}
        <SubmitterBlock user={submitter} submittedAt={record.createdAt} isDarkMode={isDarkMode} />

        {/* ── Preferred Appointment ── */}
        {appointment && (
          <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${
            isDarkMode ? 'bg-blue-950/40 border-blue-800/40' : 'bg-blue-50 border-blue-200'
          }`}>
            <CalendarCheck className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Preferred Appointment
              </p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{appointment}</p>
            </div>
          </div>
        )}

        {/* ── Patient Symptoms ── */}
        {symptoms && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText className={`w-3.5 h-3.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Patient Reported Symptoms
              </p>
            </div>
            <div className={`p-3 rounded-xl text-sm leading-relaxed ${
              isDarkMode ? 'bg-gray-800/60 text-gray-200' : 'bg-gray-50 text-gray-700'
            }`}>
              {symptoms}
            </div>
          </div>
        )}

        {/* ── AI Health Analysis ── */}
        {analysis && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className={`w-3.5 h-3.5 ${isDarkMode ? 'text-green-500' : 'text-green-600'}`} />
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-green-500' : 'text-green-600'}`}>
                AI Health Analysis
              </p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isDarkMode ? 'bg-green-900/30 text-green-500' : 'bg-green-100 text-green-700'}`}>
                Groq AI
              </span>
            </div>
            <div className={`p-3.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
              isDarkMode
                ? 'bg-green-950/30 border border-green-900/40 text-gray-200'
                : 'bg-green-50 border border-green-200 text-gray-700'
            }`}>
              {analysis}
            </div>
          </div>
        )}

        {/* Expandable extra details for non-scheduled records */}
        {!isScheduled && (
          <ExpandableDetails isDarkMode={isDarkMode}>
            <InfoRow icon={Droplets}    label="Blood Type"     value={record.bloodType}                                                                     isDarkMode={isDarkMode} />
            <InfoRow icon={Thermometer} label="Blood Pressure" value={record.healthAssessment?.bloodPressure}                                                isDarkMode={isDarkMode} />
            <InfoRow icon={Weight}      label="Weight"         value={record.weight ? `${record.weight} kg` : null}                                          isDarkMode={isDarkMode} />
            <InfoRow icon={Heart}       label="Conditions"     value={Array.isArray(record.conditions) ? record.conditions.join(', ') : record.conditions}   isDarkMode={isDarkMode} />
            <InfoRow icon={Pill}        label="Medications"    value={Array.isArray(record.medications) ? record.medications.join(', ') : record.medications} isDarkMode={isDarkMode} />
            <InfoRow icon={Info}        label="Allergies"      value={Array.isArray(record.allergies) ? record.allergies.join(', ') : record.allergies}       isDarkMode={isDarkMode} />
            <InfoRow icon={Activity}    label="Symptoms"       value={Array.isArray(record.symptoms) ? record.symptoms.join(', ') : record.symptoms}          isDarkMode={isDarkMode} />
            <InfoRow icon={Calendar}    label="Checkup Date"   value={formatDate(record.checkupDate || record.createdAt)}                                     isDarkMode={isDarkMode} />
          </ExpandableDetails>
        )}

        {/* ── Rejection reason panel ── */}
        {rejectMode && (
          <div className={`p-3.5 rounded-xl border space-y-3 ${
            isDarkMode ? 'bg-red-950/20 border-red-900/40' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <MessageSquare className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                Reason for Rejection
              </p>
              <span className={`text-xs ${isDarkMode ? 'text-red-500' : 'text-red-500'}`}>* required</span>
            </div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. No available slot on this date. Please choose another date…"
              className={inputCls}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleRejectSubmit}
                disabled={isLoading || !rejectReason.trim()}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm transition ${
                  isDarkMode
                    ? 'bg-red-900/60 hover:bg-red-900/80 text-red-200 border border-red-800/40'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                } disabled:opacity-40`}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirm Rejection
              </button>
              <button
                onClick={() => { setRejectMode(false); setRejectReason('') }}
                disabled={isLoading}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm transition ${
                  isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Action buttons ── */}
        {!rejectMode && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onApprove(record.id)}
              disabled={isLoading}
              className={`flex-1 font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 ${
                isDarkMode
                  ? 'bg-green-950/50 hover:bg-green-900/70 text-green-300 border border-green-900/40'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } disabled:opacity-50`}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Approve
            </button>
            <button
              onClick={() => setRejectMode(true)}
              disabled={isLoading}
              className={`flex-1 font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 ${
                isDarkMode
                  ? 'bg-red-950/50 hover:bg-red-900/70 text-red-300 border border-red-900/40'
                  : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
              } disabled:opacity-50`}
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        )}
      </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOD AID CARD — collapsed by default
═══════════════════════════════════════════════════════════════════════════ */
const FoodAidCard = ({ schedule, submitter, onApprove, onReject, actionLoading, isDarkMode }) => {
  const [expanded, setExpanded]     = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const isLoading = actionLoading === schedule.id

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm resize-none ${
    isDarkMode
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-red-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-red-400'
  } focus:outline-none focus:ring-2 focus:border-transparent transition`

  const cardBase = `${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-xl shadow-xl border`

  return (
    <div className={cardBase}>
      {/* ── Collapsed header ── */}
      <button
        onClick={() => setExpanded(p => !p)}
        className={`w-full flex items-center justify-between p-4 text-left transition ${
          expanded ? `border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}` : 'rounded-xl'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-1.5 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-green-900/40' : 'bg-green-100'}`}>
            <Package className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`font-semibold text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {submitter?.fullName || 'Unknown User'}
              </p>
              <PendingBadge isDarkMode={isDarkMode} />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Community Assistance — {schedule.purok || 'Unspecified Purok'}
              </span>
              {schedule.date && (
                <span className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  <Calendar className="w-3 h-3" /> {schedule.date}
                </span>
              )}
              {schedule.totalFamilies && (
                <span className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Users className="w-3 h-3" /> {schedule.totalFamilies} families
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={`ml-2 p-1 rounded-lg flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-100'}`}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="p-4 space-y-4">
          <SubmitterBlock user={submitter} submittedAt={schedule.createdAt} isDarkMode={isDarkMode} />
          <div className={`rounded-xl p-3 space-y-1.5 ${isDarkMode ? 'bg-gray-800/70' : 'bg-gray-50'}`}>
            <InfoRow icon={MapPin}   label="Purok"          value={schedule.purok}                    isDarkMode={isDarkMode} />
            <InfoRow icon={Calendar} label="Schedule Date"  value={formatDate(schedule.date)}          isDarkMode={isDarkMode} />
            <InfoRow icon={Users}    label="Total Families" value={schedule.totalFamilies}             isDarkMode={isDarkMode} />
            <InfoRow icon={Package}  label="Items"          value={schedule.items}                     isDarkMode={isDarkMode} />
            <InfoRow icon={Tag}      label="Category"       value={schedule.category}                  isDarkMode={isDarkMode} />
            <InfoRow icon={Info}     label="Notes"          value={schedule.notes}                     isDarkMode={isDarkMode} />
            <InfoRow icon={Clock}    label="Submitted"      value={formatDateTime(schedule.createdAt)} isDarkMode={isDarkMode} />
          </div>

          {/* Reject reason panel */}
          {rejectMode && (
            <div className={`p-3.5 rounded-xl border space-y-3 ${isDarkMode ? 'bg-red-950/20 border-red-900/40' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                <MessageSquare className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>Reason for Rejection</p>
                <span className={`text-xs ${isDarkMode ? 'text-red-500' : 'text-red-500'}`}>* required</span>
              </div>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                placeholder="e.g. Insufficient budget allocation for this period…" className={inputCls} autoFocus />
              <div className="flex gap-2">
                <button onClick={() => { onReject(schedule.id, rejectReason.trim()); }} disabled={isLoading || !rejectReason.trim()}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm transition ${
                    isDarkMode ? 'bg-red-900/60 hover:bg-red-900/80 text-red-200 border border-red-800/40' : 'bg-red-500 hover:bg-red-600 text-white'
                  } disabled:opacity-40`}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Confirm Rejection
                </button>
                <button onClick={() => { setRejectMode(false); setRejectReason('') }} disabled={isLoading}
                  className={`px-4 py-2.5 rounded-xl font-medium text-sm transition ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!rejectMode && (
            <div className="flex gap-2 pt-1">
              <button onClick={() => onApprove(schedule.id)} disabled={isLoading}
                className={`flex-1 font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 ${
                  isDarkMode ? 'bg-green-950/50 hover:bg-green-900/70 text-green-300 border border-green-900/40' : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50`}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
              </button>
              <button onClick={() => setRejectMode(true)} disabled={isLoading}
                className={`flex-1 font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 ${
                  isDarkMode ? 'bg-red-950/50 hover:bg-red-900/70 text-red-300 border border-red-900/40' : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                } disabled:opacity-50`}>
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   EVENT CARD — collapsed by default
═══════════════════════════════════════════════════════════════════════════ */
const EventCard = ({ event, submitter, onApprove, onReject, actionLoading, isDarkMode }) => {
  const [expanded, setExpanded]     = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const isLoading = actionLoading === event.id

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm resize-none ${
    isDarkMode
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-red-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-red-400'
  } focus:outline-none focus:ring-2 focus:border-transparent transition`

  const cardBase = `${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-xl shadow-xl border`

  return (
    <div className={cardBase}>
      {/* ── Collapsed header ── */}
      <button
        onClick={() => setExpanded(p => !p)}
        className={`w-full flex items-center justify-between p-4 text-left transition ${
          expanded ? `border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}` : 'rounded-xl'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-1.5 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-purple-900/40' : 'bg-purple-100'}`}>
            <Calendar className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`font-semibold text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {submitter?.fullName || 'Unknown User'}
              </p>
              <PendingBadge isDarkMode={isDarkMode} />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className={`text-xs truncate max-w-[160px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {event.title || 'Untitled Event'}
              </span>
              {event.date && (
                <span className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  <Calendar className="w-3 h-3" /> {event.date}
                </span>
              )}
              {event.venue && (
                <span className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <MapPin className="w-3 h-3" /> {event.venue}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={`ml-2 p-1 rounded-lg flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-100'}`}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="p-4 space-y-4">
          <SubmitterBlock user={submitter} submittedAt={event.createdAt} isDarkMode={isDarkMode} />

          {event.description && (
            <div className={`p-3 rounded-xl text-sm leading-relaxed ${isDarkMode ? 'bg-gray-800/60 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
              {event.description}
            </div>
          )}

          <div className={`rounded-xl p-3 space-y-1.5 ${isDarkMode ? 'bg-gray-800/70' : 'bg-gray-50'}`}>
            <InfoRow icon={Tag}      label="Category"      value={event.category}                  isDarkMode={isDarkMode} />
            <InfoRow icon={Calendar} label="Event Date"    value={formatDate(event.date)}           isDarkMode={isDarkMode} />
            <InfoRow icon={MapPin}   label="Venue"         value={event.venue}                      isDarkMode={isDarkMode} />
            <InfoRow icon={Users}    label="Max Attendees" value={event.maxAttendees}               isDarkMode={isDarkMode} />
            <InfoRow icon={Clock}    label="Submitted"     value={formatDateTime(event.createdAt)}  isDarkMode={isDarkMode} />
          </div>

          {/* Reject reason panel */}
          {rejectMode && (
            <div className={`p-3.5 rounded-xl border space-y-3 ${isDarkMode ? 'bg-red-950/20 border-red-900/40' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                <MessageSquare className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>Reason for Rejection</p>
                <span className={`text-xs ${isDarkMode ? 'text-red-500' : 'text-red-500'}`}>* required</span>
              </div>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                placeholder="e.g. Venue not available on this date…" className={inputCls} autoFocus />
              <div className="flex gap-2">
                <button onClick={() => { onReject(event.id, rejectReason.trim()) }} disabled={isLoading || !rejectReason.trim()}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm transition ${
                    isDarkMode ? 'bg-red-900/60 hover:bg-red-900/80 text-red-200 border border-red-800/40' : 'bg-red-500 hover:bg-red-600 text-white'
                  } disabled:opacity-40`}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Confirm Rejection
                </button>
                <button onClick={() => { setRejectMode(false); setRejectReason('') }} disabled={isLoading}
                  className={`px-4 py-2.5 rounded-xl font-medium text-sm transition ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!rejectMode && (
            <div className="flex gap-2 pt-1">
              <button onClick={() => onApprove(event.id)} disabled={isLoading}
                className={`flex-1 font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 ${
                  isDarkMode ? 'bg-green-950/50 hover:bg-green-900/70 text-green-300 border border-green-900/40' : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50`}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
              </button>
              <button onClick={() => setRejectMode(true)} disabled={isLoading}
                className={`flex-1 font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 ${
                  isDarkMode ? 'bg-red-950/50 hover:bg-red-900/70 text-red-300 border border-red-900/40' : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                } disabled:opacity-50`}>
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
const AdminApprovalsPage = () => {
  const { isDarkMode } = useTheme()

  const [activeTab, setActiveTab]       = useState('health')
  const [healthRecords, setHealthRecords] = useState([])
  const [foodAidSchedules, setFoodAidSchedules] = useState([])
  const [events, setEvents]             = useState([])
  const [usersMap, setUsersMap]         = useState({})
  const [isLoading, setIsLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchPendingApprovals() }, [])

  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true)
      const [health, foodAid, eventsData] = await Promise.all([
        adminService.getPendingHealthRecords(),
        adminService.getPendingFoodAidSchedules(),
        adminService.getPendingEvents()
      ])
      setHealthRecords(health)
      setFoodAidSchedules(foodAid)
      setEvents(eventsData)

      const ids = new Set()
      health.forEach(r => r.userId && ids.add(r.userId))
      foodAid.forEach(r => (r.userId || r.createdBy) && ids.add(r.userId || r.createdBy))
      eventsData.forEach(r => (r.userId || r.createdBy) && ids.add(r.userId || r.createdBy))

      const userEntries = await Promise.all(
        [...ids].map(id => adminService.getUserById(id).then(u => [id, u]))
      )
      setUsersMap(Object.fromEntries(userEntries))
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /* ── Health handlers ── */
  const handleApproveHealth = async (id) => {
    try {
      setActionLoading(id)
      await adminService.approveHealthRecord(id)
      setHealthRecords(prev => prev.filter(r => r.id !== id))
    } catch {
      alert('Failed to approve health record')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectHealth = async (id, reason) => {
    try {
      setActionLoading(id)
      await adminService.rejectHealthRecord(id, reason)
      setHealthRecords(prev => prev.filter(r => r.id !== id))
    } catch {
      alert('Failed to reject health record')
    } finally {
      setActionLoading(null)
    }
  }

  /* ── Food Aid handlers ── */
  const handleApproveFoodAid = async (id) => {
    try { setActionLoading(id); await adminService.approveFoodAidSchedule(id); setFoodAidSchedules(prev => prev.filter(s => s.id !== id)) }
    catch { alert('Failed to approve food aid schedule') }
    finally { setActionLoading(null) }
  }

  const handleRejectFoodAid = async (id, reason) => {
    try { setActionLoading(id); await adminService.rejectFoodAidSchedule(id, reason || ''); setFoodAidSchedules(prev => prev.filter(s => s.id !== id)) }
    catch { alert('Failed to reject food aid schedule') }
    finally { setActionLoading(null) }
  }

  /* ── Event handlers ── */
  const handleApproveEvent = async (id) => {
    try { setActionLoading(id); await adminService.approveEvent(id); setEvents(prev => prev.filter(e => e.id !== id)) }
    catch { alert('Failed to approve event') }
    finally { setActionLoading(null) }
  }

  const handleRejectEvent = async (id, reason) => {
    try { setActionLoading(id); await adminService.rejectEvent(id, reason || ''); setEvents(prev => prev.filter(e => e.id !== id)) }
    catch { alert('Failed to reject event') }
    finally { setActionLoading(null) }
  }

  const cardCls = `${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-xl shadow-xl border p-4`

  const EmptyState = ({ icon: Icon, label }) => (
    <div className={`${cardCls} text-center py-10`}>
      <Icon className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
    </div>
  )

  const tabs = [
    { key: 'health',  icon: Activity, label: 'Health',   count: healthRecords.length,    color: 'blue'   },
    { key: 'foodaid', icon: Package,  label: 'Community Assistance', count: foodAidSchedules.length,  color: 'green'  },
    { key: 'events',  icon: Calendar, label: 'Events',   count: events.length,            color: 'purple' },
  ]

  const tabActive = {
    blue:   isDarkMode ? 'border-blue-400 text-blue-400'     : 'border-blue-600 text-blue-600',
    green:  isDarkMode ? 'border-green-400 text-green-400'   : 'border-green-600 text-green-600',
    purple: isDarkMode ? 'border-purple-400 text-purple-400' : 'border-purple-600 text-purple-600',
  }

  return (
    <div className="min-h-screen relative">
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
            ? 'bg-gradient-to-r from-orange-900/90 to-red-950/90 border-gray-700/50'
            : 'bg-gradient-to-r from-orange-500/90 to-red-600/90 border-white/20'
        } backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center gap-3 mb-1">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Pending Approvals</h2>
          </div>
          <p className={isDarkMode ? 'text-orange-200' : 'text-orange-100'}>
            Review submitted records — approve or reject with a reason
          </p>
        </div>

        {/* Tabs */}
        <div className={`${
          isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
        } backdrop-blur-lg rounded-xl border shadow-lg`}>
          <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {tabs.map(({ key, icon: Icon, label, count, color }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-3 px-2 font-medium flex items-center justify-center gap-1.5 text-sm transition ${
                  activeTab === key
                    ? `border-b-2 ${tabActive[color]}`
                    : isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === key
                    ? isDarkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'
                    : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className={`${cardCls} py-10 text-center`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading approvals…</p>
          </div>
        ) : (
          <>
            {/* ── Health Records ── */}
            {activeTab === 'health' && (
              <div className="space-y-4">
                {healthRecords.length > 0 ? healthRecords.map(record => (
                  <HealthRecordCard
                    key={record.id}
                    record={record}
                    submitter={usersMap[record.userId]}
                    onApprove={handleApproveHealth}
                    onReject={handleRejectHealth}
                    actionLoading={actionLoading}
                    isDarkMode={isDarkMode}
                  />
                )) : <EmptyState icon={Activity} label="No pending health records" />}
              </div>
            )}

            {/* ── Food Aid ── */}
            {activeTab === 'foodaid' && (
              <div className="space-y-3">
                {foodAidSchedules.length > 0 ? foodAidSchedules.map(schedule => (
                  <FoodAidCard
                    key={schedule.id}
                    schedule={schedule}
                    submitter={usersMap[schedule.userId || schedule.createdBy]}
                    onApprove={handleApproveFoodAid}
                    onReject={handleRejectFoodAid}
                    actionLoading={actionLoading}
                    isDarkMode={isDarkMode}
                  />
                )) : <EmptyState icon={Package} label="No pending community assistance schedules" />}
              </div>
            )}

            {/* ── Events ── */}
            {activeTab === 'events' && (
              <div className="space-y-3">
                {events.length > 0 ? events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    submitter={usersMap[event.userId || event.createdBy]}
                    onApprove={handleApproveEvent}
                    onReject={handleRejectEvent}
                    actionLoading={actionLoading}
                    isDarkMode={isDarkMode}
                  />
                )) : <EmptyState icon={Calendar} label="No pending events" />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminApprovalsPage
