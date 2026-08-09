import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Bot, Send, X, Loader2, CalendarCheck, RotateCcw,
  Heart, Sparkles, ChevronDown, Mic, User
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { sendHealthMessage, buildConversationSummary } from '../services/aiHealthService'
import ScheduleCheckupModal from './ScheduleCheckupModal'

/* ─── Typing indicator ───────────────────────────────────────────────────── */
const TypingDots = ({ isDarkMode }) => (
  <div className="flex items-center gap-1 px-1 py-1">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`}
        style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
      />
    ))}
  </div>
)

/* ─── Single message bubble ──────────────────────────────────────────────── */
const ChatBubble = ({ msg, isDarkMode }) => {
  const isUser = msg.role === 'user'
  const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 items-end">
        <div className="max-w-[80%]">
          <div className={`px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed ${
            isDarkMode
              ? 'bg-blue-700 text-white'
              : 'bg-blue-600 text-white'
          }`}>
            {msg.content}
          </div>
          <p className={`text-right text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{time}</p>
        </div>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-5 text-xs font-bold ${
          isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-700'
        }`}>
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start gap-2 items-end">
      {/* Bot avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-5 ${
        isDarkMode ? 'bg-green-900/60' : 'bg-green-100'
      }`}>
        <Heart className={`w-3.5 h-3.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
      </div>
      <div className="max-w-[80%]">
        <div className={`px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed whitespace-pre-wrap ${
          isDarkMode
            ? 'bg-gray-800 text-gray-100 border border-gray-700/50'
            : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
        }`}>
          {msg.content}
        </div>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{time}</p>
      </div>
    </div>
  )
}

/* ─── Quick reply chips ──────────────────────────────────────────────────── */
const QUICK_REPLIES = [
  "I have a headache",
  "I have a fever",
  "I'm feeling nauseous",
  "I have body pain",
  "I have a cough and colds",
  "I feel dizzy",
]

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CHAT COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const HealthAIChat = ({ onClose }) => {
  const { isDarkMode } = useTheme()
  const { user } = useAuth()

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}! 👋 I'm HealthBot, your AI health assistant.\n\nHow are you feeling today? Tell me what's bothering you and I'll do my best to help.`,
      timestamp: new Date()
    }
  ])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleModal, setScheduleModal] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const chatBodyRef = useRef(null)

  // Auto-scroll the chat container (not the whole page) on new messages
  useEffect(() => {
    const el = chatBodyRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = useCallback(async (text) => {
    const userText = text.trim()
    if (!userText || loading) return

    setInput('')
    setError('')
    setShowQuickReplies(false)

    const userMsg = { role: 'user', content: userText, timestamp: new Date() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const { text: aiText, suggestCheckup } = await sendHealthMessage(
        updatedMessages.map(m => ({ role: m.role, content: m.content })),
        { name: user?.fullName, purok: user?.purok }
      )

      setMessages(prev => [...prev, { role: 'assistant', content: aiText, timestamp: new Date() }])
      if (suggestCheckup) setShowSchedule(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [messages, loading, user])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleReset = () => {
    setMessages([{
      role: 'assistant',
      content: `Hello${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}! 👋 I'm HealthBot, your AI health assistant.\n\nHow are you feeling today? Tell me what's bothering you and I'll do my best to help.`,
      timestamp: new Date()
    }])
    setShowSchedule(false)
    setShowQuickReplies(true)
    setError('')
    setInput('')
  }

  const symptomsForSchedule = buildConversationSummary(messages)

  const card  = isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'

  return (
    <>
      <div className={`${card} backdrop-blur-lg rounded-2xl border shadow-2xl flex flex-col`}
        style={{ height: 'min(620px, 75vh)' }}>

        {/* ── Header ── */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode ? 'border-gray-700/60' : 'border-gray-100'
        } flex-shrink-0`}>
          <div className="flex items-center gap-2.5">
            <div className={`relative w-9 h-9 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-green-900/60' : 'bg-green-100'
            }`}>
              <Heart className={`w-4.5 h-4.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`font-semibold text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>HealthBot</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                  isDarkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700'
                }`}>
                  <Sparkles className="w-2.5 h-2.5" /> Groq AI
                </span>
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Online · Health Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleReset}
              title="New conversation"
              className={`p-1.5 rounded-lg transition ${isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition ${isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Messages ── */}
        <div
          ref={chatBodyRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth"
        >
          {messages.map((msg, i) => (
            <ChatBubble key={i} msg={msg} isDarkMode={isDarkMode} />
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start gap-2 items-end">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-green-900/60' : 'bg-green-100'}`}>
                <Heart className={`w-3.5 h-3.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div className={`px-4 py-2.5 rounded-2xl rounded-bl-sm ${isDarkMode ? 'bg-gray-800 border border-gray-700/50' : 'bg-white border border-gray-200 shadow-sm'}`}>
                <TypingDots isDarkMode={isDarkMode} />
              </div>
            </div>
          )}

          {/* Schedule checkup CTA */}
          {showSchedule && !loading && (
            <div className={`flex flex-col items-center gap-2 py-2`}>
              <p className={`text-xs font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                ⚕️ HealthBot recommends a checkup at Barangay Ilihan Health Center
              </p>
              <button
                onClick={() => setScheduleModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
              >
                <CalendarCheck className="w-4 h-4" />
                Schedule Barangay Ilihan Health Checkup
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={`text-xs p-3 rounded-xl text-center ${isDarkMode ? 'bg-red-900/20 text-red-300 border border-red-800/40' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {error}
              <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Quick replies ── */}
        {showQuickReplies && messages.length === 1 && (
          <div className={`px-4 pb-2 flex-shrink-0 border-t ${isDarkMode ? 'border-gray-700/60' : 'border-gray-100'}`}>
            <p className={`text-xs font-medium mt-2 mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Quick starts:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map(qr => (
                <button
                  key={qr}
                  onClick={() => sendMessage(qr)}
                  disabled={loading}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${
                    isDarkMode
                      ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Composer ── */}
        <div className={`flex items-end gap-2 px-4 py-3 border-t flex-shrink-0 ${
          isDarkMode ? 'border-gray-700/60' : 'border-gray-100'
        }`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Describe your symptoms or ask a health question…"
            disabled={loading}
            className={`flex-1 resize-none px-4 py-2.5 rounded-xl border text-sm ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-blue-500'
            } focus:outline-none focus:ring-2 focus:border-transparent transition max-h-28 overflow-y-auto disabled:opacity-60`}
            style={{ lineHeight: '1.5' }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px'
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center hover:from-blue-700 hover:to-indigo-700 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Footer disclaimer */}
        <p className={`text-center text-xs px-4 pb-2.5 flex-shrink-0 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          HealthBot is an AI assistant — not a licensed doctor. For emergencies call <strong>911</strong>.
        </p>
      </div>

      {/* Schedule Modal */}
      <ScheduleCheckupModal
        isOpen={scheduleModal}
        onClose={() => setScheduleModal(false)}
        symptomsSummary={symptomsForSchedule}
        conversation={messages}
        aiAnalysisUsed={true}
      />

      {/* Bounce keyframes */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  )
}

export default HealthAIChat
