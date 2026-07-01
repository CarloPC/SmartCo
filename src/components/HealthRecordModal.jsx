
import { X, CalendarCheck, Clock, CheckCircle, XCircle, AlertCircle, FileText, User, Stethoscope, Sparkles, Activity } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

/* â”€â”€ Status badge helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const StatusBadge = ({ status, isDarkMode }) => {
  if (status === 'approved') return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700'}`}>
      <CheckCircle className="w-3 h-3" /> Approved
    </span>
  )
  if (status === 'rejected') return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-700'}`}>
      <XCircle className="w-3 h-3" /> Rejected
    </span>
  )
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-orange-900/40 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
      <Clock className="w-3 h-3" /> Pending Approval
    </span>
  )
}

/* â”€â”€ Info row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const InfoRow = ({ icon: Icon, label, value, isDarkMode, mono = false }) => {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <Icon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
        <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${mono ? 'font-mono text-xs' : ''} ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{value}</p>
      </div>
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN MODAL
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const HealthRecordModal = ({ record, isOpen, onClose }) => {
  const { isDarkMode } = useTheme()

  if (!isOpen || !record) return null

  const isUrgent = record.healthAssessment?.overallStatus === 'critical' || record.healthAssessment?.urgencyLevel === 'urgent'
  const isScheduled = record.type === 'scheduled_checkup'

  const formatDate = (iso) => {
    if (!iso) return null
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: 'numeric', minute: '2-digit'
    })
  }

  const formatScheduled = (date, time) => {
    if (!date) return null
    const d = new Date(`${date}T${time || '00:00'}`)
    return d.toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: 'numeric', minute: '2-digit'
    })
  }

  // Parse AI analysis out of aiSymptomsNotes
  const rawNotes = record.aiSymptomsNotes || ''
  const [symptomsSection, analysisSection] = rawNotes.includes('\n\nAI Health Analysis:\n')
    ? rawNotes.split('\n\nAI Health Analysis:\n')
    : [rawNotes, '']
  const userSymptoms = symptomsSection.replace(/^Patient Symptoms:\s*/i, '').trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl max-h-[88vh] flex flex-col ${
        isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-100'
      }`}>

        {/* â”€â”€ Header â”€â”€ */}
        <div className={`flex items-center justify-between p-5 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isUrgent
              ? isDarkMode ? 'bg-red-900/40' : 'bg-red-100'
              : isScheduled
              ? isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100'
              : isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              {isUrgent
                ? <AlertCircle className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                : isScheduled
                ? <CalendarCheck className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                : <Activity className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              }
            </div>
            <div>
              <h3 className={`font-bold text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {isScheduled ? 'Scheduled Checkup' : 'Health Record'}
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {formatDate(record.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* â”€â”€ Body â”€â”€ */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Status + Type row */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={record.approvalStatus} isDarkMode={isDarkMode} />
            {isUrgent && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-700'}`}>
                <AlertCircle className="w-3 h-3" /> Urgent
              </span>
            )}
            {isScheduled && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                <CalendarCheck className="w-3 h-3" /> Scheduled
              </span>
            )}
          </div>

          {/* Summary message */}
          {record.message && (
            <div className={`p-3.5 rounded-xl ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {record.message}
              </p>
            </div>
          )}

          {/* Scheduled appointment info */}
          {record.scheduledDate && (
            <InfoRow
              icon={CalendarCheck}
              label={isScheduled ? 'Appointment Date & Time' : 'Requested Date & Time'}
              value={formatScheduled(record.scheduledDate, record.scheduledTime)}
              isDarkMode={isDarkMode}
            />
          )}

          {/* Recorded by */}
          <InfoRow
            icon={User}
            label="Recorded By"
            value={record.recordedBy || 'Self / AI Assistant'}
            isDarkMode={isDarkMode}
          />

          {/* Health assessment */}
          {record.healthAssessment?.vitalsSummary && (
            <InfoRow
              icon={Stethoscope}
              label="Vitals / Assessment Summary"
              value={record.healthAssessment.vitalsSummary}
              isDarkMode={isDarkMode}
            />
          )}

          {/* User-reported symptoms */}
          {userSymptoms && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className={`w-3.5 h-3.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Patient Reported Symptoms</p>
              </div>
              <div className={`p-3.5 rounded-xl text-sm leading-relaxed ${isDarkMode ? 'bg-gray-800/60 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
                {userSymptoms}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {analysisSection && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className={`w-3.5 h-3.5 ${isDarkMode ? 'text-green-500' : 'text-green-600'}`} />
                <p className={`text-xs font-medium ${isDarkMode ? 'text-green-500' : 'text-green-600'}`}>AI Health Analysis</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isDarkMode ? 'bg-green-900/30 text-green-500' : 'bg-green-100 text-green-700'}`}>Groq AI</span>
              </div>
              <div className={`p-3.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                isDarkMode
                  ? 'bg-green-950/30 border border-green-900/40 text-gray-200'
                  : 'bg-green-50 border border-green-200 text-gray-700'
              }`}>
                {analysisSection.trim()}
              </div>
            </div>
          )}

          {/* Fallback: raw notes if no split */}
          {!analysisSection && !userSymptoms && rawNotes && (
            <InfoRow
              icon={FileText}
              label="Notes"
              value={rawNotes}
              isDarkMode={isDarkMode}
            />
          )}
        </div>

        {/* â”€â”€ Footer â”€â”€ */}
        <div className={`p-4 border-t flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <button
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition ${
              isDarkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default HealthRecordModal

