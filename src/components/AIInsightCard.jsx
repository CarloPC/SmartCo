
import { Sparkles, Clock, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { useState } from 'react'

const PRIORITY_STYLES = {
  high:   { dot: 'bg-red-500',    badge: 'bg-red-500/10 text-red-500 border-red-500/30',       label: 'High Priority' },
  medium: { dot: 'bg-amber-500',  badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30',   label: 'Medium Priority' },
  low:    { dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', label: 'Low Priority' },
}

const CONFIDENCE_STYLES = {
  High:   'text-emerald-500',
  Medium: 'text-amber-500',
  Low:    'text-gray-400',
}

const MODULE_LABELS = {
  health: 'Health AI',
  food_aid: 'Food Aid AI',
  events: 'Event AI',
  emergency: 'Emergency AI',
  document: 'Document AI',
}

const formatTimestamp = (iso) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

/**
 * Displays a single explainable AI recommendation.
 * Every card always shows: Title, Summary, Reason, Confidence, Suggested Action,
 * Priority Level, Timestamp â€” per the Explainable AI requirement.
 */
const AIInsightCard = ({ insight, isDarkMode, onAcknowledge, onDismiss, status }) => {
  const [expanded, setExpanded] = useState(false)
  const priorityStyle = PRIORITY_STYLES[insight.priority] || PRIORITY_STYLES.low

  const card = `${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border`

  return (
    <div className={`${card} p-5 flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className={`mt-1 w-2 h-2 rounded-full ${priorityStyle.dot} shrink-0`} />
          <div>
            <span className={`text-[11px] uppercase tracking-wide font-medium ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              {MODULE_LABELS[insight.module] || 'AI'}
            </span>
            <h3 className={`font-semibold leading-snug ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {insight.title}
            </h3>
          </div>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap ${priorityStyle.badge}`}>
          {priorityStyle.label}
        </span>
      </div>

      <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{insight.summary}</p>

      <button
        onClick={() => setExpanded(e => !e)}
        className={`flex items-center gap-1 text-xs font-medium self-start ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        {expanded ? 'Hide reasoning' : 'Why is the AI recommending this?'}
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className={`rounded-xl p-3 text-sm space-y-2 ${isDarkMode ? 'bg-gray-800/70 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
          <p><span className="font-semibold">Reason: </span>{insight.reason}</p>
          <p><span className="font-semibold">Suggested Action: </span>{insight.suggestedAction}</p>
          {insight.dataAnalyzed && (
            <p className="text-xs opacity-70 break-words">
              <span className="font-semibold">Data analyzed: </span>
              {Object.entries(insight.dataAnalyzed).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`).join(' Â· ')}
            </p>
          )}
        </div>
      )}

      <div className={`flex items-center justify-between pt-2 mt-1 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
        <div className="flex items-center gap-3 text-xs">
          <span className={CONFIDENCE_STYLES[insight.confidence] || 'text-gray-400'}>
            Confidence: {insight.confidence}
          </span>
          <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <Clock className="w-3 h-3" /> {formatTimestamp(insight.timestamp)}
          </span>
        </div>

        {(onAcknowledge || onDismiss) && (
          <div className="flex items-center gap-2">
            {status && status !== 'generated' && (
              <span className={`text-xs italic ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {status === 'acted_on' ? 'Acted on' : status === 'dismissed' ? 'Dismissed' : status}
              </span>
            )}
            {(!status || status === 'generated') && (
              <>
                <button
                  onClick={() => onAcknowledge?.(insight)}
                  title="Mark as acted on"
                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDismiss?.(insight)}
                  title="Dismiss"
                  className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AIInsightCard
