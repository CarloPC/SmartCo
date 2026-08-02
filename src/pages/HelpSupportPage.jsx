import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, HelpCircle, MessageCircle, Phone, Mail, FileText, ChevronRight, Send } from 'lucide-react'

const HelpSupportPage = () => {
  const navigate = useNavigate()
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [feedback, setFeedback] = useState('')

  const faqs = [
    {
      question: 'How do I report a medical emergency?',
      answer: 'Click the "Report Emergency" button on the homepage, fill in the details, and submit. Your location and contact information will be automatically included. Emergency responders will be notified immediately.',
    },
    {
      question: 'How do I check the community assistance schedule for my purok?',
      answer: 'Go to the Community Assistance section from the bottom navigation. You\'ll see the AI-optimized distribution schedule for all puroks. Find your purok to see the date and time of your assistance.',
    },
    {
      question: 'Can I edit my profile information?',
      answer: 'Yes! Go to Profile > My Profile and click the "Edit Profile" button. You can update your name, email, phone number, purok, and address. Don\'t forget to save your changes.',
    },
    {
      question: 'How do I join community events?',
      answer: 'Navigate to the Events section and browse upcoming events. Click on any event to view details and click "View Details" to register or get more information about the event.',
    },
    {
      question: 'What should I do if I\'m not receiving notifications?',
      answer: 'Check your notification settings in Profile > Settings > Notification Settings. Make sure the notification types you want are enabled. Also check your device settings to ensure SmartCo has notification permissions.',
    },
  ]

  const contactOptions = [
    { icon: Phone, label: 'Call Us', value: '+63 32 461 1234', action: 'tel:+6332461234' },
    { icon: Mail, label: 'Email Us', value: 'support@smartco.ph', action: 'mailto:support@smartco.ph' },
    { icon: MessageCircle, label: 'Live Chat', value: 'Available 24/7', action: null },
  ]

  const quickLinks = [
    { icon: FileText, label: 'User Guide' },
    { icon: FileText, label: 'Tutorial Videos' },
    { icon: MessageCircle, label: 'Community Forum' },
    { icon: FileText, label: 'Report a Bug' },
  ]

  /* glass card — matches HomePage panels */
  const card =
    'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10'

  const sectionHeader = (Icon, eyebrow, title) => (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
        <Icon className="h-4 w-4 text-blue-200" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-white/50">{eyebrow}</p>
        <p className="text-base font-semibold text-white">{title}</p>
      </div>
    </div>
  )

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) return
    alert('Thanks for your feedback!')
    setFeedback('')
  }

  return (
    /* No background here — Layout.jsx paints the gradient behind everything */
    <div className="mx-auto max-w-2xl space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-white/20 bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Help & Support</h1>
        <div className="w-10" />
      </div>

      {/* Contact Options */}
      <div className={`${card} p-5`}>
        {sectionHeader(Phone, 'Reach out', 'Contact Us')}
        <div className="space-y-3">
          {contactOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => option.action && (window.location.href = option.action)}
              className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <option.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{option.label}</p>
                <p className="text-sm text-white/60">{option.value}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/40" />
            </button>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className={`${card} p-5`}>
        {sectionHeader(HelpCircle, 'Common questions', 'Frequently Asked Questions')}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/5"
              >
                <p className="pr-4 font-medium text-white">{faq.question}</p>
                <ChevronRight
                  className={`h-5 w-5 flex-shrink-0 text-white/40 transition-transform ${
                    expandedFaq === index ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {expandedFaq === index && (
                <div className="border-t border-white/10 px-4 pb-4 pt-4 text-sm text-white/60">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className={`${card} p-5`}>
        {sectionHeader(FileText, 'Learn more', 'Quick Links')}
        <div className="space-y-2">
          {quickLinks.map((link) => (
            <button
              key={link.label}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <link.icon className="h-5 w-5 text-blue-300" />
                <p className="font-medium text-white">{link.label}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/40" />
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div className={`${card} p-5`}>
        {sectionHeader(MessageCircle, 'Help us improve', 'Send Us Feedback')}
        <p className="mb-4 text-sm text-white/60">
          Help us improve SmartCo by sharing your thoughts and suggestions.
        </p>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Type your feedback here..."
          rows="4"
          className="mb-3 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleSubmitFeedback}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700"
        >
          <Send className="h-5 w-5" />
          <span>Submit Feedback</span>
        </button>
      </div>
    </div>
  )
}

export default HelpSupportPage