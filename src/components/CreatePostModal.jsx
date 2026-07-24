import { useState } from 'react'
import { X, Megaphone, Send, Loader2, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import announcementsService from '../services/announcementsService'

// Glass modal — synced with EventsPage/HomePage's frosted design language.
// Unlike the old version, this no longer switches between a fully solid
// gray-900 (dark) / white (light) panel; it stays translucent in both modes
// since it always sits on top of the same colorful hero background.
const CreatePostModal = ({ onClose, onCreated, user }) => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const input =
    'w-full px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50 transition'

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-lg text-white">New Announcement</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* AI Event Scheduler nudge */}
          <button
            type="button"
            onClick={goToAI}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 bg-gradient-to-br from-violet-500/25 to-fuchsia-500/10 text-left backdrop-blur-sm transition hover:from-violet-500/35 hover:to-fuchsia-500/20 group"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/15">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-violet-100">
                Creating an Event instead?
              </p>
              <p className="text-xs truncate text-violet-200/70">
                Use the AI Event Scheduler — analyzes weather, venue &amp; attendance
              </p>
            </div>
            <span className="text-xs font-semibold flex-shrink-0 text-violet-100 transition group-hover:translate-x-0.5">
              Open →
            </span>
          </button>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-white/70">
              Title <span className="text-red-300">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Road closure notice, Community clean-up drive…"
              className={input}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-white/70">
              Message <span className="text-red-300">*</span>
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your announcement here. Residents will see this in the Community Board…"
              className={`${input} resize-none`}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm px-3 py-2 rounded-lg border border-red-400/30 bg-red-500/10 text-red-200">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-sm border border-white/20 bg-white/10 text-white/80 backdrop-blur-sm transition hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg transition hover:from-blue-600 hover:to-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
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