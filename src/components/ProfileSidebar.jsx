
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, User, Settings, Bell, Shield, LogOut, ChevronRight, Moon, Sun, HelpCircle, Info, Lock, Globe } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import notificationService from '../services/notificationService'

const ProfileSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { isDarkMode, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { language, setLanguage, t, supportedLanguages } = useLanguage()
  const [unreadCount, setUnreadCount] = useState(0)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount()
        setUnreadCount(count)
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    if (isOpen) {
      fetchUnreadCount()
    }

    window.addEventListener('notifications-updated', fetchUnreadCount)
    return () => window.removeEventListener('notifications-updated', fetchUnreadCount)
  }, [isOpen])

  // Use actual user data from auth context
  const userData = {
    name: user?.fullName || 'User',
    email: user?.email || '',
    role: user?.role || 'Resident',
    purok: user?.purok || '',
    avatar: user?.photoURL || null
  }

  /* glass card ” matches HomePage panels */
  const card =
    'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all duration-300 hover:border-white/40'

  const currentLanguageLabel = supportedLanguages.find(l => l.code === language)?.label || 'English'

  const menuItems = [
    {
      icon: User,
      label: t('nav.myProfile'),
      description: 'View and edit profile',
      path: '/profile',
      iconBg: 'bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-500',
      iconRing: 'ring-sky-300/40',
    },
   {
      icon: Bell,
      label: t('nav.notifications'),
      description: 'Manage alerts',
      badge: unreadCount > 0 ? String(unreadCount > 99 ? '99+' : unreadCount) : null,
      path: '/notifications',
      iconBg: 'bg-gradient-to-br from-rose-500 via-pink-500 to-red-500',
      iconRing: 'ring-rose-300/40',
    },
    {
      icon: Settings,
      label: t('nav.settings'),
      description: 'App preferences',
      path: '/settings',
      iconBg: 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500',
      iconRing: 'ring-violet-300/40',
    },
    {
      icon: Shield,
      label: t('nav.privacySecurity'),
      description: 'Control your data',
      path: '/privacy-security',
      iconBg: 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500',
      iconRing: 'ring-emerald-300/40',
    },
    {
      icon: isDarkMode ? Sun : Moon,
      label: t('nav.darkMode'),
      description: isDarkMode ? 'Switch to light mode' : 'Switch to dark mode',
      toggle: true,
      iconBg: 'bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500',
      iconRing: 'ring-amber-300/40',
    },
    {
      icon: Globe,
      label: t('nav.language'),
      description: currentLanguageLabel,
      isLanguage: true,
      iconBg: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500',
      iconRing: 'ring-blue-300/40',
    },
    ...(user?.role === 'resident'
      ? [{
          icon: Lock,
          label: t('nav.requestRoleUpgrade'),
          description: 'Ask an admin to become a Barangay Official or BHW',
          path: '/request-role-upgrade',
          iconBg: 'bg-gradient-to-br from-slate-500 via-gray-500 to-zinc-600',
          iconRing: 'ring-slate-300/40',
        }]
      : []),
    {
      icon: HelpCircle,
      label: t('nav.helpSupport'),
      description: 'Get assistance',
      path: '/help-support',
      iconBg: 'bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500',
      iconRing: 'ring-cyan-300/40',
    },
    {
      icon: Info,
      label: t('nav.about'),
      description: 'App information',
      path: '/about',
      iconBg: 'bg-gradient-to-br from-indigo-500 via-blue-500 to-violet-500',
      iconRing: 'ring-indigo-300/40',
    },
  ]

  const handleMenuClick = (item) => {
    if (item.toggle) {
      toggleTheme()
    } else if (item.isLanguage) {
      setShowLanguageMenu((prev) => !prev)
    } else if (item.path) {
      navigate(item.path)
      onClose()
    }
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout()
      onClose()
      navigate('/')
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Background gradient ” same palette as HomePage's dashboard backdrop */}
        <div
          className={`absolute inset-0 -z-10 ${
            isDarkMode
              ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950'
              : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800'
          }`}
        />
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute top-1/2 -left-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        </div>

        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-white/10 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{t('nav.profile')}</h2>
              <button
                onClick={onClose}
                className="rounded-lg border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/15 text-2xl font-bold text-white shadow-lg backdrop-blur-sm">
                {userData.avatar ? (
                  <img src={userData.avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  userData.name.charAt(0)
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{userData.name}</h3>
                <p className="text-sm text-white/60">{userData.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {userData.role}
                  </span>
                  {userData.purok && (
                    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {userData.purok}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2.5">
              {menuItems.map((item, index) => (
                <div key={index}>
                  <button
                    onClick={() => handleMenuClick(item)}
                    className={`group flex w-full items-center justify-between p-4 text-left ${card}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-lg ring-2 transition-transform duration-300 group-hover:scale-110 ${item.iconBg} ${item.iconRing}`}
                      >
                        <item.icon className="h-4.5 w-4.5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.label}</p>
                        <p className="text-xs text-white/50">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.badge && (
                        <span className="rounded-full bg-rose-500 px-2 py-1 text-xs font-bold text-white shadow-md shadow-rose-500/30">
                          {item.badge}
                        </span>
                      )}
                      {item.toggle ? (
                        <div className="relative inline-block h-6 w-12">
                          <input type="checkbox" checked={isDarkMode} readOnly className="peer sr-only" />
                          <div
                            className={`h-6 w-12 rounded-full transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:after:translate-x-6 ${
                              isDarkMode ? 'bg-blue-500' : 'bg-white/20'
                            }`}
                          />
                        </div>
                      ) : (
                        <ChevronRight
                          className={`h-5 w-5 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white ${
                            item.isLanguage && showLanguageMenu ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </div>
                  </button>

                  {item.isLanguage && showLanguageMenu && (
                    <div className="mt-1 ml-14 mb-1 space-y-1 rounded-xl border border-white/10 bg-black/20 p-2 backdrop-blur-xl">
                      {supportedLanguages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code)
                            setShowLanguageMenu(false)
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                            language === lang.code
                              ? 'bg-blue-500/30 text-white font-semibold'
                              : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{lang.flagLabel}</span>
                          {language === lang.code && <span className="text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer - Logout */}
          <div className="border-t border-white/10 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center space-x-2 rounded-xl border border-rose-400/30 bg-rose-500/15 py-3 font-semibold text-rose-200 backdrop-blur-sm transition hover:bg-rose-500/25"
            >
              <LogOut className="h-5 w-5" />
              <span>{t('nav.logout')}</span>
            </button>
            <p className="mt-3 text-center text-xs text-white/40">
              SmartCo v1.0.0 © 2026
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProfileSidebar
