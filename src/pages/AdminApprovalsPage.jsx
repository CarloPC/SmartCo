import { useState, useEffect } from 'react'
import {
  CheckCircle, XCircle, Activity, Package, Calendar,
  Loader2, AlertCircle, User, Mail, MapPin, Clock,
  Heart, Pill, Droplets, Thermometer, Weight, ChevronDown, ChevronUp,
  Tag, Users, Info
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import adminService from '../services/adminService'

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateTime = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  })
}

/* ─── Submitter info block ───────────────────────────────────────────────── */
const SubmitterBlock = ({ user, submittedAt, isDarkMode }) => {
  const roleLabel = {
    admin: 'Administrator',
    barangay_official: 'Barangay Official',
    resident: 'Resident'
  }[user?.role] || 'Resident'

  const roleCls = {
    admin: isDarkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700',
    barangay_official: isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700',
    resident: isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
  }[user?.role] || (isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')

  return (
    <div className={`rounded-xl p-3 mb-3 ${isDarkMode ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-100'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
        Submitted by
      </p>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ${
          isDarkMode ? 'bg-blue-800 text-blue-100' : 'bg-blue-600 text-white'
        }`}>
          {user?.fullName?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <p className={`font-semibold text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {user?.fullName || 'Unknown User'}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleCls}`}>
              {roleLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {user?.email && (
              <span className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Mail className="w-3 h-3" />{user.email}
              </span>
            )}
            {user?.purok && (
              <span className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <MapPin className="w-3 h-3" />{user.purok}
              </span>
            )}
          </div>
        </div>
      </div>
      {submittedAt && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <Clock className="w-3 h-3" />
          Submitted on {formatDateTime(submittedAt)}
        </div>
      )}
    </div>
  )
}

/* ─── Info row ───────────────────────────────────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value, isDarkMode }) => {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
      <div>
        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}: </span>
        <span className={`text-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{value}</span>
      </div>
    </div>
  )
}

/* ─── Action buttons ─────────────────────────────────────────────────────── */
const ActionButtons = ({ id, onApprove, onReject, actionLoading, isDarkMode }) => (
  <div className="flex gap-2 mt-3">
    <button
      onClick={() => onApprove(id)}
      disabled={actionLoading === id}
      className={`flex-1 font-medium py-2 rounded-xl text-sm transition flex items-center justify-center gap-1.5 ${
        isDarkMode ? 'bg-green-950/50 hover:bg-green-900/70 text-green-300' : 'bg-green-50 hover:bg-green-100 text-green-700'
      } disabled:opacity-50`}
    >
      {actionLoading === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /><span>Approve</span></>}
    </button>
    <button
      onClick={() => onReject(id)}
      disabled={actionLoading === id}
      className={`flex-1 font-medium py-2 rounded-xl text-sm transition flex items-center justify-center gap-1.5 ${
        isDarkMode ? 'bg-red-950/50 hover:bg-red-900/70 text-red-300' : 'bg-red-50 hover:bg-red-100 text-red-700'
      } disabled:opacity-50`}
    >
      <XCircle className="w-4 h-4" /><span>Reject</span>
    </button>
  </div>
)

/* ─── Pending badge ──────────────────────────────────────────────────────── */
const PendingBadge = ({ isDarkMode }) => (
  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
    isDarkMode ? 'bg-orange-950/50 text-orange-400' : 'bg-orange-100 text-orange-700'
  }`}>
    Pending
  </span>
)

/* ─── Expandable details wrapper ─────────────────────────────────────────── */
const ExpandableDetails = ({ children, isDarkMode }) => {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-1 text-xs font-medium mb-2 transition ${
          isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {open ? 'Hide details' : 'View full details'}
      </button>
      {open && (
        <div className={`rounded-xl p-3 space-y-1.5 ${isDarkMode ? 'bg-gray-800/70' : 'bg-gray-50'}`}>
          {children}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
const AdminApprovalsPage = () => {
  const { isDarkMode } = useTheme()

  const [activeTab, setActiveTab] = useState('health')
  const [healthRecords, setHealthRecords] = useState([])
  const [foodAidSchedules, setFoodAidSchedules] = useState([])
  const [events, setEvents] = useState([])
  const [usersMap, setUsersMap] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchPendingApprovals() }, [])

  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true)
      const [health, foodAid, eventsData] = await Promise.all([
        adminService.getPendingHealthRecords(),
        adminService.getPendingFoodAidSchedules(),
        adminService.getPendingEvents()
      ])
      setHealthRecords(health)
      setFoodAidSchedules(foodAid)
      setEvents(eventsData)

      // Collect all unique user IDs and fetch their profiles
      const ids = new Set()
      health.forEach(r => r.userId && ids.add(r.userId))
      foodAid.forEach(r => (r.userId || r.createdBy) && ids.add(r.userId || r.createdBy))
      eventsData.forEach(r => (r.userId || r.createdBy) && ids.add(r.userId || r.createdBy))

      const userEntries = await Promise.all(
        [...ids].map(id => adminService.getUserById(id).then(u => [id, u]))
      )
      setUsersMap(Object.fromEntries(userEntries))
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /* ── Action handlers ── */
  const handleApproveHealth = async (id) => {
    try { setActionLoading(id); await adminService.approveHealthRecord(id); setHealthRecords(prev => prev.filter(r => r.id !== id)) }
    catch { alert('Failed to approve health record') }
    finally { setActionLoading(null) }
  }

  const handleRejectHealth = async (id) => {
    const reason = prompt('Reason for rejection (optional):')
    try { setActionLoading(id); await adminService.rejectHealthRecord(id, reason || ''); setHealthRecords(prev => prev.filter(r => r.id !== id)) }
    catch { alert('Failed to reject health record') }
    finally { setActionLoading(null) }
  }

  const handleApproveFoodAid = async (id) => {
    try { setActionLoading(id); await adminService.approveFoodAidSchedule(id); setFoodAidSchedules(prev => prev.filter(s => s.id !== id)) }
    catch { alert('Failed to approve food aid schedule') }
    finally { setActionLoading(null) }
  }

  const handleRejectFoodAid = async (id) => {
    const reason = prompt('Reason for rejection (optional):')
    try { setActionLoading(id); await adminService.rejectFoodAidSchedule(id, reason || ''); setFoodAidSchedules(prev => prev.filter(s => s.id !== id)) }
    catch { alert('Failed to reject food aid schedule') }
    finally { setActionLoading(null) }
  }

  const handleApproveEvent = async (id) => {
    try { setActionLoading(id); await adminService.approveEvent(id); setEvents(prev => prev.filter(e => e.id !== id)) }
    catch { alert('Failed to approve event') }
    finally { setActionLoading(null) }
  }

  const handleRejectEvent = async (id) => {
    const reason = prompt('Reason for rejection (optional):')
    try { setActionLoading(id); await adminService.rejectEvent(id, reason || ''); setEvents(prev => prev.filter(e => e.id !== id)) }
    catch { alert('Failed to reject event') }
    finally { setActionLoading(null) }
  }

  /* ── Shared card wrapper ── */
  const cardCls = `${
    isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
  } backdrop-blur-lg rounded-xl shadow-xl border p-4`

  /* ── Empty state ── */
  const EmptyState = ({ icon: Icon, label }) => (
    <div className={`${cardCls} text-center py-10`}>
      <Icon className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
    </div>
  )

  const tabs = [
    { key: 'health',  icon: Activity, label: 'Health',   count: healthRecords.length,   color: 'blue'   },
    { key: 'foodaid', icon: Package,  label: 'Food Aid', count: foodAidSchedules.length, color: 'green'  },
    { key: 'events',  icon: Calendar, label: 'Events',   count: events.length,           color: 'purple' },
  ]

  const tabActive = {
    blue:   isDarkMode ? 'border-blue-400 text-blue-400'     : 'border-blue-600 text-blue-600',
    green:  isDarkMode ? 'border-green-400 text-green-400'   : 'border-green-600 text-green-600',
    purple: isDarkMode ? 'border-purple-400 text-purple-400' : 'border-purple-600 text-purple-600',
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95'
            : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85'
        }`} />
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className={`${
          isDarkMode
            ? 'bg-gradient-to-r from-orange-900/90 to-red-950/90 border-gray-700/50'
            : 'bg-gradient-to-r from-orange-500/90 to-red-600/90 border-white/20'
        } backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center gap-3 mb-1">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Pending Approvals</h2>
          </div>
          <p className={isDarkMode ? 'text-orange-200' : 'text-orange-100'}>
            Review submitted records with full submitter details
          </p>
        </div>

        {/* Tabs */}
        <div className={`${
          isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
        } backdrop-blur-lg rounded-xl border shadow-lg`}>
          <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {tabs.map(({ key, icon: Icon, label, count, color }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-3 px-2 font-medium flex items-center justify-center gap-1.5 text-sm transition ${
                  activeTab === key
                    ? `border-b-2 ${tabActive[color]}`
                    : isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === key
                    ? isDarkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'
                    : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className={`${cardCls} py-10 text-center`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading approvals…</p>
          </div>
        ) : (
          <>
            {/* ── Health Records ── */}
            {activeTab === 'health' && (
              <div className="space-y-3">
                {healthRecords.length > 0 ? healthRecords.map(record => {
                  const submitter = usersMap[record.userId]
                  const a = record.healthAssessment || {}
                  return (
                    <div key={record.id} className={cardCls}>
                      {/* Title row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
                            <Activity className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                          </div>
                          <p className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                            Health Checkup Record
                          </p>
                        </div>
                        <PendingBadge isDarkMode={isDarkMode} />
                      </div>

                      {/* Submitter */}
                      <SubmitterBlock user={submitter} submittedAt={record.createdAt} isDarkMode={isDarkMode} />

                      {/* Summary */}
                      {a.vitalsSummary && (
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {a.vitalsSummary}
                        </p>
                      )}

                      {/* Expandable full details */}
                      <ExpandableDetails isDarkMode={isDarkMode}>
                        <InfoRow icon={Droplets}    label="Blood Type"      value={record.bloodType}               isDarkMode={isDarkMode} />
                        <InfoRow icon={Thermometer} label="Blood Pressure"  value={a.bloodPressure}                isDarkMode={isDarkMode} />
                        <InfoRow icon={Weight}      label="Weight"          value={record.weight ? `${record.weight} kg` : null} isDarkMode={isDarkMode} />
                        <InfoRow icon={Heart}       label="Conditions"      value={Array.isArray(record.conditions) ? record.conditions.join(', ') : record.conditions} isDarkMode={isDarkMode} />
                        <InfoRow icon={Pill}        label="Medications"     value={Array.isArray(record.medications) ? record.medications.join(', ') : record.medications} isDarkMode={isDarkMode} />
                        <InfoRow icon={Info}        label="Allergies"       value={Array.isArray(record.allergies) ? record.allergies.join(', ') : record.allergies} isDarkMode={isDarkMode} />
                        <InfoRow icon={Activity}    label="Symptoms"        value={Array.isArray(record.symptoms) ? record.symptoms.join(', ') : record.symptoms} isDarkMode={isDarkMode} />
                        <InfoRow icon={Info}        label="Assessment Risk"  value={a.riskLevel}                   isDarkMode={isDarkMode} />
                        <InfoRow icon={Calendar}    label="Checkup Date"    value={formatDate(record.checkupDate || record.createdAt)} isDarkMode={isDarkMode} />
                      </ExpandableDetails>

                      <ActionButtons id={record.id} onApprove={handleApproveHealth} onReject={handleRejectHealth} actionLoading={actionLoading} isDarkMode={isDarkMode} />
                    </div>
                  )
                }) : <EmptyState icon={Activity} label="No pending health records" />}
              </div>
            )}

            {/* ── Food Aid ── */}
            {activeTab === 'foodaid' && (
              <div className="space-y-3">
                {foodAidSchedules.length > 0 ? foodAidSchedules.map(schedule => {
                  const submitterId = schedule.userId || schedule.createdBy
                  const submitter = usersMap[submitterId]
                  return (
                    <div key={schedule.id} className={cardCls}>
                      {/* Title row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-green-900/40' : 'bg-green-100'}`}>
                            <Package className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                          </div>
                          <div>
                            <p className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                              {schedule.purok || 'Food Aid Schedule'}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {schedule.date} {schedule.totalFamilies ? `· ${schedule.totalFamilies} families` : ''}
                            </p>
                          </div>
                        </div>
                        <PendingBadge isDarkMode={isDarkMode} />
                      </div>

                      {/* Submitter */}
                      <SubmitterBlock user={submitter} submittedAt={schedule.createdAt} isDarkMode={isDarkMode} />

                      {/* Expandable full details */}
                      <ExpandableDetails isDarkMode={isDarkMode}>
                        <InfoRow icon={MapPin}    label="Purok"           value={schedule.purok}                isDarkMode={isDarkMode} />
                        <InfoRow icon={Calendar}  label="Schedule Date"   value={formatDate(schedule.date)}     isDarkMode={isDarkMode} />
                        <InfoRow icon={Users}     label="Total Families"  value={schedule.totalFamilies}         isDarkMode={isDarkMode} />
                        <InfoRow icon={Package}   label="Items"           value={schedule.items}                 isDarkMode={isDarkMode} />
                        <InfoRow icon={Tag}       label="Category"        value={schedule.category}              isDarkMode={isDarkMode} />
                        <InfoRow icon={Info}      label="Notes"           value={schedule.notes}                 isDarkMode={isDarkMode} />
                        <InfoRow icon={Clock}     label="Submitted"       value={formatDateTime(schedule.createdAt)} isDarkMode={isDarkMode} />
                      </ExpandableDetails>

                      <ActionButtons id={schedule.id} onApprove={handleApproveFoodAid} onReject={handleRejectFoodAid} actionLoading={actionLoading} isDarkMode={isDarkMode} />
                    </div>
                  )
                }) : <EmptyState icon={Package} label="No pending food aid schedules" />}
              </div>
            )}

            {/* ── Events ── */}
            {activeTab === 'events' && (
              <div className="space-y-3">
                {events.length > 0 ? events.map(event => {
                  const submitterId = event.userId || event.createdBy
                  const submitter = usersMap[submitterId]
                  return (
                    <div key={event.id} className={cardCls}>
                      {/* Title row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-purple-900/40' : 'bg-purple-100'}`}>
                            <Calendar className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                          </div>
                          <div>
                            <p className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                              {event.title}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {event.date}{event.venue ? ` · ${event.venue}` : ''}
                            </p>
                          </div>
                        </div>
                        <PendingBadge isDarkMode={isDarkMode} />
                      </div>

                      {/* Submitter */}
                      <SubmitterBlock user={submitter} submittedAt={event.createdAt} isDarkMode={isDarkMode} />

                      {/* Description preview */}
                      {event.description && (
                        <p className={`text-sm mb-2 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {event.description}
                        </p>
                      )}

                      {/* Expandable full details */}
                      <ExpandableDetails isDarkMode={isDarkMode}>
                        <InfoRow icon={Tag}      label="Category"        value={event.category}                  isDarkMode={isDarkMode} />
                        <InfoRow icon={Calendar} label="Event Date"      value={formatDate(event.date)}           isDarkMode={isDarkMode} />
                        <InfoRow icon={MapPin}   label="Venue"           value={event.venue}                      isDarkMode={isDarkMode} />
                        <InfoRow icon={Users}    label="Max Attendees"   value={event.maxAttendees}               isDarkMode={isDarkMode} />
                        <InfoRow icon={Info}     label="Description"     value={event.description}                isDarkMode={isDarkMode} />
                        <InfoRow icon={Clock}    label="Submitted"       value={formatDateTime(event.createdAt)}  isDarkMode={isDarkMode} />
                      </ExpandableDetails>

                      <ActionButtons id={event.id} onApprove={handleApproveEvent} onReject={handleRejectEvent} actionLoading={actionLoading} isDarkMode={isDarkMode} />
                    </div>
                  )
                }) : <EmptyState icon={Calendar} label="No pending events" />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminApprovalsPage
