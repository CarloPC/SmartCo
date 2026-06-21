import { TrendingUp, TrendingDown } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const StatCardEnhanced = ({ 
  icon: Icon, 
  label, 
  value, 
  gradient,
  trend,
  trendValue,
  subtitle,
  onClick
}) => {
  const { isDarkMode } = useTheme()

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-4 lg:p-5 text-white shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group bg-gradient-to-br ${gradient}`}
    >
      {/* Animated background accent */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white/20 transition-opacity duration-200" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trend === 'up' ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-xs font-semibold">{trendValue}%</span>
            </div>
          )}
        </div>
        <div className="text-2xl lg:text-3xl font-bold mb-1">{value}</div>
        <div className="text-xs lg:text-sm opacity-85">{label}</div>
        {subtitle && <div className="text-xs opacity-70 mt-2">{subtitle}</div>}
      </div>
    </div>
  )
}

export default StatCardEnhanced
