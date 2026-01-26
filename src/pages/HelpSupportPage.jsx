import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, HelpCircle, MessageCircle, Phone, Mail, FileText, ChevronRight } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'

const HelpSupportPage = () => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
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
        <div className={`absolute inset-0 bg-gradient-to-br ${isDarkMode ? 'from-gray-950/90 via-slate-900/90 to-gray-900/90' : 'from-blue-900/85 via-blue-800/85 to-indigo-900/85'}`}></div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 backdrop-blur-sm rounded-lg transition ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white/20 hover:bg-white/30'}`}
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Help & Support</h1>
          <div className="w-10" />
        </div>

        {/* Contact Options */}
        <div className={`backdrop-blur-lg rounded-xl shadow-xl p-4 ${isDarkMode ? 'bg-gray-800/95 border border-gray-700/50' : 'bg-white/95 border border-white/30'}`}>
          <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Contact Us</h3>
          <div className="space-y-3">
            {contactOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => option.action && (window.location.href = option.action)}
                className={`w-full flex items-center space-x-4 p-4 rounded-xl transition ${isDarkMode ? 'bg-blue-900/30 hover:bg-blue-900/50' : 'bg-blue-50 hover:bg-blue-100'}`}
              >
                <div className="p-3 bg-blue-500 rounded-lg">
                  <option.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{option.label}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{option.value}</p>
                </div>
                <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className={`backdrop-blur-lg rounded-xl shadow-xl p-4 ${isDarkMode ? 'bg-gray-800/95 border border-gray-700/50' : 'bg-white/95 border border-white/30'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <HelpCircle className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Frequently Asked Questions</h3>
          </div>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className={`w-full flex items-center justify-between p-4 transition text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                >
                  <p className={`font-medium pr-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{faq.question}</p>
                  <ChevronRight 
                    className={`w-5 h-5 flex-shrink-0 transition-transform ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} ${
                      expandedFaq === index ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className={`px-4 pb-4 text-sm border-t pt-4 ${isDarkMode ? 'text-gray-400 border-gray-700' : 'text-gray-600 border-gray-100'}`}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className={`backdrop-blur-lg rounded-xl shadow-xl p-4 ${isDarkMode ? 'bg-gray-800/95 border border-gray-700/50' : 'bg-white/95 border border-white/30'}`}>
          <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Quick Links</h3>
          <div className="space-y-2">
            <button className={`w-full flex items-center justify-between p-3 rounded-lg transition text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center space-x-3">
                <FileText className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>User Guide</p>
              </div>
              <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </button>
            
            <button className={`w-full flex items-center justify-between p-3 rounded-lg transition text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center space-x-3">
                <FileText className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Tutorial Videos</p>
              </div>
              <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </button>
            
            <button className={`w-full flex items-center justify-between p-3 rounded-lg transition text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center space-x-3">
                <MessageCircle className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Community Forum</p>
              </div>
              <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </button>
            
            <button className={`w-full flex items-center justify-between p-3 rounded-lg transition text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center space-x-3">
                <FileText className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Report a Bug</p>
              </div>
              <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>

        {/* Feedback */}
        <div className={`backdrop-blur-lg rounded-xl shadow-xl p-4 ${isDarkMode ? 'bg-gray-800/95 border border-gray-700/50' : 'bg-white/95 border border-white/30'}`}>
          <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Send Us Feedback</h3>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Help us improve SmartCo by sharing your thoughts and suggestions.
          </p>
          <textarea
            placeholder="Type your feedback here..."
            rows="4"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
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
