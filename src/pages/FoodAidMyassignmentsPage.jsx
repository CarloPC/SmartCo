import { useState, useEffect } from 'react'
import { Truck, Clock, Users, MapPin, CheckCircle2, PlayCircle, Package, Loader2 } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import foodAidService, { WORKFLOW_LABELS } from '../services/foodAidService'

// ── Individual assignment card ──────────────────────────────────────────────
function AssignmentCard({ dist, card, busy, past, onStart, onUpdate }) {
  const p = dist.progress || {}
  const stage = p.workflowStatus

  return (
    <div className={`${card} p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white">
            {dist.barangay ? `${dist.barangay} · ${dist.purok || ''}` : dist.purok}
          </h4>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-white/60">
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{dist.date}{dist.timeSlot ? ' · ' + dist.timeSlot : ''}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-3.5 h-3.5" />
              <span>{p.householdsTarget || 0} households</span>
            </div>
            {dist.packageType && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">📦 {dist.packageType}</span>
            )}
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-2 bg-white/10 text-white/70">
          {WORKFLOW_LABELS[stage] || 'Assigned'}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs mb-1.5 text-white/50">
          <span>Progress</span>
          <span className="font-semibold">{p.householdsServed || 0} / {p.householdsTarget || 0} households</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden bg-white/10">
          <div
            className="h-2 rounded-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${p.percentage || 0}%` }}
          />
        </div>
        <p className="text-xs mt-1 text-right text-white/40">
          {p.percentage || 0}% complete · {p.householdsRemaining || 0} remaining
        </p>
      </div>

      {dist.estimatedCompletion && (
        <p className="text-xs text-white/50 mb-3 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          Est. completion: {dist.estimatedCompletion}
        </p>
      )}

      {/* Actions — only for active assignments */}
      {!past && (
        <div className="flex gap-2">
          {stage === 'volunteer_assigned' && (
            <button
              disabled={busy}
              onClick={onStart}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition bg-blue-500/80 hover:bg-blue-500 text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              <span>Start Distribution</span>
            </button>
          )}
          {(stage === 'distribution_started' || stage === 'in_progress') && (
            <button
              disabled={busy}
              onClick={onUpdate}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition bg-emerald-500/80 hover:bg-emerald-500 text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Update Progress</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
const FoodAidMyAssignmentsPage = () => {
  const { isDarkMode } = useTheme()
  const { user } = useAuth()

  const [assignments, setAssignments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [busyId, setBusyId]           = useState(null)

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    setLoading(true)
    const unsubscribe = foodAidService.subscribeToVolunteerAssignments(user.id, list => {
      setAssignments(list)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [user?.id])

  const handleStart = async id => {
    try {
      setBusyId(id)
      await foodAidService.startDistribution(id)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleUpdateProgress = async (id, current) => {
    const val = prompt('Households served so far?', String(current || 0))
    if (val == null) return
    try {
      setBusyId(id)
      await foodAidService.updateHouseholdProgress(id, parseInt(val) || 0)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setBusyId(null)
    }
  }

  const card =
    'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all duration-300 hover:border-white/40 hover:shadow-blue-500/10'

  const activeAssignments = assignments.filter(a => !['completed', 'archived', 'cancelled'].includes(a.progress?.workflowStatus))
  const pastAssignments   = assignments.filter(a => ['completed', 'archived', 'cancelled'].includes(a.progress?.workflowStatus))

  return (
    <div className="min-h-screen relative">
      {/* Background — matches FoodAidPage's hero shell */}
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${isDarkMode
          ? 'bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-indigo-950/95'
          : 'bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-800/90'}`}
        />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      <div className="mx-auto max-w-4xl space-y-5 p-4 pb-24 sm:space-y-6 sm:p-6 lg:p-8">
        {/* Hero header */}
        <section className={`${card} overflow-hidden bg-gradient-to-r from-emerald-500/30 via-green-500/20 to-teal-500/30 p-5 sm:p-7`}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Truck className="h-3.5 w-3.5 text-yellow-300" />
            Volunteer Portal
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">My Community Assistance Assignments</h2>
          <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base">
            Track the distributions you've been assigned to and update progress in real time.
          </p>
        </section>

        {loading ? (
          <div className={`${card} p-10 text-center`}>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-300" />
            <p className="mt-3 text-sm text-white/60">Loading your assignments…</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className={`${card} p-8 text-center`}>
            <Package className="mx-auto mb-3 h-12 w-12 text-white/30" />
            <p className="mb-1 text-sm font-semibold text-white">No assignments yet</p>
            <p className="text-xs text-white/50">A barangay official will assign you to a food aid distribution when one comes up.</p>
          </div>
        ) : (
          <>
            {activeAssignments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-white/60">Active</h3>
                {activeAssignments.map(a => (
                  <AssignmentCard
                    key={a.id} dist={a} card={card} busy={busyId === a.id}
                    onStart={() => handleStart(a.id)}
                    onUpdate={() => handleUpdateProgress(a.id, a.progress?.householdsServed)}
                  />
                ))}
              </div>
            )}
            {pastAssignments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-white/60">Past</h3>
                {pastAssignments.map(a => <AssignmentCard key={a.id} dist={a} card={card} past />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default FoodAidMyAssignmentsPage