import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, HelpCircle, MessageCircle, Phone, Mail, FileText, ChevronRight } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'

const HelpSupportPage = () => {
  const navigate = useNavigate()
  const [expandedFaq, setExpandedFaq] = useState(null)

  const faqs = [
    {
      question: 'How do I report a medical emergency?',
      answer: 'Click the "Report Emergency" button on the homepage, fill in the details, and submit. Your location and contact information will be automatically included. Emergency responders will be notified immediately.'
    },
    {
      question: 'How do I check the food aid schedule for my purok?',
      answer: 'Go to the Food Aid section from the bottom navigation. You\'ll see the AI-optimized distribution schedule for all puroks. Find your purok to see the date and time of your food aid distribution.'
    },
    {
      question: 'Can I edit my profile information?',
      answer: 'Yes! Go to Profile > My Profile and click the "Edit Profile" button. You can update your name, email, phone number, purok, and address. Don\'t forget to save your changes.'
    },
    {
      question: 'How do I join community events?',
      answer: 'Navigate to the Events section and browse upcoming events. Click on any event to view details and click "View Details" to register or get more information about the event.'
    },
    {
      question: 'What should I do if I\'m not receiving notifications?',
      answer: 'Check your notification settings in Profile > Settings > Notification Settings. Make sure the notification types you want are enabled. Also check your device settings to ensure SmartCo has notification permissions.'
    }
  ]

  const contactOptions = [
    { icon: Phone, label: 'Call Us', value: '+63 32 461 1234', action: 'tel:+6332461234' },
    { icon: Mail, label: 'Email Us', value: 'support@smartco.ph', action: 'mailto:support@smartco.ph' },
    { icon: MessageCircle, label: 'Live Chat', value: 'Available 24/7', action: null }
  ]

  return (
    <div className="min-h-screen relative pb-20">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: `url(${toledoImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85"></div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Help & Support</h1>
          <div className="w-10" />
        </div>

        {/* Contact Options */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Contact Us</h3>
          <div className="space-y-3">
            {contactOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => option.action && (window.location.href = option.action)}
                className="w-full flex items-center space-x-4 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition"
              >
                <div className="p-3 bg-blue-500 rounded-lg">
                  <option.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-800">{option.label}</p>
                  <p className="text-sm text-gray-600">{option.value}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Frequently Asked Questions</h3>
          </div>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left"
                >
                  <p className="font-medium text-gray-800 pr-4">{faq.question}</p>
                  <ChevronRight 
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      expandedFaq === index ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Links</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition text-left">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <p className="font-medium text-gray-800">User Guide</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition text-left">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <p className="font-medium text-gray-800">Tutorial Videos</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition text-left">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <p className="font-medium text-gray-800">Community Forum</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition text-left">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <p className="font-medium text-gray-800">Report a Bug</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Send Us Feedback</h3>
          <p className="text-sm text-gray-600 mb-4">
            Help us improve SmartCo by sharing your thoughts and suggestions.
          </p>
          <textarea
            placeholder="Type your feedback here..."
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
          />
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition shadow-lg">
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  )
}

export default HelpSupportPage
