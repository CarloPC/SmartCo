import { useState } from 'react'
import { X, Megaphone, Send, Loader2, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import announcementsService from '../services/announcementsService'

const CreatePostModal = ({ onClose, onCreated, user }) => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const overlay = isDarkMode ? 'bg-gray-950/80' : 'bg-black/60'
  const modal = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
  const label = isDarkMode ? 'text-gray-300' : 'text-gray-700'
  const input = isDarkMode
    ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-purple-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-purple-500'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Title is required.'); return }
    if (!content.trim()) { setError('Message is required.'); return }

    setIsSubmitting(true)
    try {
      const newPost = await announcementsService.createPost({
        title: title.trim(),
        content: content.trim(),
        type: 'announcement',
        authorName: user?.fullName || 'Official',
        authorRole: user?.role || 'barangay_official'
      })
      onCreated(newPost)
    } catch (err) {
      console.error('Error creating post:', err)
      setError('Failed to create post. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const goToAI = () => {
    onClose()
    navigate('/events/create')
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center ${overlay} backdrop-blur-sm`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`${modal} border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl`}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-inherit">
          <div className="flex items-center gap-2">
            <Megaphone className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <h3 className={`font-bold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              New Announcement
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* AI Event Scheduler nudge */}
          <button
            type="button"
            onClick={goToAI}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition group ${
              isDarkMode
                ? 'bg-violet-900/30 border-violet-700/60 hover:bg-violet-900/50'
                : 'bg-violet-50 border-violet-200 hover:bg-violet-100'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isDarkMode ? 'bg-violet-800/60' : 'bg-violet-200'
            }`}>
              <Sparkles className={`w-4 h-4 ${isDarkMode ? 'text-yellow-300' : 'text-violet-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-violet-300' : 'text-violet-700'}`}>
                Creating an Event instead?
              </p>
              <p className={`text-xs truncate ${isDarkMode ? 'text-violet-400' : 'text-violet-500'}`}>
                Use the AI Event Scheduler — analyzes weather, venue &amp; attendance
              </p>
            </div>
            <span className={`text-xs font-semibold flex-shrink-0 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}>
              Open →
            </span>
          </button>

          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${label}`}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Road closure notice, Community clean-up drive…"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${input}`}
            />
          </div>

          {/* Message */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${label}`}>
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your announcement here. Residents will see this in the Community Board…"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition resize-none ${input}`}
            />
          </div>

          {/* Error */}
          {error && (
            <p className={`text-sm px-3 py-2 rounded-lg ${isDarkMode ? 'bg-red-950/50 text-red-400' : 'bg-red-50 text-red-600'}`}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm border transition ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white transition flex items-center justify-center gap-2 disabled:opacity-60 ${
                isDarkMode ? 'bg-amber-700 hover:bg-amber-600' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Posting…</span></>
                : <><Send className="w-4 h-4" /><span>Publish</span></>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePostModal
