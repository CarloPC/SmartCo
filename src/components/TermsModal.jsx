import { useEffect } from 'react'
import { X, ShieldCheck } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

/*
  TermsModal — full Terms & Conditions + Privacy Notice content, shown from
  RegisterPage's "View Terms & Conditions" link.

  Styled to match RegisterPage's own fixed dark glassmorphism aesthetic
  (RegisterPage does not consume ThemeContext / light-mode — it always
  renders on the slate-900/blue-950 gradient), so this modal intentionally
  follows that same design rather than ThemeContext's isDarkMode toggle.
*/
const TermsModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage()

  // Close on Escape for keyboard accessibility
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sections = t('terms.sections', {})
  const sectionList = Object.values(sections || {})
  const privacy = t('terms.privacy', {})
  const privacyItems = Array.isArray(privacy?.items) ? privacy.items : []

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 shadow-2xl ring-1 ring-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4.5 h-4.5 text-blue-300" />
            </div>
            <div className="min-w-0">
              <h3 id="terms-modal-title" className="font-bold text-base text-white truncate">
                {t('terms.modalTitle', 'Terms & Conditions and Privacy Notice')}
              </h3>
              <p className="text-xs text-white/40">{t('terms.versionLabel', 'Version 1.0')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('terms.closeButton', 'Close')}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <p className="text-sm text-white/70 leading-relaxed">
            {t('terms.intro', 'Please read the following before creating a SmartCo account for Barangay Ilihan.')}
          </p>

          <div className="space-y-4">
            {sectionList.map((section, idx) => (
              <div key={idx}>
                <h4 className="text-sm font-semibold text-white mb-1">{section.title}</h4>
                <p className="text-sm text-white/60 leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10">
            <h4 className="text-sm font-bold text-white mb-2">{privacy?.title || 'Privacy Notice'}</h4>
            <p className="text-sm text-white/60 leading-relaxed mb-2">{privacy?.intro}</p>
            {privacyItems.length > 0 && (
              <ul className="list-disc list-inside space-y-1 mb-3">
                {privacyItems.map((item, idx) => (
                  <li key={idx} className="text-sm text-white/60 leading-relaxed">{item}</li>
                ))}
              </ul>
            )}
            <p className="text-sm text-white/60 leading-relaxed mb-2">{privacy?.healthPrivacy}</p>
            <p className="text-sm text-white/60 leading-relaxed mb-2">{privacy?.emergencyDisclaimer}</p>
            <p className="text-xs text-white/35 leading-relaxed italic">{privacy?.note}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/15 transition"
          >
            {t('terms.closeButton', 'Close')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TermsModal
