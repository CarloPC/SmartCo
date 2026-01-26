import { useNavigate } from 'react-router-dom'
import { X, User, Settings, Bell, Shield, LogOut, ChevronRight, Moon, Sun, HelpCircle, Info } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const ProfileSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { isDarkMode, toggleTheme } = useTheme()
  // Mock user data - replace with actual user data later
  const userData = {
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@smartco.ph',
    role: 'Barangay Official',
    purok: 'Purok 3',
    avatar: null
  }

  const menuItems = [
    { icon: User, label: 'My Profile', description: 'View and edit profile', path: '/profile' },
    { icon: Bell, label: 'Notifications', description: 'Manage alerts', badge: '3', path: '/notifications' },
    { icon: Settings, label: 'Settings', description: 'App preferences', path: '/settings' },
    { icon: Shield, label: 'Privacy & Security', description: 'Control your data', path: '/privacy-security' },
    { icon: isDarkMode ? Sun : Moon, label: 'Dark Mode', description: isDarkMode ? 'Switch to light mode' : 'Switch to dark mode', toggle: true },
    { icon: HelpCircle, label: 'Help & Support', description: 'Get assistance', path: '/help-support' },
    { icon: Info, label: 'About SmartCo', description: 'App information', path: '/about' },
  ]

  const handleMenuClick = (item) => {
    if (item.toggle) {
      toggleTheme()
    } else if (item.path) {
      navigate(item.path)
      onClose()
    }
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // In real app, clear session/tokens
      navigate('/')
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-full sm:w-[400px] ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        } z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className={`${
          isDarkMode ? 'bg-gradient-to-r from-blue-900 to-slate-900' : 'bg-gradient-to-r from-blue-600 to-blue-700'
        } text-white p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Profile</h2>
            <button
              onClick={onClose}
              className={`p-2 ${isDarkMode ? 'hover:bg-blue-800' : 'hover:bg-blue-500'} rounded-lg transition`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
              {userData.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{userData.name}</h3>
              <p className={`${isDarkMode ? 'text-blue-200' : 'text-blue-100'} text-sm`}>{userData.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs ${isDarkMode ? 'bg-blue-800' : 'bg-blue-500'} px-2 py-1 rounded-full`}>
                  {userData.role}
                </span>
                <span className={`text-xs ${isDarkMode ? 'bg-blue-800' : 'bg-blue-500'} px-2 py-1 rounded-full`}>
                  {userData.purok}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="overflow-y-auto h-[calc(100vh-280px)] p-4">
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuClick(item)}
                className={`w-full flex items-center justify-between p-4 rounded-xl ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                } transition group`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 ${
                    isDarkMode ? 'bg-blue-900/50 group-hover:bg-blue-800/70' : 'bg-blue-50 group-hover:bg-blue-100'
                  } rounded-lg transition`}>
                    <item.icon className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{item.label}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {item.toggle ? (
                    <div className="relative inline-block w-12 h-6">
                      <input type="checkbox" checked={isDarkMode} readOnly className="sr-only peer" />
                      <div className={`w-12 h-6 ${
                        isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                      } peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                    </div>
                  ) : (
                    <ChevronRight className={`w-5 h-5 ${
                      isDarkMode ? 'text-gray-500 group-hover:text-blue-400' : 'text-gray-400 group-hover:text-blue-600'
                    } transition`} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer - Logout */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${
          isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
        }`}>
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center justify-center space-x-2 ${
              isDarkMode ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'
            } font-semibold py-3 rounded-xl transition`}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
          <p className={`text-center text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-3`}>
            SmartCo v1.0.0 © 2026
          </p>
        </div>
      </div>
    </>
  )
}

export default ProfileSidebar
