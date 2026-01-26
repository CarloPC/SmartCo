import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Globe, Lock, Eye, Volume2, Smartphone, Save } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'

const SettingsPage = () => {
  const navigate = useNavigate()
  
  const [settings, setSettings] = useState({
    notifications: {
      push: true,
      email: true,
      sms: false,
      emergency: true,
      events: true,
      health: true,
      foodAid: false
    },
    preferences: {
      language: 'en',
      theme: 'light',
      soundEffects: true,
      vibration: true
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false
    }
  })

  const [hasChanges, setHasChanges] = useState(false)

  const handleToggle = (section, key) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key]
      }
    }))
    setHasChanges(true)
  }

  const handleSelect = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    // In real app, send to backend
    alert('Settings saved successfully!')
    setHasChanges(false)
  }

  return (
    <div className="min-h-screen relative pb-20">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: `url(${toledoImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85"></div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <div className="w-10" />
        </div>

        {/* Notifications Section */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Notification Settings</h3>
          </div>
          
          <div className="space-y-3">
            <ToggleItem
              label="Push Notifications"
              description="Receive push notifications on your device"
              checked={settings.notifications.push}
              onChange={() => handleToggle('notifications', 'push')}
            />
            <ToggleItem
              label="Email Notifications"
              description="Receive notifications via email"
              checked={settings.notifications.email}
              onChange={() => handleToggle('notifications', 'email')}
            />
            <ToggleItem
              label="SMS Notifications"
              description="Receive notifications via SMS"
              checked={settings.notifications.sms}
              onChange={() => handleToggle('notifications', 'sms')}
            />
            
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Notification Types</p>
              <div className="space-y-2 pl-4">
                <ToggleItem
                  label="Emergency Alerts"
                  checked={settings.notifications.emergency}
                  onChange={() => handleToggle('notifications', 'emergency')}
                  small
                />
                <ToggleItem
                  label="Event Updates"
                  checked={settings.notifications.events}
                  onChange={() => handleToggle('notifications', 'events')}
                  small
                />
                <ToggleItem
                  label="Health Updates"
                  checked={settings.notifications.health}
                  onChange={() => handleToggle('notifications', 'health')}
                  small
                />
                <ToggleItem
                  label="Food Aid Updates"
                  checked={settings.notifications.foodAid}
                  onChange={() => handleToggle('notifications', 'foodAid')}
                  small
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Preferences</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Language</label>
              <select
                value={settings.preferences.language}
                onChange={(e) => handleSelect('preferences', 'language', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="tl">Tagalog</option>
                <option value="ceb">Cebuano</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Theme</label>
              <select
                value={settings.preferences.theme}
                onChange={(e) => handleSelect('preferences', 'theme', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <ToggleItem
              label="Sound Effects"
              description="Play sounds for notifications and actions"
              checked={settings.preferences.soundEffects}
              onChange={() => handleToggle('preferences', 'soundEffects')}
              icon={<Volume2 className="w-4 h-4" />}
            />
            <ToggleItem
              label="Vibration"
              description="Vibrate for notifications and alerts"
              checked={settings.preferences.vibration}
              onChange={() => handleToggle('preferences', 'vibration')}
              icon={<Smartphone className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Eye className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Privacy</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Profile Visibility</label>
              <select
                value={settings.privacy.profileVisibility}
                onChange={(e) => handleSelect('privacy', 'profileVisibility', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="public">Public</option>
                <option value="barangay">Barangay Only</option>
                <option value="private">Private</option>
              </select>
            </div>

            <ToggleItem
              label="Show Email"
              description="Display email on your profile"
              checked={settings.privacy.showEmail}
              onChange={() => handleToggle('privacy', 'showEmail')}
            />
            <ToggleItem
              label="Show Phone Number"
              description="Display phone number on your profile"
              checked={settings.privacy.showPhone}
              onChange={() => handleToggle('privacy', 'showPhone')}
            />
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <button
            onClick={handleSave}
            className="w-full bg-blue-500/90 hover:bg-blue-600 backdrop-blur-sm text-white font-semibold py-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-xl border border-white/20"
          >
            <Save className="w-5 h-5" />
            <span>Save Changes</span>
          </button>
        )}
      </div>
    </div>
  )
}

// Toggle Item Component
const ToggleItem = ({ label, description, checked, onChange, small, icon }) => (
  <div className={`flex items-center justify-between ${small ? 'py-2' : 'py-3'}`}>
    <div className="flex items-start space-x-2 flex-1">
      {icon && <div className="mt-0.5">{icon}</div>}
      <div>
        <p className={`font-medium text-gray-800 ${small ? 'text-sm' : ''}`}>{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
    <label className="relative inline-block w-12 h-6 flex-shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner cursor-pointer"></div>
    </label>
  </div>
)

export default SettingsPage
