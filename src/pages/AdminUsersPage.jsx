import { useState, useEffect } from 'react'
import { Users, Shield, User, Search, Loader2 } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import adminService from '../services/adminService'

const AdminUsersPage = () => {
  const { isDarkMode } = useTheme()
  const { user: currentUser } = useAuth()
  
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchQuery, filterRole, users])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const allUsers = await adminService.getAllUsers()
      setUsers(allUsers)
      setFilteredUsers(allUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(u => 
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.purok?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredUsers(filtered)
  }

  const handleRoleChange = async (userId, newRole) => {
    if (!adminService.isAdminOnly(currentUser)) {
      alert('Only admins can change user roles')
      return
    }

    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      try {
        await adminService.updateUserRole(userId, newRole)
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
        alert('User role updated successfully')
      } catch (error) {
        console.error('Error updating user role:', error)
        alert('Failed to update user role')
      }
    }
  }

  const getRoleBadgeColor = (role) => {
    if (role === 'admin') return isDarkMode ? 'bg-purple-950/50 text-purple-400' : 'bg-purple-100 text-purple-700'
    if (role === 'barangay_official') return isDarkMode ? 'bg-blue-950/50 text-blue-400' : 'bg-blue-100 text-blue-700'
    return isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
  }

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Administrator'
    if (role === 'barangay_official') return 'Barangay Official'
    return 'Resident'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: `url(${toledoImage})` }}
      >
        <div className={`absolute inset-0 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95' 
            : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85'
        }`}></div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className={`${
          isDarkMode 
            ? 'bg-gradient-to-r from-indigo-900/90 to-purple-950/90 border-gray-700/50' 
            : 'bg-gradient-to-r from-indigo-500/90 to-purple-600/90 border-white/20'
        } backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center space-x-3 mb-2">
            <Users className="w-6 h-6" />
            <h2 className="text-xl font-bold">User Management</h2>
          </div>
          <p className={isDarkMode ? 'text-indigo-200' : 'text-indigo-100'}>
            Manage user accounts and roles
          </p>
        </div>

        {/* Search and Filter */}
        <div className={`${
          isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
        } backdrop-blur-lg rounded-lg p-4 border shadow-lg space-y-3`}>
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search by name, email, or purok..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
          </div>

          {/* Role Filter */}
          <div className="flex space-x-2 overflow-x-auto">
            {[
              { value: 'all', label: 'All Users' },
              { value: 'resident', label: 'Residents' },
              { value: 'barangay_official', label: 'Officials' },
              { value: 'admin', label: 'Admins' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setFilterRole(option.value)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                  filterRole === option.value
                    ? isDarkMode
                      ? 'bg-indigo-900 text-indigo-200'
                      : 'bg-indigo-600 text-white'
                    : isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className={`${
            isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
          } backdrop-blur-lg rounded-lg p-8 border text-center shadow-lg`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${
              isDarkMode ? 'text-indigo-400' : 'text-indigo-500'
            }`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading users...
            </p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="space-y-3">
            {filteredUsers.map(user => (
              <div key={user.id} className={`${
                isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
              } backdrop-blur-lg rounded-lg shadow-xl border p-4`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-full ${
                      user.role === 'admin' 
                        ? isDarkMode ? 'bg-purple-950/50' : 'bg-purple-100'
                        : user.role === 'barangay_official'
                          ? isDarkMode ? 'bg-blue-950/50' : 'bg-blue-100'
                          : isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      {user.role === 'admin' || user.role === 'barangay_official' ? (
                        <Shield className={`w-5 h-5 ${
                          user.role === 'admin'
                            ? isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`} />
                      ) : (
                        <User className={`w-5 h-5 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                        {user.fullName || 'No name'}
                        {user.id === currentUser?.id && (
                          <span className={`ml-2 text-xs font-normal ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>(You)</span>
                        )}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {user.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                        {user.purok && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.purok}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Joined {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role Change (Admin Only) */}
                {adminService.isAdminOnly(currentUser) && user.id !== currentUser?.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <label className={`text-xs font-medium block mb-2 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Change Role
                    </label>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-800'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    >
                      <option value="resident">Resident</option>
                      <option value="barangay_official">Barangay Official</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`${
            isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
          } backdrop-blur-lg rounded-lg shadow-xl border p-6 text-center`}>
            <Users className={`w-12 h-12 mx-auto mb-3 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No users found
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsersPage
