import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Heart, Package, Calendar, Shield, ChevronLeft, ChevronRight, AlertTriangle, UserCheck, Stethoscope, Truck, Brain, FileText } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import adminService from '../services/adminService'
import foodAidService from '../services/foodAidService'

const Sidebar = ({ isCollapsed, onToggleCollapse, navBadges = {} }) => {
  const location = useLocation()
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const isAdmin = adminService.isAdmin(user)
  const [assignmentCount, setAssignmentCount] = useState(0)

  // Only show "My Assignments" once this user actually has a food aid assignment 
  // keeps the sidebar clean for people who've never volunteered.
  useEffect(() => {
    if (!user?.id) return
    const unsubscribe = foodAidService.subscribeToVolunteerAssignments(user.id, list => {
      setAssignmentCount(list.filter(a => !['completed', 'archived', 'cancelled'].includes(a.progress?.workflowStatus)).length)
    })
    return () => unsubscribe()
  }, [user?.id])

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const navItems = [
    { icon: Home,          label: 'Home',             path: '/home' },
    { icon: Heart,         label: 'Health',           path: '/health', badgeKey: 'health' },
    { icon: Package,       label: 'Food Aid',         path: '/food-aid', badgeKey: 'foodAid' },
    { icon: Calendar,      label: 'Events',           path: '/events', badgeKey: 'events' },
    {
      icon: FileText,
      label: 'Document Requests',
      path: (user?.role === 'admin' || user?.role === 'barangay_official') ? '/documents/manage' : '/documents',
      badgeKey: 'document',
    },
    {
      icon: AlertTriangle,
      label: isAdmin ? 'Emergencies' : 'Report Emergency',
      path: isAdmin ? '/emergency' : '/emergency/report',
      accent: true,
      badgeKey: 'emergency',
    },
  ]

  if (assignmentCount > 0) {
    navItems.splice(3, 0, { icon: Truck, label: 'My Assignments', path: '/food-aid/my-assignments' })
  }

  if (user?.role === 'bhw') navItems.splice(1, 0, { icon: Stethoscope, label: 'BHW', path: '/bhw' })
  if (isAdmin) navItems.push({ icon: Brain, label: 'AI Decision Support', path: '/ai-insights', accent: true })
  if (isAdmin) navItems.push({ icon: Shield, label: 'Admin', path: '/admin' })
  if (user?.role === 'admin') navItems.push({ icon: UserCheck, label: 'Role Upgrade Requests', path: '/admin/role-requests' })

  return (
    <aside  
    
  style={{
    width: isCollapsed
      ? 'var(--sidebar-collapsed-width)'
      : 'var(--sidebar-width)',
    top: 'var(--topbar-height)',
  }}

      
  

  className={`
hidden
lg:flex
flex-col
fixed
left-0
bottom-0
z-30
transition-all
duration-500
ease-in-out
backdrop-blur-2xl
border-r
border-white/10
shadow-[20px_0_60px_rgba(0,0,0,.18)]
    
    

${
  isDarkMode
    ? 'bg-gradient-to-b from-slate-900/70 via-indigo-900/55 to-blue-950/65'
    : 'bg-gradient-to-b from-white/12 via-blue-500/12 to-indigo-600/18'
}
`}

>
  <div className="absolute inset-0 overflow-hidden pointer-events-none">

  <div className="
absolute
-top-24
-left-24
h-72
w-72
rounded-full
bg-cyan-400/10
blur-[110px]
"/>

  <div className="
absolute
bottom-0
-right-10
h-80
w-80
rounded-full
bg-violet-500/10
blur-[140px]
"/>

</div>
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-2 px-1">
          {navItems.map((item) => {
            const active = isActive(item.path)
            const badgeCount = item.badgeKey ? (navBadges[item.badgeKey] || 0) : 0
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={`relative flex items-center rounded-xl transition-all duration-200 group
                  ${isCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5 gap-3'}
                  ${active
                    ? item.accent
                      ? 'bg-rose-400/25 text-rose-100'
                      : 'bg-gradient-to-r from-sky-500/30 via-blue-500/25 to-violet-500/20 text-white shadow-xl border border-white/20 backdrop-blur-xl'
                    : item.accent
                      ? 'text-rose-200/80 hover:bg-rose-400/15 hover:text-rose-100'
                      : 'text-white/65 hover:bg-white/10 hover:backdrop-blur-xl hover:text-white hover:translate-x-1 hover:shadow-lg'
                  }`}
              >
                {/* Active left bar */}
                {active && (
                  <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full
                    ${item.accent ? 'bg-rose-300' : 'bg-white'}`}
                  />
                )}

                <span className="relative flex-shrink-0">
                  <item.icon
                    className={`w-5 h-5 transition-colors
                      ${active ? 'text-white' : item.accent ? 'text-rose-200' : 'text-white/60 group-hover:text-white'}`}
                  />
                  {/* Unread indicator ” shown even when collapsed */}
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-slate-900/80">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </span>

                {!isCollapsed && (
                  <span className={`flex-1 font-medium text-sm ${active ? 'text-white font-semibold' : ''}`}>
                    {item.label}
                  </span>
                )}

                {/* Tooltip on collapse */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg bg-slate-900 text-white border border-white/10">
                    {item.label}{badgeCount > 0 ? ` (${badgeCount} new)` : ''}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={onToggleCollapse}
          className="
              w-full
              flex
              items-center
              justify-center
              rounded-2xl
              py-3
              transition-all
              duration-300
              text-white/60
              border
              border-transparent
              hover:border-white/15
              hover:bg-white/10
              hover:backdrop-blur-xl
              hover:text-white
              hover:shadow-lg
              "
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <div className="flex items-center gap-2 text-sm font-medium">
              <ChevronLeft className="w-5 h-5" />
              <span>Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar