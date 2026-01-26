import { X, AlertCircle } from 'lucide-react'

const healthAlerts = [
  { id: 1, type: 'Emergency', message: 'Medical emergency reported in Purok 4', time: '2 mins ago', urgent: true },
  { id: 2, type: 'Checkup', message: 'Senior citizen checkup completed - 15 residents', time: '1 hour ago', urgent: false },
  { id: 3, type: 'Alert', message: 'Vaccination drive scheduled for next week', time: '3 hours ago', urgent: false }
]

const NotificationDropdown = ({ onClose }) => {
  return (
    <div className="bg-white border-b border-gray-200 shadow-lg p-4 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
        <button onClick={onClose}>
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      {healthAlerts.slice(0, 3).map(alert => (
        <div key={alert.id} className="p-3 bg-gray-50 rounded-lg text-sm">
          <p className="font-medium text-gray-800">{alert.message}</p>
          <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
        </div>
      ))}
    </div>
  )
}

export default NotificationDropdown
