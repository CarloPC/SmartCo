import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Megaphone, Plus, Loader2, RefreshCw, Users, Sparkles,
  ChevronRight, Calendar, Brain, X, ChevronDown, ChevronUp,
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import adminService from '../services/adminService'
import announcementsService from '../services/announcementsService'
import aiInsightsService, { MODULES } from '../services/aiInsightsService'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'

// Glass badge colors per AI priority level — kept in sync with the frosted
// aesthetic used across the rest of this page (no solid/opaque badges).
const PRIORITY_GLASS = {
  high:   { dot: 'bg-red-400',     ring: 'ring-red-400/30',     text: 'text-red-200' },
  medium: { dot: 'bg-amber-400',   ring: 'ring-amber-400/30',   text: 'text-amber-200' },
  low:    { dot: 'bg-emerald-400', ring: 'ring-emerald-400/30', text: 'text-emerald-200' },
}

const EventsPage = () => {
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isOfficial = adminService.isAdmin(user)

  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // ── Real AI insight state (Groq-backed via aiInsightsService) ──
  const [aiInsights, setAiInsights] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiExpanded, setAiExpanded] = useState(false)
  const [aiDismissed, setAiDismissed] = useState(false)

  /* glass card — same design language as HomePage/HealthPage/FoodAidPage */
  const card =
    'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all duration-300 hover:border-white/40 hover:shadow-blue-500/10'

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

  // Pull real, explainable AI recommendations for the Events module and
  // surface the top one right on this page — no more fake/simulated copy.
  const fetchAiInsights = useCallback(async () => {
    if (!isOfficial) return
    setAiLoading(true)
    try {
      const all = await aiInsightsService.generateAllInsights({ persistHistory: false })
      setAiInsights(all.filter(i => i.module === MODULES.EVENTS))
    } catch (err) {
      console.error('Events AI insight fetch failed:', err)
      setAiInsights([])
    } finally {
      setAiLoading(false)
    }
  }, [isOfficial])

  useEffect(() => { fetchAiInsights() }, [fetchAiInsights])

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

  const totalPosts = posts.length
  const totalComments = posts.reduce((s, p) => s + (p.commentCount || 0), 0)
  const topInsight = aiInsights[0]
  const priorityStyle = topInsight ? (PRIORITY_GLASS[topInsight.priority] || PRIORITY_GLASS.low) : null

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
          <div className={`absolute inset-0 ${isDarkMode
            ? 'bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-indigo-950/95'
            : 'bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-800/90'}`}
          />
        </div>
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className={`${card} px-8 py-10 text-center`}>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-white" />
            <p className="font-semibold text-white">Loading community posts...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Background — matches HomePage/HealthPage/FoodAidPage's hero shell */}
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${isDarkMode
          ? 'bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-indigo-950/95'
          : 'bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-800/90'}`}
        />
      </div>

      {/* Decorative blobs — matches HomePage/HealthPage/FoodAidPage's gradient shell */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      <div className="mx-auto max-w-7xl space-y-5 p-4 pb-24 sm:space-y-6 sm:p-6 lg:p-8">

        {/* ── Hero header banner ── */}
        <section className={`${card} overflow-hidden bg-gradient-to-r from-violet-500/30 via-purple-500/20 to-fuchsia-500/30`}>
          <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                AI-powered event scheduling
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Community Board
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base">
                Events &amp; announcements from your barangay, all in one feed.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => fetchPosts(true)}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh feed
                </button>
                {isOfficial && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition"
                  >
                    <Plus className="h-4 w-4" /> Announce
                  </button>
                )}
              </div>
            </div>

            {/* At-a-glance mini panel */}
            <div className="flex w-full max-w-xs flex-col gap-3 lg:w-auto">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Today at a glance</p>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Live
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/30 bg-gradient-to-br from-violet-500/25 to-purple-500/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-200">
                    <Megaphone className="h-3.5 w-3.5" /> Posts
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">{totalPosts}</p>
                </div>
                <div className="rounded-xl border border-white/30 bg-gradient-to-br from-blue-500/25 to-cyan-500/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-200">
                    <Users className="h-3.5 w-3.5" /> Comments
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">{totalComments}</p>
                </div>
              </div>
              <p className="text-center text-xs text-white/40">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Resident notice */}
          {!isOfficial && (
            <div className="mx-5 mb-5 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 sm:mx-7">
              <Users className="h-3.5 w-3.5 flex-shrink-0 text-white/70" />
              <p className="text-xs text-white/70">
                You can <strong>like</strong> and <strong>comment</strong> on posts from barangay officials.
              </p>
            </div>
          )}
        </section>

        {/* ── AI Event Scheduler — officials only ── */}
        {/* Now backed by the real aiInsightsService (deterministic analysis + Groq
            explanation), the same engine that powers the AI Decision Support
            dashboard — no more static/simulated copy. */}
        {isOfficial && !aiDismissed && (
          <section className={`${card} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <button
                onClick={() => navigate('/events/create')}
                className="group flex flex-1 items-center gap-3 text-left"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
                  {aiLoading
                    ? <Loader2 className="h-6 w-6 animate-spin text-white" />
                    : <Sparkles className="h-6 w-6 text-white" />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-white">AI Event Scheduler</span>
                    <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white/80">
                      <Calendar className="h-2.5 w-2.5" /> Smart planning
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-white/60">
                    Analyze weather, venue &amp; attendance with AI
                  </p>
                </div>
              </button>
              <div className="flex flex-shrink-0 items-center gap-1">
                {aiInsights.length > 0 && (
                  <button
                    onClick={() => setAiExpanded(e => !e)}
                    className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                    aria-label={aiExpanded ? 'Collapse AI insight' : 'Expand AI insight'}
                  >
                    {aiExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
                <button
                  onClick={() => navigate('/events/create')}
                  className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                  aria-label="Open AI Event Scheduler"
                >
                  <ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Real AI insight preview (Brain icon = deterministic analysis + Groq explanation) */}
            {aiLoading ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/50">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing upcoming events…
              </div>
            ) : topInsight ? (
              <div className={`mt-4 rounded-xl border border-white/15 bg-white/5 p-4 ring-1 ${priorityStyle.ring}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <Brain className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-300" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${priorityStyle.dot}`} />
                        <p className="text-sm font-semibold text-white">{topInsight.title}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${priorityStyle.text}`}>
                          {topInsight.priority} · {topInsight.confidence} confidence
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-white/70">{topInsight.summary}</p>
                      {aiExpanded && (
                        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                          <p className="text-xs text-white/60"><span className="font-semibold text-white/80">Why: </span>{topInsight.reason}</p>
                          <p className="text-xs text-white/60"><span className="font-semibold text-white/80">Suggested action: </span>{topInsight.suggestedAction}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setAiDismissed(true)}
                    className="flex-shrink-0 rounded-lg p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
                    aria-label="Dismiss AI insight"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {aiInsights.length > 1 && (
                  <p className="mt-2 pl-6 text-xs text-white/40">
                    +{aiInsights.length - 1} more event insight{aiInsights.length - 1 > 1 ? 's' : ''} in{' '}
                    <button onClick={() => navigate('/ai-insights')} className="underline hover:text-white/60">
                      AI Decision Support
                    </button>
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/50">
                No urgent scheduling issues detected right now — open the scheduler to plan your next event.
              </div>
            )}
          </section>
        )}

        {/* ── Feed ── */}
        <section className="mx-auto max-w-2xl space-y-4">
          {posts.length > 0 ? (
            <>
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
              <p className="text-center text-xs pb-2 text-white/40">
                You're all caught up 🎉
              </p>
            </>
          ) : (
            <div className={`${card} p-12 text-center`}>
              <Megaphone className="w-14 h-14 mx-auto mb-4 text-white/30" />
              <p className="font-semibold text-base mb-1 text-white">
                No posts yet
              </p>
              <p className="text-sm text-white/50">
                {isOfficial
                  ? 'Post an announcement or use the AI Event Scheduler to get started!'
                  : 'Barangay officials will post announcements and events here.'}
              </p>
              {isOfficial && (
                <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                    Post Announcement
                  </button>
                  <button
                    onClick={() => navigate('/events/create')}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Event Scheduler
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Create Announcement Modal — now glass-synced, see CreatePostModal.jsx */}
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