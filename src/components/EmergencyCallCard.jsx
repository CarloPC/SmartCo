import { Phone, Stethoscope, Flame, ShieldAlert, Landmark } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import emergencyContacts, { toTelHref } from '../config/emergencyContacts'

// A resident-facing "tap to call" card for emergency services.
//
// IMPORTANT: this component NEVER calls anyone automatically. Every number
// is a plain `tel:` link — the user must tap/click it themselves, at which
// point the device's own native dialer opens. Nothing here can confirm a
// call actually connected, so no "Call Connected" style messaging is shown.
const SERVICE_ORDER = [
  { contact: emergencyContacts.medical,  icon: Stethoscope, labelKey: 'emergency.medical' },
  { contact: emergencyContacts.fire,     icon: Flame,       labelKey: 'emergency.fire' },
  { contact: emergencyContacts.police,   icon: ShieldAlert, labelKey: 'emergency.police' },
  { contact: emergencyContacts.barangay, icon: Landmark,    labelKey: 'emergency.barangayEmergency' },
]

const EmergencyCallCard = ({ compact = false }) => {
  const { isDarkMode } = useTheme()
  const { t } = useLanguage()

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${
        isDarkMode
          ? 'border-red-400/20 bg-red-950/30'
          : 'border-red-200 bg-red-50/80'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20">
          <Phone className={`h-4 w-4 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`} />
        </span>
        <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {t('emergency.services')}
        </h3>
      </div>

      {!compact && (
        <p className={`mb-3 text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
          {t('emergency.needImmediateAssistance')}
        </p>
      )}

      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'sm:grid-cols-2'}`}>
        {SERVICE_ORDER.map(({ contact, icon: Icon, labelKey }) => (
          <a
            key={contact.key}
            href={toTelHref(contact.number)}
            aria-label={`${t('emergency.call')} ${t(labelKey)}`}
            className={`group flex min-h-[48px] items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
              isDarkMode
                ? 'border-white/10 bg-white/5 text-white hover:border-red-400/40 hover:bg-red-500/15'
                : 'border-red-200 bg-white text-gray-800 hover:border-red-300 hover:bg-red-50'
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <Icon className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`} />
              <span className="truncate">{t(labelKey)}</span>
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold flex-shrink-0 ${
                isDarkMode ? 'bg-red-500/25 text-red-200' : 'bg-red-600 text-white'
              }`}
            >
              <Phone className="h-3 w-3" /> {t('emergency.call')}
            </span>
          </a>
        ))}
      </div>

      <p className={`mt-3 text-[11px] leading-4 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
        {t('emergency.callNotConnectedNotice')}
      </p>
    </div>
  )
}

export default EmergencyCallCard
