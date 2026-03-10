import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, Plus, Loader2, RefreshCw, Users, Sparkles, ChevronRight } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import adminService from '../services/adminService'
import announcementsService from '../services/announcementsService'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'

const EventsPage = () => {
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isOfficial = adminService.isAdmin(user)

  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const card = `${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border`

  const fetchPosts = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)
    try {
      const data = await announcementsService.getAllPosts()
      setPosts(data)
    } catch (err) {
      console.error('Error fetching posts:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev])
    setShowCreateModal(false)
  }

  const handleLikeToggle = (postId, newLikes) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikes } : p))
  }

  const handleCommentAdded = (postId) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
    ))
  }

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95'
            : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85'
        }`} />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-2xl mx-auto">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className={`${
          isDarkMode
            ? 'bg-gradient-to-r from-purple-900/90 to-violet-950/90 border-gray-700/50'
            : 'bg-gradient-to-r from-purple-500/90 to-purple-600/90 border-white/20'
        } backdrop-blur-sm rounded-2xl p-5 text-white shadow-xl border`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Community Board</h2>
                <p className="text-sm text-purple-100">Events &amp; Announcements</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchPosts(true)}
                disabled={isRefreshing}
                className="p-2 bg-white/15 hover:bg-white/25 rounded-xl transition disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Announcement post — officials only */}
              {isOfficial && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-sm font-semibold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Announce</span>
                </button>
              )}
            </div>
          </div>

          {/* Resident notice */}
          {!isOfficial && (
            <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <p className="text-xs text-purple-100">
                You can <strong>like</strong> and <strong>comment</strong> on posts from barangay officials.
              </p>
            </div>
          )}

          {/* AI Event Scheduler banner — officials only */}
          {isOfficial && (
            <button
              onClick={() => navigate('/events/create')}
              className={`mt-3 w-full flex items-center justify-between px-4 py-3 rounded-xl border transition group ${
                isDarkMode
                  ? 'bg-gradient-to-r from-violet-900/60 to-purple-900/60 border-violet-700/60 hover:from-violet-800/70 hover:to-purple-800/70'
                  : 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-white/30 hover:from-violet-500/30 hover:to-purple-500/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">AI Event Scheduler</p>
                  <p className="text-xs text-purple-200">
                    Analyze weather, venue &amp; attendance with AI
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white transition" />
            </button>
          )}
        </div>

        {/* ── Feed ────────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className={`${card} p-12 text-center`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading community posts…
            </p>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={user}
                isOfficial={isOfficial}
                onLikeToggle={handleLikeToggle}
                onCommentAdded={handleCommentAdded}
                onDeleted={handlePostDeleted}
              />
            ))}
            <p className={`text-center text-xs pb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              You're all caught up 🎉
            </p>
          </div>
        ) : (
          <div className={`${card} p-12 text-center`}>
            <Megaphone className={`w-14 h-14 mx-auto mb-4 ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}`} />
            <p className={`font-semibold text-base mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              No posts yet
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {isOfficial
                ? 'Post an announcement or use the AI Event Scheduler to get started!'
                : 'Barangay officials will post announcements and events here.'}
            </p>
            {isOfficial && (
              <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition ${
                    isDarkMode ? 'bg-purple-700 hover:bg-purple-600' : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Post Announcement
                </button>
                <button
                  onClick={() => navigate('/events/create')}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition ${
                    isDarkMode
                      ? 'bg-violet-900/60 hover:bg-violet-800/70 text-violet-200 border border-violet-700'
                      : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Event Scheduler
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePostCreated}
          user={user}
        />
      )}
    </div>
  )
}

export default EventsPage
