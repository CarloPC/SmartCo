
import { useState, useEffect, useCallback, useRef } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { Brain, RefreshCw, History, LayoutGrid, Heart, Package, Calendar, AlertTriangle, FileText, Loader2 } from 'lucide-react'
import { db } from '../config/firebase'
import { useTheme } from '../context/ThemeContext'
import aiInsightsService, { MODULES } from '../services/aiInsightsService'
import AIInsightCard from '../components/AIInsightCard'

const MODULE_TABS = [
  { key: 'all',            label: 'All',       icon: LayoutGrid },
  { key: MODULES.HEALTH,   label: 'Health',    icon: Heart },
  { key: MODULES.FOOD_AID, label: 'Food Aid',  icon: Package },
  { key: MODULES.EVENTS,   label: 'Events',    icon: Calendar },
  { key: MODULES.EMERGENCY,label: 'Emergency', icon: AlertTriangle },
  { key: MODULES.DOCUMENT, label: 'Documents', icon: FileText },
]

const AIInsightsPage = () => {
  const { isDarkMode } = useTheme()
  const [insights, setInsights] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [showHistory, setShowHistory] = useState(false)
  const [lastGenerated, setLastGenerated] = useState(null)
  const [actionedIds, setActionedIds] = useState({}) // local UX state for ack/dismiss

  const debounceRef = useRef(null)

  const runGeneration = useCallback(async (opts) => {
    try {
      const result = await aiInsightsService.generateAllInsights(opts)
      setInsights(result)
      setLastGenerated(new Date().toISOString())
    } catch (err) {
      console.error('Failed to generate AI insights:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const loadHistory = useCallback(async () => {
    const items = await aiInsightsService.getInsightHistory(50)
    setHistory(items)
  }, [])

  // Initial load
  useEffect(() => {
    runGeneration({ persistHistory: true })
  }, [runGeneration])

  // REAL-TIME AI: whenever health, food aid, event, or emergency data changes in
  // Firestore, automatically regenerate insights (debounced so a burst of writes
  // doesn't trigger a storm of regenerations).
  useEffect(() => {
    const scheduleRegen = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setRefreshing(true)
        runGeneration({ persistHistory: false }) // don't spam history on every live tick
      }, 2500)
    }

    const unsubs = [
      onSnapshot(collection(db, 'health_requests'), scheduleRegen, () => {}),
      onSnapshot(collection(db, 'foodAid'), scheduleRegen, () => {}),
      onSnapshot(collection(db, 'events'), scheduleRegen, () => {}),
      onSnapshot(collection(db, 'emergencies'), scheduleRegen, () => {}),
      onSnapshot(collection(db, 'documentRequests'), scheduleRegen, () => {}),
    ]

    return () => {
      unsubs.forEach(u => u())
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [runGeneration])

  const handleManualRefresh = () => {
    setRefreshing(true)
    runGeneration({ persistHistory: true })
  }

  const handleToggleHistory = () => {
    if (!showHistory) loadHistory()
    setShowHistory(s => !s)
  }

  const handleAcknowledge = (insight) => setActionedIds(m => ({ ...m, [insight.id]: 'acted_on' }))
  const handleDismiss = (insight) => setActionedIds(m => ({ ...m, [insight.id]: 'dismissed' }))

  const visibleInsights = activeTab === 'all'
    ? insights
    : insights.filter(i => i.module === activeTab)

  const highCount = insights.filter(i => i.priority === 'high').length
  const mediumCount = insights.filter(i => i.priority === 'medium').length

  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-800'
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className={`min-h-screen p-4 lg:p-8 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
              <Brain className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${textPrimary}`}>AI Decision Support</h1>
              <p className={`text-sm ${textSecondary}`}>
                Live recommendations for Barangay Ilihan officials, BHWs, and coordinators. The AI explains” it never decides.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleHistory}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${
                isDarkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <History className="w-4 h-4" /> {showHistory ? 'Hide History' : 'View History'}
            </button>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Analyzingâ€¦' : 'Refresh Insights'}
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'High Priority', value: highCount, color: 'text-red-500' },
            { label: 'Medium Priority', value: mediumCount, color: 'text-amber-500' },
            { label: 'Total Insights', value: insights.length, color: textPrimary },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 border text-center ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-100'}`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className={`text-xs mt-1 ${textSecondary}`}>{s.label}</div>
            </div>
          ))}
        </div>

        {lastGenerated && (
          <p className={`text-xs ${textSecondary}`}>
            Last analyzed {new Date(lastGenerated).toLocaleString()} Â· updates automatically when Firestore data changes
          </p>
        )}

        {/* Module tabs */}
        <div className="flex flex-wrap gap-2">
          {MODULE_TABS.map(tab => {
            const Icon = tab.icon
            const count = tab.key === 'all' ? insights.length : insights.filter(i => i.module === tab.key).length
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : isDarkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
                <span className={`text-[11px] px-1.5 rounded-full ${activeTab === tab.key ? 'bg-white/20' : isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <p className={textSecondary}>Analyzing Firestore data across all modulesâ€¦</p>
          </div>
        ) : visibleInsights.length === 0 ? (
          <div className={`rounded-2xl p-10 text-center border ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-100'}`}>
            <p className={textPrimary}>No recommendations right now.</p>
            <p className={`text-sm mt-1 ${textSecondary}`}>The AI didn't detect anything needing attention in this module.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleInsights.map(insight => (
              <AIInsightCard
                key={insight.id}
                insight={insight}
                isDarkMode={isDarkMode}
                status={actionedIds[insight.id]}
                onAcknowledge={handleAcknowledge}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}

        {/* History panel */}
        {showHistory && (
          <div className={`rounded-2xl p-5 border ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`font-semibold mb-3 ${textPrimary}`}>AI Recommendation History</h2>
            {history.length === 0 ? (
              <p className={`text-sm ${textSecondary}`}>No history recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {history.map(h => (
                  <div key={h.id} className={`flex items-center justify-between text-sm py-2 border-b last:border-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                    <div>
                      <span className={textPrimary}>{h.title}</span>
                      <span className={`ml-2 text-xs ${textSecondary}`}>({h.module})</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={textSecondary}>{h.confidence}</span>
                      <span className={textSecondary}>{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AIInsightsPage
