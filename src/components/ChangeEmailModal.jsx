import { useState } from 'react'
import { Mail, Lock, X, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import authService from '../services/authService'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/*
  ChangeEmailModal — Step 9 (Account Recovery & Email Change).

  Flow: enter + confirm new email -> re-authenticate with current password
  (Firebase requires a "recent login" for this sensitive operation) ->
  authService.changeEmail() calls verifyBeforeUpdateEmail(), which sends a
  verification link to the NEW address instead of switching over instantly.

  IMPORTANT: this modal never claims the email has "changed" — Firebase
  Authentication doesn't actually update auth.currentUser.email (and
  authService's login()/getCurrentUser() sync doesn't touch the Firestore
  profile) until the user opens that link. The final "sent" screen makes
  that explicit instead of showing a false success state.

  Styled to match MyProfilePage's own fixed dark-glass card design (that
  page doesn't consume ThemeContext — see its own comments — so this modal
  follows the same convention rather than a separate light/dark toggle).
*/
const ChangeEmailModal = ({ isOpen, onClose, currentEmail }) => {
  const { t } = useLanguage()

  const [step, setStep] = useState('form') // 'form' | 'reauth' | 'sent'
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const resetAndClose = () => {
    setStep('form')
    setNewEmail('')
    setConfirmEmail('')
    setPassword('')
    setShowPassword(false)
    setError('')
    setSubmitting(false)
    onClose()
  }

  const card =
    'rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 shadow-2xl ring-1 ring-white/10'
  const inputClasses =
    'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400'

  const handleContinue = (e) => {
    e.preventDefault()
    setError('')

    const trimmedNew = newEmail.trim()
    const trimmedConfirm = confirmEmail.trim()

    if (!trimmedNew) {
      setError(t('changeEmail.errorEmptyEmail', 'Please enter a new email address.'))
      return
    }
    if (!EMAIL_REGEX.test(trimmedNew)) {
      setError(t('changeEmail.errorInvalidEmail', 'Please enter a valid email address.'))
      return
    }
    if (trimmedNew !== trimmedConfirm) {
      setError(t('changeEmail.errorEmailMismatch', 'The email addresses do not match.'))
      return
    }
    if (trimmedNew.toLowerCase() === (currentEmail || '').toLowerCase()) {
      setError(t('changeEmail.errorSameEmail', 'This is already your current email address.'))
      return
    }

    setNewEmail(trimmedNew)
    setStep('reauth')
  }

  const handleConfirm = async (e) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError(t('changeEmail.errorEmptyPassword', 'Please enter your password.'))
      return
    }

    try {
      setSubmitting(true)
      await authService.changeEmail(password, newEmail)
      setStep('sent')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-email-modal-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={step === 'sent' ? resetAndClose : undefined} />

      <div className={`${card} relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden`}>
        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-white/10 p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
              {step === 'sent' ? (
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-300" />
              ) : step === 'reauth' ? (
                <ShieldCheck className="h-4.5 w-4.5 text-blue-300" />
              ) : (
                <Mail className="h-4.5 w-4.5 text-blue-300" />
              )}
            </div>
            <h3 id="change-email-modal-title" className="truncate text-base font-bold text-white">
              {step === 'sent'
                ? t('changeEmail.sentTitle', 'Verification Email Sent')
                : step === 'reauth'
                ? t('changeEmail.reauthTitle', 'Confirm Your Password')
                : t('changeEmail.modalTitle', 'Change Email Address')}
            </h3>
          </div>
          {step !== 'sent' && (
            <button
              type="button"
              onClick={resetAndClose}
              aria-label={t('changeEmail.cancelButton', 'Cancel')}
              className="flex-shrink-0 rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3.5 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleContinue} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  {t('changeEmail.currentEmailLabel', 'Current Email')}
                </label>
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white/60">
                  {currentEmail}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  {t('changeEmail.newEmailLabel', 'New Email')}
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t('changeEmail.newEmailPlaceholder', 'Enter your new email address')}
                  className={inputClasses}
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  {t('changeEmail.confirmEmailLabel', 'Confirm New Email')}
                </label>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={t('changeEmail.confirmEmailPlaceholder', 'Re-enter your new email address')}
                  className={inputClasses}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="flex-1 rounded-xl border border-white/20 bg-white/10 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  {t('changeEmail.cancelButton', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700"
                >
                  {t('changeEmail.continueButton', 'Continue')}
                </button>
              </div>
            </form>
          )}

          {step === 'reauth' && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <p className="text-sm leading-relaxed text-white/60">
                {t('changeEmail.reauthSubtitle', 'For your security, please enter your current password to continue changing your email.')}
              </p>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  {t('changeEmail.currentPasswordLabel', 'Current Password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('changeEmail.currentPasswordPlaceholder', 'Enter your current password')}
                    className={`${inputClasses} pl-10 pr-11`}
                    autoFocus
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setStep('form'); setError('') }}
                  disabled={submitting}
                  className="flex-1 rounded-xl border border-white/20 bg-white/10 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-60"
                >
                  {t('changeEmail.backButton', 'Back')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t('changeEmail.confirmButton', 'Confirm')}</span>
                    </>
                  ) : (
                    t('changeEmail.confirmButton', 'Confirm')
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'sent' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <span>{t('changeEmail.sentMessage', 'We sent a verification link to your new email address. Please check your inbox (and spam folder), then click the link to complete the change.')}</span>
              </div>

              <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-medium text-white">
                {newEmail}
              </p>

              <p className="text-xs leading-relaxed text-white/40">
                {t('changeEmail.notYetChangedNotice', 'Your email has not changed yet — it will update once you verify the new address.')}
              </p>

              <button
                type="button"
                onClick={resetAndClose}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700"
              >
                {t('changeEmail.doneButton', 'Done')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChangeEmailModal
