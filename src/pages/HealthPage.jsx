import { useState, useEffect } from 'react'
import {
  AlertCircle, Activity, Loader2, RefreshCw,
  CheckCircle, Clock, XCircle, Sparkles, ChevronDown, ChevronUp, Heart, Eye
} from 'lucide-react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import healthService from '../services/healthService'
import HealthAIChat from '../components/HealthAIChat'
import HealthRecordModal from '../components/HealthRecordModal'
import { db, auth } from '../config/firebase'

const HealthPage = () => {
  const { isDarkMode } = useTheme()

  const [healthStats, setHealthStats]   = useState({ total: 0, today: 0, thisWeek: 0, emergencies: 0 })
  const [healthAlerts, setHealthAlerts] = useState([])
  const [isLoading, setIsLoading]       = useState(true)
  const [refreshing, setRefreshing]     = useState(false)
  const [chatOpen, setChatOpen]         = useState(false)
  const [viewRecord, setViewRecord]     = useState(null)
  const [viewLoading, setViewLoading]   = useState(null) // holds the id being loaded

  const fetchHealthData = async () => {
    try {
      setIsLoading(true)
      const [stats, alerts] = await Promise.all([
        healthService.getHealthStats(),
        healthService.getRecentHealthAlerts(5)
      ])
      setHealthStats(stats)
      setHealthAlerts(alerts.map(a => ({ ...a, time: getTimeAgo(a.createdAt) })))
    } catch (error) {
      console.error('Error fetching health data:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => { setRefreshing(true); fetchHealthData() }

  const handleViewRecord = async (alert) => {
    setViewLoading(alert.id)
    try {
      const record = await healthService.getHealthRecordById(alert.id)
      setViewRecord(record)
    } catch (err) {
      console.error('Error fetching record:', err)
    } finally {
      setViewLoading(null)
    }
  }

  useEffect(() => { fetchHealthData() }, [])

  useEffect(() => {
    const userId = auth.currentUser?.uid
    if (!userId) return

    const q = query(
      collection(db, 'healthRecords'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      const today = new Date(); today.setHours(0, 0, 0, 0)
      const thisWeek = new Date(); thisWeek.setDate(thisWeek.getDate() - 7)

      const todayRecords = records.filter(record => {
        const recordDate = new Date(record.createdAt)
        recordDate.setHours(0, 0, 0, 0)
        return recordDate.getTime() === today.getTime()
      })

      const weekRecords = records.filter(record => new Date(record.createdAt) >= thisWeek)
      const emergencies = records.filter(record =>
        record.healthAssessment?.overallStatus === 'critical' || record.healthAssessment?.urgencyLevel === 'urgent'
      ).length

      const alerts = records.slice(0, 5).map(record => {
        const assessment = record.healthAssessment
        let type = 'Checkup'
        let urgent = false
        if (assessment?.overallStatus === 'critical') {
          type = 'Emergency'
          urgent = true
        } else if (assessment?.overallStatus === 'concerning') {
          type = 'Alert'
        }
        return {
          id: record.id,
          type,
          message: assessment?.vitalsSummary || 'Health checkup completed',
          createdAt: record.createdAt,
          urgent,
          recordedBy: record.recordedBy || 'Health Worker',
          approvalStatus: record.approvalStatus || 'approved',
          time: getTimeAgo(record.createdAt),
        }
      })
      setHealthAlerts(alerts)
      setHealthStats({
        total: records.length,
        today: todayRecords.length,
        thisWeek: weekRecords.length,
        emergencies,
      })
    })

    return () => unsubscribe()
  }, [])

  const getTimeAgo = (timestamp) => {
    const diff = Math.floor((new Date() - new Date(timestamp)) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} min${Math.floor(diff / 60) > 1 ? 's' : ''} ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`
  }

  /* glass card — same design language as HomePage */
  const card =
    'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all duration-300 hover:border-white/40 hover:shadow-blue-500/10'

  const statCards = [
    {
      icon: Activity,
      label: 'Total Records',
      value: healthStats.total,
      iconBg: 'bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-500',
      iconRing: 'ring-sky-300/40',
    },
    {
      icon: Clock,
      label: 'Checkups Today',
      value: healthStats.today,
      iconBg: 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500',
      iconRing: 'ring-violet-300/40',
    },
    {
      icon: CheckCircle,
      label: 'This Week',
      value: healthStats.thisWeek,
      iconBg: 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500',
      iconRing: 'ring-emerald-300/40',
    },
    {
      icon: AlertCircle,
      label: 'Emergencies',
      value: healthStats.emergencies,
      iconBg: 'bg-gradient-to-br from-rose-500 via-red-500 to-orange-500',
      iconRing: 'ring-rose-300/40',
    },
  ]

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
            <p className="font-semibold text-white">Loading health data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${isDarkMode
          ? 'bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-indigo-950/95'
          : 'bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-800/90'}`}
        />
      </div>

      {/* Decorative blobs — matches HomePage's gradient shell */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">

        {/* ── Hero header banner ── */}
        <section className={`${card} overflow-hidden bg-gradient-to-r from-indigo-500/30 via-violet-500/20 to-blue-500/30`}>
          <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                AI-powered health monitoring
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Health Management
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base">
                Monitor Barangay Ilihan health and chat with AI for guidance.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || isLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh data
                </button>
                <button
                  onClick={() => setChatOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition"
                >
                  <Heart className="h-4 w-4" /> Chat with AI
                </button>
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
                <div className="rounded-xl border border-white/30 bg-gradient-to-br from-blue-500/25 to-cyan-500/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-200">
                    <Clock className="h-3.5 w-3.5" /> Checkups
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">{healthStats.today}</p>
                </div>
                <div className="rounded-xl border border-white/30 bg-gradient-to-br from-rose-500/25 to-orange-500/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-200">
                    <AlertCircle className="h-3.5 w-3.5" /> Emergencies
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">{healthStats.emergencies}</p>
                </div>
              </div>
              <p className="text-center text-xs text-white/40">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </section>

        {/* ── AI Health Assistant banner / chat ── */}
        <div>
          {!chatOpen ? (
            <button
              onClick={() => setChatOpen(true)}
              className={`${card} w-full text-left p-5 group`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 shadow-lg shadow-emerald-500/30">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">AI Health Assistant</span>
                      <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white/80">
                        <Sparkles className="h-2.5 w-2.5" /> Powered by Groq
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-white/60">
                      Describe your symptoms and get AI-powered health guidance &amp; checkup scheduling
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-5 w-5 flex-shrink-0 text-white/50 transition group-hover:translate-y-0.5 group-hover:text-white" />
              </div>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm font-semibold text-white">AI Health Assistant</span>
                  <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs text-white/70">
                    <Sparkles className="h-2.5 w-2.5" /> Groq AI
                  </span>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="flex items-center gap-1 text-xs text-white/50 transition hover:text-white"
                >
                  <ChevronUp className="h-3.5 w-3.5" /> Minimize
                </button>
              </div>
              <HealthAIChat onClose={() => setChatOpen(false)} />
            </div>
          )}
        </div>

        {/* ── Stat cards ── */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((c) => (
            <div
              key={c.label}
              className={`${card} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(59,130,246,.25)] hover:border-white/40`}
            >
              <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl ring-2 ${c.iconBg} ${c.iconRing}`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-3xl font-bold tracking-tight text-white">{c.value}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/50">{c.label}</div>
            </div>
          ))}
        </section>

        {/* ── Recent alerts ── */}
        <section className={`${card} p-5 lg:p-6`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/30">
              <AlertCircle className="h-4 w-4 text-rose-200" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Recent health alerts</p>
              <p className="text-base font-semibold text-white">Latest checkups &amp; records</p>
            </div>
          </div>

          {healthAlerts.length > 0 ? (
            <div className="divide-y divide-white/10">
              {healthAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${alert.urgent ? 'animate-pulse bg-rose-400' : 'bg-white/30'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${alert.urgent ? 'bg-rose-400/20 text-rose-200' : 'bg-white/10 text-white/70'}`}>
                          {alert.type}
                        </span>
                        {alert.approvalStatus === 'pending' && (
                          <span className="flex items-center gap-1 rounded-full bg-orange-400/20 px-2 py-0.5 text-xs font-semibold text-orange-200">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        )}
                        {alert.approvalStatus === 'approved' && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                            <CheckCircle className="h-3 w-3" /> Approved
                          </span>
                        )}
                        {alert.approvalStatus === 'rejected' && (
                          <span className="flex items-center gap-1 rounded-full bg-rose-400/20 px-2 py-0.5 text-xs font-semibold text-rose-200">
                            <XCircle className="h-3 w-3" /> Rejected
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-5 text-white">{alert.message}</p>
                      <p className="mt-1 text-xs text-white/40">{alert.time}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewRecord(alert)}
                    disabled={viewLoading === alert.id}
                    className="flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-200 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                  >
                    {viewLoading === alert.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Eye className="h-3.5 w-3.5" />
                    }
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/20 p-5 text-center text-sm text-white/40">
              No recent health alerts. New checkups will appear here.
            </div>
          )}
        </section>

      </div>

      {/* ── Health Record Detail Modal ── */}
      <HealthRecordModal
        record={viewRecord}
        isOpen={!!viewRecord}
        onClose={() => setViewRecord(null)}
      />
    </div>
  )
}

export default HealthPage