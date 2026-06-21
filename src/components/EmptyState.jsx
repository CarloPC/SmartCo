import { useTheme } from '../context/ThemeContext'

const EmptyState = ({ icon: Icon, title, description, action, actionLabel, isDarkMode: darkModeProp }) => {
  const { isDarkMode: contextDarkMode } = useTheme()
  const isDarkMode = darkModeProp !== undefined ? darkModeProp : contextDarkMode

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-50 border border-gray-200'}`}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200'}`}>
        {Icon && <Icon className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />}
      </div>
      <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
        {title}
      </h3>
      <p className={`text-sm mb-6 text-center max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {description}
      </p>
      {action && actionLabel && (
        <button
          onClick={action}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
