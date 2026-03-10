import { useState, useCallback } from 'react'
import {
  Heart, MessageCircle, Calendar, MapPin, Clock,
  CornerDownRight, Send, Loader2, Shield, Trash2, ChevronDown, ChevronUp
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import announcementsService from '../services/announcementsService'

// ─── Helpers ────────────────────────────────────────────────────────────────

const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatEventDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-PH', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}

const formatEventTime = (timeStr) => {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

const Avatar = ({ name, role, size = 'md' }) => {
  const initial = (name || '?')[0].toUpperCase()
  const bg =
    role === 'admin' ? 'bg-red-500' :
    role === 'barangay_official' ? 'bg-blue-600' :
    'bg-emerald-500'
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className={`${bg} ${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initial}
    </div>
  )
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

const RoleBadge = ({ role, isDarkMode }) => {
  if (role === 'admin') {
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
        isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'
      }`}>
        <Shield className="w-2.5 h-2.5" /> Admin
      </span>
    )
  }
  if (role === 'barangay_official') {
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
        isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'
      }`}>
        <Shield className="w-2.5 h-2.5" /> Official
      </span>
    )
  }
  return null
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

const CommentItem = ({ comment, postId, currentUser, isOfficial, isDarkMode, onReplyAdded }) => {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  const handleReply = async () => {
    if (!replyText.trim()) return
    setIsReplying(true)
    try {
      const reply = await announcementsService.replyToComment(
        postId, comment.id, replyText.trim(),
        currentUser?.fullName || 'Official', currentUser?.role
      )
      onReplyAdded(comment.id, reply)
      setReplyText('')
      setShowReplyInput(false)
    } catch (err) {
      console.error('Error replying:', err)
    } finally {
      setIsReplying(false)
    }
  }

  return (
    <div className="space-y-2">
      {/* Comment */}
      <div className="flex gap-2.5">
        <Avatar name={comment.authorName} role={comment.authorRole} size="sm" />
        <div className="flex-1 min-w-0">
          <div className={`px-3 py-2 rounded-2xl rounded-tl-sm text-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className={`font-semibold text-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {comment.authorName}
              </span>
              <RoleBadge role={comment.authorRole} isDarkMode={isDarkMode} />
            </div>
            <p className={`text-sm leading-snug ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {comment.content}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1 pl-1">
            <span className={`text-[11px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {timeAgo(comment.createdAt)}
            </span>
            {/* Reply button — only for officials */}
            {isOfficial && (
              <button
                onClick={() => setShowReplyInput(v => !v)}
                className={`text-[11px] font-semibold flex items-center gap-0.5 transition ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                <CornerDownRight className="w-3 h-3" />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Existing replies */}
      {comment.replies?.length > 0 && (
        <div className="ml-9 space-y-2">
          {comment.replies.map((reply, idx) => (
            <div key={idx} className="flex gap-2">
              <Avatar name={reply.authorName} role={reply.authorRole} size="sm" />
              <div className="flex-1 min-w-0">
                <div className={`px-3 py-2 rounded-2xl rounded-tl-sm text-sm ${
                  isDarkMode ? 'bg-blue-900/30 border border-blue-800/40' : 'bg-blue-50 border border-blue-100'
                }`}>
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className={`font-semibold text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                      {reply.authorName}
                    </span>
                    <RoleBadge role={reply.authorRole} isDarkMode={isDarkMode} />
                  </div>
                  <p className={`text-sm leading-snug ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {reply.content}
                  </p>
                </div>
                <span className={`text-[11px] pl-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {timeAgo(reply.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input (officials only) */}
      {isOfficial && showReplyInput && (
        <div className="ml-9 flex gap-2 items-center">
          <Avatar name={currentUser?.fullName} role={currentUser?.role} size="sm" />
          <div className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() } }}
              placeholder="Write a reply…"
              className={`flex-1 bg-transparent text-sm focus:outline-none ${
                isDarkMode ? 'text-gray-200 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
              }`}
            />
            <button
              onClick={handleReply}
              disabled={isReplying || !replyText.trim()}
              className={`disabled:opacity-40 transition ${
                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {isReplying
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────

const PostCard = ({ post, currentUser, isOfficial, onLikeToggle, onCommentAdded, onDeleted }) => {
  const { isDarkMode } = useTheme()
  const [isLiking, setIsLiking] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const currentUserId = currentUser?.id
  const isLiked = post.likes?.includes(currentUserId)
  const likeCount = post.likes?.length || 0

  const card = isDarkMode
    ? 'bg-gray-900/95 border-gray-700/50'
    : 'bg-white/95 border-white/30'

  // ── Load comments on first expand ──────────────────────────────────────────
  const handleToggleComments = useCallback(async () => {
    const willOpen = !showComments
    setShowComments(willOpen)
    if (willOpen && !commentsLoaded) {
      setIsLoadingComments(true)
      try {
        const data = await announcementsService.getComments(post.id)
        setComments(data)
        setCommentsLoaded(true)
      } catch (err) {
        console.error('Error loading comments:', err)
      } finally {
        setIsLoadingComments(false)
      }
    }
  }, [showComments, commentsLoaded, post.id])

  // ── Like toggle ───────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)
    try {
      const { newLikes } = await announcementsService.toggleLike(post.id)
      onLikeToggle(post.id, newLikes)
    } catch (err) {
      console.error('Error toggling like:', err)
    } finally {
      setIsLiking(false)
    }
  }

  // ── Add comment ───────────────────────────────────────────────────────────
  const handleComment = async () => {
    if (!commentText.trim()) return
    setIsCommenting(true)
    try {
      const newComment = await announcementsService.addComment(
        post.id, commentText.trim(),
        currentUser?.fullName || 'Resident', currentUser?.role
      )
      setComments(prev => [...prev, newComment])
      setCommentText('')
      onCommentAdded(post.id)
    } catch (err) {
      console.error('Error adding comment:', err)
    } finally {
      setIsCommenting(false)
    }
  }

  // ── Reply added ───────────────────────────────────────────────────────────
  const handleReplyAdded = (commentId, reply) => {
    setComments(prev =>
      prev.map(c =>
        c.id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c
      )
    )
  }

  // ── Delete post ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return
    setIsDeleting(true)
    try {
      await announcementsService.deletePost(post.id)
      onDeleted(post.id)
    } catch (err) {
      console.error('Error deleting post:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const typeBadge =
    post.type === 'event'
      ? isDarkMode
        ? 'bg-purple-900/50 text-purple-300 border-purple-700/50'
        : 'bg-purple-100 text-purple-700 border-purple-200'
      : isDarkMode
        ? 'bg-amber-900/50 text-amber-300 border-amber-700/50'
        : 'bg-amber-100 text-amber-700 border-amber-200'

  return (
    <div className={`${card} backdrop-blur-lg rounded-2xl shadow-xl border overflow-hidden`}>
      {/* ── Post Header ──────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar name={post.authorName} role={post.authorRole} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-semibold text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {post.authorName}
                </span>
                <RoleBadge role={post.authorRole} isDarkMode={isDarkMode} />
              </div>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {timeAgo(post.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Post type badge */}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${typeBadge}`}>
              {post.type === 'event' ? '📅 Event' : '📢 Announcement'}
            </span>
            {/* Delete — only author or admin */}
            {(currentUserId === post.authorId || isOfficial) && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`p-1 rounded-lg transition disabled:opacity-40 ${
                  isDarkMode ? 'text-gray-600 hover:text-red-400 hover:bg-red-900/20' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Post Body ────────────────────────────────────────────────────── */}
      <div className="px-5 pt-3 pb-0">
        <h3 className={`font-bold text-base mb-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          {post.title}
        </h3>
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {post.content}
        </p>

        {/* Event info pills */}
        {post.type === 'event' && (
          <div className={`mt-3 p-3 rounded-xl space-y-1.5 ${isDarkMode ? 'bg-purple-950/40 border border-purple-800/40' : 'bg-purple-50 border border-purple-100'}`}>
            {post.eventDate && (
              <div className="flex items-center gap-2">
                <Calendar className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`text-xs font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                  {formatEventDate(post.eventDate)}
                  {post.eventTime && ` · ${formatEventTime(post.eventTime)}`}
                </span>
              </div>
            )}
            {post.eventVenue && (
              <div className="flex items-center gap-2">
                <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`text-xs font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                  {post.eventVenue}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Divider + Action Bar ─────────────────────────────────────────── */}
      <div className={`mx-5 mt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`} />
      <div className="px-5 py-2 flex items-center gap-1">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition disabled:opacity-60 ${
            isLiked
              ? isDarkMode
                ? 'text-red-400 bg-red-900/20 hover:bg-red-900/30'
                : 'text-red-600 bg-red-50 hover:bg-red-100'
              : isDarkMode
                ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          <Heart className={`w-4 h-4 transition-all ${isLiked ? 'fill-current scale-110' : ''}`} />
          <span>{likeCount > 0 ? likeCount : ''} Like</span>
        </button>

        {/* Comment */}
        <button
          onClick={handleToggleComments}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
            showComments
              ? isDarkMode
                ? 'text-blue-400 bg-blue-900/20'
                : 'text-blue-600 bg-blue-50'
              : isDarkMode
                ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentCount > 0 ? post.commentCount : ''} Comment</span>
          {showComments
            ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
            : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
          }
        </button>
      </div>

      {/* ── Comments Section ─────────────────────────────────────────────── */}
      {showComments && (
        <div className={`border-t ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50/50'}`}>
          <div className="px-5 py-4 space-y-4">
            {/* Loading */}
            {isLoadingComments && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className={`w-5 h-5 animate-spin ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
            )}

            {/* Comments list */}
            {!isLoadingComments && commentsLoaded && comments.length === 0 && (
              <p className={`text-center text-xs py-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                No comments yet. Be the first to comment!
              </p>
            )}

            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={post.id}
                currentUser={currentUser}
                isOfficial={isOfficial}
                isDarkMode={isDarkMode}
                onReplyAdded={handleReplyAdded}
              />
            ))}

            {/* Add comment input */}
            <div className="flex gap-2.5 items-center pt-1">
              <Avatar name={currentUser?.fullName} role={currentUser?.role} size="sm" />
              <div className={`flex-1 flex items-center gap-2 px-3.5 py-2 rounded-full border transition ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 focus-within:border-purple-600'
                  : 'bg-white border-gray-200 focus-within:border-purple-400'
              }`}>
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
                  placeholder="Write a comment…"
                  className={`flex-1 bg-transparent text-sm focus:outline-none ${
                    isDarkMode ? 'text-gray-200 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
                  }`}
                />
                <button
                  onClick={handleComment}
                  disabled={isCommenting || !commentText.trim()}
                  className={`flex-shrink-0 transition disabled:opacity-40 ${
                    isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                  }`}
                >
                  {isCommenting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PostCard
