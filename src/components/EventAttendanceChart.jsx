import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CalendarCheck } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

/**
 * EventAttendanceChart
 * Grouped bar chart comparing Expected vs. Actual attendance across
 * community event / announcement categories.
 *
 * Expected data shape:
 * [{ category: 'Health Mission', expected: 200, actual: 185 }, ...]
 */

// Drop this in alongside initializeDemoData() if you need quick mock data
export const buildEventAttendanceDemoData = (categories = []) =>
  (categories.length
    ? categories
    : ['Health Mission', 'Food Distribution', 'General Assembly', 'Vaccination Drive', 'Clean-up Drive']
  ).map((category) => {
    const expected = 100 + Math.floor(Math.random() * 150)
    const actual = Math.max(0, expected - Math.floor(Math.random() * 60) + Math.floor(Math.random() * 20))
    return { category, expected, actual }
  })

const CustomTooltip = ({ active, payload, label, isDarkMode }) => {
  if (!active || !payload || !payload.length) return null
  const expected = payload.find((p) => p.dataKey === 'expected')?.value ?? 0
  const actual = payload.find((p) => p.dataKey === 'actual')?.value ?? 0
  const pct = expected > 0 ? Math.round((actual / expected) * 100) : 0

  return (
    <div
      className={`rounded-xl border p-3 shadow-lg text-xs ${
        isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-slate-200 text-slate-700'
      }`}
    >
      <p className="font-semibold mb-1.5">{label}</p>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        <span>Expected: <strong>{expected}</strong></span>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span>Actual: <strong>{actual}</strong></span>
      </div>
      <p className={`pt-1.5 border-t font-medium ${pct >= 80 ? 'text-teal-500' : 'text-amber-500'} ${isDarkMode ? 'border-gray-700' : 'border-slate-100'}`}>
        {pct}% turnout
      </p>
    </div>
  )
}

export default function EventAttendanceChart({ data = [] }) {
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
        <CalendarCheck className="h-5 w-5 text-blue-500" />
        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-slate-800'}`}>
          Community Event Attendance — Expected vs. Actual
        </h2>
      </div>

      {data.length === 0 ? (
        <div
          className={`rounded-2xl border border-dashed py-10 text-center text-sm ${
            isDarkMode ? 'border-gray-700 text-gray-400' : 'border-slate-300 text-slate-500'
          }`}
        >
          Analytics will appear here once event attendance is recorded.
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="category" tick={tickStyle} axisLine={{ stroke: gridStroke }} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={{ stroke: gridStroke }} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} cursor={{ fill: isDarkMode ? '#1e293b66' : '#f1f5f966' }} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b' }}
                formatter={(value) => (value === 'expected' ? 'Expected Attendance' : 'Actual Attendance')}
              />

              <Bar dataKey="expected" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={42} />
              <Bar dataKey="actual" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}