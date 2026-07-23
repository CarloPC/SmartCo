
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Boxes } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { PUROKS_ILIHAN } from '../constants/puroks'

/**
 * FoodAidProjectionChart
 * Visualizes Target vs. Served households per area for food aid distribution.
 *
 * Expected data shape:
 * [{ name: 'Sitio Proper Ilihan', targetHouseholds: 120, servedHouseholds: 95 }, ...]
 */

// Drop this in alongside initializeDemoData() if you need quick mock data
export const buildFoodAidProjectionDemoData = (puroks = []) => {
  const purokList = puroks.length ? puroks : [...PUROKS_ILIHAN]
  return purokList.map((name) => {
    const targetHouseholds = 80 + Math.floor(Math.random() * 80)
    const servedHouseholds = Math.max(0, targetHouseholds - Math.floor(Math.random() * 35))
    return { name, targetHouseholds, servedHouseholds }
  })
}

const CustomTooltip = ({ active, payload, label, isDarkMode }) => {
  if (!active || !payload || !payload.length) return null
  const target = payload.find((p) => p.dataKey === 'targetHouseholds')?.value ?? 0
  const served = payload.find((p) => p.dataKey === 'servedHouseholds')?.value ?? 0
  const pct = target > 0 ? Math.round((served / target) * 100) : 0

  return (
    <div
      className={`rounded-xl border p-3 shadow-lg text-xs ${
        isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-slate-200 text-slate-700'
      }`}
    >
      <p className="font-semibold mb-1.5">{label}</p>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="w-2 h-2 rounded-full bg-indigo-500" />
        <span>Target: <strong>{target}</strong> households</span>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2 h-2 rounded-full bg-teal-500" />
        <span>Served: <strong>{served}</strong> households</span>
      </div>
      <p className={`pt-1.5 border-t font-medium ${isDarkMode ? 'border-gray-700 text-teal-400' : 'border-slate-100 text-teal-600'}`}>
        {pct}% of target reached
      </p>
    </div>
  )
}

export default function FoodAidProjectionChart({ data = [] }) {
  const { isDarkMode } = useTheme()
  const gridStroke = isDarkMode ? '#334155' : '#e2e8f0'
  const tickStyle = { fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }

  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${
        isDarkMode ? 'border-gray-700/50 bg-gray-900/95' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="mb-4 flex items-center gap-2">
        <Boxes className="h-5 w-5 text-teal-500" />
        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-slate-800'}`}>
          Food Aid Projections  Target vs. Served
        </h2>
      </div>

      {data.length === 0 ? (
        <div
          className={`rounded-2xl border border-dashed py-10 text-center text-sm ${
            isDarkMode ? 'border-gray-700 text-gray-400' : 'border-slate-300 text-slate-500'
          }`}
        >
          Analytics will appear here once food aid distributions are scheduled.
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="servedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.04} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" tick={tickStyle} axisLine={{ stroke: gridStroke }} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={{ stroke: gridStroke }} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} cursor={{ stroke: gridStroke, strokeWidth: 1 }} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b' }}
                formatter={(value) => (value === 'targetHouseholds' ? 'Target Households' : 'Served Households')}
              />

              <Area
                type="monotone"
                dataKey="targetHouseholds"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#targetGradient)"
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="servedHouseholds"
                stroke="#0d9488"
                strokeWidth={2}
                fill="url(#servedGradient)"
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

