import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Package, MapPin, Navigation, AlertCircle, Clock, Users,
  TrendingUp, Loader2, XCircle, RefreshCw, Plus, Map, List,
  Sparkles, Truck, Star, AlertTriangle, Shield, UserPlus, Trash2, CheckCircle2, Download, Upload,
  Search, X, Calendar, ChevronRight
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import foodAidService, {
  WORKFLOW_LABELS, ASSISTANCE_TYPES, getAssistanceTypeLabel,
  BENEFICIARY_STATUSES, BENEFICIARY_STATUS_LABELS,
} from '../services/foodAidService'
import { exportBeneficiariesToCSV, exportBeneficiariesToExcel } from '../utils/beneficiaryExport'
import { readBeneficiaryFile } from '../utils/beneficiaryImport'
import adminService from '../services/adminService'
import LocationPicker from '../components/LocationPicker'
import BARANGAY_CONFIG from '../config/barangayConfig'
import { ilihanBoundary, ILIHAN_BOUNDS_LATLNG, ILIHAN_CENTER_LATLNG } from '../data/ilihanBoundary'
import {
  TOLEDO_BARANGAYS, PUROKS_LIST, PUROK_COORDS,
  getPositionAsync, detectNearestBarangay,
  haversineDistance, estimateTravelTime,
  generateAIRouteAnalysis, generatePinpointAIAnalysis, getRouteDescription, DISTRIBUTION_HUB
} from '../utils/locationUtils'

// Fix Leaflet default icons for Vite bundler
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const makeCircleIcon = (color, size = 18) =>
  L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  })

const USER_ICON = L.divIcon({
  html: '<div style="width:24px;height:24px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 5px rgba(59,130,246,0.3)"></div>',
  className: '',
  iconSize:   [24, 24],
  iconAnchor: [12, 12],
})

// Icons used in RouteModal two-pin map
const FROM_ICON = L.divIcon({
  html: '<div style="width:28px;height:28px;background:linear-gradient(135deg,#3b82f6,#2563eb);border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3),0 3px 10px rgba(59,130,246,0.4)"></div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})
const TO_ICON = L.divIcon({
  html: '<div style="width:28px;height:28px;background:linear-gradient(135deg,#10b981,#059669);border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(16,185,129,0.3),0 3px 10px rgba(16,185,129,0.4)"></div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const STATUS_COLORS = {
  scheduled:     '#3b82f6',
  'in-progress': '#eab308',
  completed:     '#10b981',
  pending:       '#f59e0b',
  rejected:      '#ef4444',
}

const PRIORITY_STYLES = {
  High:   { emoji: '🔴', cls: 'bg-red-500/15 text-red-300 border border-red-500/30' },
  Medium: { emoji: '🟡', cls: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  Low:    { emoji: '🟢', cls: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
}



function MapUpdater({ center }) {
  const map = useMap()
  useEffect(() => { if (center) map.setView(center, map.getZoom()) }, [center, map])
  return null
}

// Auto-fits map to show two route pins
function MapFitRoute({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions && positions.length >= 2) {
      map.fitBounds(positions, { padding: [36, 36] })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])
  return null
}

// ── Post Distribution Modal ──────────────────────────────────────────
// Single-barangay deployment: Barangay Ilihan is fixed, not selectable.
function PostDistributionModal({ isDarkMode, user, onClose, onSuccess }) {
  const [form, setForm] = useState({
    purok: '', date: '',
    timeSlot: 'Morning (8AM-10AM)', scheduleMode: 'preset',
    customStartTime: '08:00', customHours: '',
    totalFamilies: '', packageType: 'Mixed', description: '',
    assistanceType: 'Food Assistance', assistanceTypeOther: '',
  })
  const [aiAnalysis,      setAiAnalysis]      = useState(null)
  const [isPosting,       setIsPosting]       = useState(false)
  const [pinCoords,       setPinCoords]       = useState(null)
  const [customPurokMode, setCustomPurokMode] = useState(false)

  // ── Import Beneficiaries (staged locally, saved once the post is created) ──
  const [pendingBeneficiaries, setPendingBeneficiaries] = useState([]) // [{ localId, name, purok, assistanceType, assistanceTypeOther, remarks }]
  const [importFileName,       setImportFileName]       = useState('')
  const [importSkipped,        setImportSkipped]        = useState(0)
  const importFileInputRef = useRef(null)

  // Barangay is fixed to Ilihan for this deployment.
  const ilihanBarangay = TOLEDO_BARANGAYS.find(b => b.id === 'ilihan')

  // AI analysis fires whenever the pin, date, or purok changes.
  // Pin-first: uses the exact dropped pin when available, otherwise falls
  // back to Barangay Ilihan's default coordinates.
  useEffect(() => {
    if (pinCoords) {
      setAiAnalysis(generatePinpointAIAnalysis(pinCoords.lat, pinCoords.lng, ilihanBarangay, form.purok, form.date || null))
    } else if (ilihanBarangay) {
      setAiAnalysis(generateAIRouteAnalysis(ilihanBarangay, form.date || null))
    } else {
      setAiAnalysis(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinCoords, form.date, form.purok])

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  // ── Import Beneficiaries handlers ──────────────────────────────────────
  const makeLocalId = () => `pb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const handleImportFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const { rows, skipped } = await readBeneficiaryFile(file)
      if (rows.length === 0) { alert('No beneficiary rows were found. Make sure the file has a "Name" column.'); return }
      const staged = rows.map(r => ({
        localId: makeLocalId(),
        name: r.name,
        purok: r.purok || form.purok || '',
        assistanceType: ASSISTANCE_TYPES.includes(r.assistanceType) ? r.assistanceType : (r.assistanceType ? 'Others' : form.assistanceType),
        assistanceTypeOther: ASSISTANCE_TYPES.includes(r.assistanceType) ? '' : (r.assistanceType || (form.assistanceType === 'Others' ? form.assistanceTypeOther : '')),
        remarks: r.remarks || '',
      }))
      setPendingBeneficiaries(prev => [...prev, ...staged])
      setImportFileName(file.name)
      setImportSkipped(skipped)
    } catch (err) {
      alert(err.message)
    }
  }

  const addManualBeneficiaryRow = () => {
    setPendingBeneficiaries(prev => [...prev, {
      localId: makeLocalId(), name: '', purok: form.purok || '',
      assistanceType: form.assistanceType, assistanceTypeOther: '', remarks: '',
    }])
  }

  const updateBeneficiaryRow = (localId, key, val) => {
    setPendingBeneficiaries(prev => prev.map(r => r.localId === localId ? { ...r, [key]: val } : r))
  }

  const removeBeneficiaryRow = (localId) => {
    setPendingBeneficiaries(prev => prev.filter(r => r.localId !== localId))
  }

  // ── Time helpers for the custom-hours / whole-day schedule modes ──
  const formatTime12h = (t) => {
    if (!t) return ''
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}:${String(m).padStart(2, '0')}${period}`
  }

  const addHours = (t, hrs) => {
    const [h, m] = t.split(':').map(Number)
    const total = h * 60 + m + Math.round(hrs * 60)
    const wrapped = ((total % 1440) + 1440) % 1440
    const hh = String(Math.floor(wrapped / 60)).padStart(2, '0')
    const mm = String(wrapped % 60).padStart(2, '0')
    return `${hh}:${mm}`
  }

  const getFinalTimeSlot = () => {
    if (form.scheduleMode === 'wholeday') return 'Whole Day (7AM-5PM)'
    if (form.scheduleMode === 'custom') {
      const hrs = parseFloat(form.customHours)
      if (!hrs) return ''
      const end = addHours(form.customStartTime, hrs)
      return `Custom (${formatTime12h(form.customStartTime)}-${formatTime12h(end)}, ${hrs} hr${hrs === 1 ? '' : 's'})`
    }
    return form.timeSlot
  }

  const handleSubmit = async () => {
    const finalTimeSlot = getFinalTimeSlot()

    if (!form.purok || !form.date || !form.totalFamilies) {
      alert('Please fill in all required fields.')
      return
    }
    if (form.scheduleMode === 'custom') {
      const hrs = parseFloat(form.customHours)
      if (!hrs || hrs < 1 || hrs > 10) {
        alert('Custom hours must be between 1 and 10.')
        return
      }
    }
    const incompleteRow = pendingBeneficiaries.find(r => !r.name.trim())
    if (incompleteRow) {
      alert('Every beneficiary row needs a resident name — remove empty rows or fill them in.')
      return
    }

    const targetLat = pinCoords?.lat ?? ilihanBarangay?.lat
    const targetLng = pinCoords?.lng ?? ilihanBarangay?.lng

    try {
      setIsPosting(true)
      const posted = await foodAidService.postDistribution({
        barangay:            ilihanBarangay?.name ?? BARANGAY_CONFIG.barangayName,
        barangayId:          ilihanBarangay?.id   ?? 'ilihan',
        barangayLat:         targetLat,
        barangayLng:         targetLng,
        pinLat:              pinCoords?.lat ?? null,
        pinLng:              pinCoords?.lng ?? null,
        isPinpointed:        !!pinCoords,
        purok:               form.purok,
        date:                form.date,
        timeSlot:            finalTimeSlot,
        totalFamilies:       parseInt(form.totalFamilies),
        packageType:         form.packageType,
        description:         form.description,
        assistanceType:      form.assistanceType,
        assistanceTypeOther: form.assistanceType === 'Others' ? form.assistanceTypeOther.trim() : '',
        routeDistance:       aiAnalysis?.distanceKm,
        estimatedTravelTime: aiAnalysis?.travelTimeMin,
        terrain:             aiAnalysis?.terrain ?? ilihanBarangay?.terrain,
        efficiency:          aiAnalysis?.efficiency,
        createdByName:       user?.fullName,
        aiOptimized:         !!pinCoords,
      })

      // Beneficiaries staged during creation (imported file + manual rows) are
      // saved with the same importBeneficiaries() call the standalone
      // Beneficiary Manager uses, now targeting the distribution we just created.
      if (pendingBeneficiaries.length > 0) {
        await foodAidService.importBeneficiaries(
          posted.id,
          pendingBeneficiaries.map(r => ({
            name: r.name.trim(),
            purok: r.purok,
            assistanceType: r.assistanceType === 'Others' ? (r.assistanceTypeOther.trim() || 'Others') : r.assistanceType,
            remarks: r.remarks,
          })),
          form.assistanceType === 'Others' ? (form.assistanceTypeOther.trim() || 'Others') : form.assistanceType
        )
      }

      onSuccess()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setIsPosting(false)
    }
  }

  const inputBase = 'w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500'
  const inputCls  = inputBase + (isDarkMode
    ? ' bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500'
    : ' bg-white border-gray-300 text-gray-900 placeholder-gray-400')
  const labelCls  = 'block text-xs font-semibold mb-1.5 uppercase tracking-wide ' + (isDarkMode ? 'text-gray-400' : 'text-gray-500')
  const sectionCls = 'rounded-2xl p-4 sm:p-5 border space-y-3.5 ' + (isDarkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200')
  const stepNum    = (n, color) => `w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-${color}-500`

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={
        'relative w-full sm:max-w-2xl lg:max-w-4xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl ' +
        (isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white')
      }>
        {/* Header */}
        <div className={
          'sticky top-0 z-10 flex items-center justify-between p-4 sm:p-5 border-b rounded-t-3xl sm:rounded-t-2xl ' +
          (isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-white')
        }>
          <div className="flex items-center space-x-3">
            <div className={'w-9 h-9 rounded-xl flex items-center justify-center ' + (isDarkMode ? 'bg-green-900/50' : 'bg-green-50')}>
              <Package className={'w-4.5 h-4.5 ' + (isDarkMode ? 'text-green-400' : 'text-green-600')} />
            </div>
            <div>
              <h3 className={'font-bold text-base sm:text-lg ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>Create Community Assistance</h3>
              <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>Barangay Official · Pin-First AI Route Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className={'p-1.5 rounded-lg ' + (isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}>
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">

          {/* ── Step 1: Pinpoint Location ── */}
          <div className={sectionCls}>
            <div className="flex items-center space-x-2">
              <div className={stepNum(1, 'green')}>1</div>
            <div>
                <p className={'text-sm font-bold ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>Set Origin &amp; Destination Pins</p>
                <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>
                  🔵 <strong>Pin 1 (Origin)</strong> is auto-set to the Distribution Hub. 🟢 <strong>Pin 2 (Destination)</strong>: click the map or use GPS to pin the delivery location within Barangay Ilihan. The AI will analyze the best route.
                </p>
              </div>
            </div>

            <LocationPicker
                value={pinCoords}
                onChange={setPinCoords}
                isDarkMode={isDarkMode}
                originPin={DISTRIBUTION_HUB}
                originLabel="Distribution Hub (Barangay Hall)"
                boundaryGeoJSON={ilihanBoundary}
                boundaryBounds={ILIHAN_BOUNDS_LATLNG}
                lockCenter={ILIHAN_CENTER_LATLNG}
                lockZoom={{ initial: 16, min: 15, max: 19 }}
                boundaryLabel="Barangay Ilihan"
                outsideBoundaryMessage="Delivery location must be inside Barangay Ilihan."
              />

            {/* Pin confirmation - barangay is fixed to Ilihan */}
            {pinCoords && (
              <div className={'flex items-center space-x-2 text-xs px-3 py-2 rounded-xl ' + (isDarkMode ? 'bg-green-950/40 text-green-300' : 'bg-green-50 text-green-700')}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Delivery pin set within <strong>Barangay Ilihan</strong> ({ilihanBarangay?.terrain || 'hilly'} terrain)</span>
              </div>
            )}

            {/* Nudge when no pin yet */}
            {!pinCoords && (
              <div className={'flex items-center space-x-2 text-xs px-3 py-2 rounded-xl ' + (isDarkMode ? 'bg-blue-950/40 text-blue-300' : 'bg-blue-50 text-blue-700')}>
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Drop a pin above to get an instant AI route analysis for this location.</span>
              </div>
            )}
          </div>

          {/* ── Step 2: Area Details ── */}
          <div className={sectionCls}>
            <div className="flex items-center space-x-2 mb-1">
              <div className={stepNum(2, 'blue')}>2</div>
              <p className={'text-sm font-bold ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>Distribution Area</p>
            </div>

            {/* Barangay – fixed to Barangay Ilihan (single-barangay deployment) */}
            <div>
              <label className={labelCls}>Barangay</label>
              <div className={
                'w-full px-3 py-2.5 rounded-xl border text-sm flex items-center space-x-2 ' +
                (isDarkMode ? 'bg-gray-800/60 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600')
              }>
                <MapPin className="w-4 h-4 flex-shrink-0 opacity-70" />
                <span className="font-medium">{BARANGAY_CONFIG.fullBarangayName}</span>
                <span className={'text-xs ml-auto ' + (isDarkMode ? 'text-gray-500' : 'text-gray-400')}>Fixed</span>
              </div>
            </div>

            {/* Purok with custom toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls + ' mb-0'}>Purok / Zone *</label>
                <button
                  type="button"
                  onClick={() => { setCustomPurokMode(m => !m); set('purok', '') }}
                  className={'text-xs font-medium px-2.5 py-1 rounded-lg transition ' + (isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600')}
                >
                  {customPurokMode ? '↩ Use Dropdown' : '✎ Custom Purok'}
                </button>
              </div>
              {customPurokMode ? (
                <input
                  type="text"
                  value={form.purok}
                  onChange={e => set('purok', e.target.value)}
                  placeholder="e.g. Sitio Tagaytay, Upper Zone, Zone A…"
                  className={inputCls}
                />
              ) : (
                <select value={form.purok} onChange={e => set('purok', e.target.value)} className={inputCls}>
                  <option value="">Select Purok…</option>
                  {PUROKS_LIST.map(p => <option key={p}>{p}</option>)}
                </select>
              )}
            </div>

            {/* Community Assistance Type */}
            <div>
              <label className={labelCls}>Community Assistance Type</label>
              <select value={form.assistanceType} onChange={e => set('assistanceType', e.target.value)} className={inputCls}>
                {ASSISTANCE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              {form.assistanceType === 'Others' && (
                <input type="text" placeholder="Specify assistance type…" value={form.assistanceTypeOther}
                  onChange={e => set('assistanceTypeOther', e.target.value)} className={inputCls + ' mt-2'} />
              )}
            </div>

            {/* Package Type */}
            <div>
              <label className={labelCls}>Package Type</label>
              <select value={form.packageType} onChange={e => set('packageType', e.target.value)} className={inputCls}>
                {['Mixed', 'Rice', 'Canned Goods', 'Vegetables', 'Full Pack'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* ── Step 3: Import Beneficiaries ── */}
          <div className={sectionCls}>
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-amber-500">3</div>
              <div>
                <p className={'text-sm font-bold ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>Import Beneficiaries</p>
                <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>Optional — bring in a beneficiary list now, or add them later from the post.</p>
              </div>
            </div>

            <input ref={importFileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImportFileChange} className="hidden" />
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={() => importFileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition">
                <Upload className="w-4 h-4" />
                <span>Import CSV / Excel…</span>
              </button>
              <button type="button" onClick={addManualBeneficiaryRow}
                className={'flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-semibold transition border ' +
                  (isDarkMode ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100')}>
                <UserPlus className="w-4 h-4" />
                <span>Add Beneficiary Manually</span>
              </button>
            </div>

            {importFileName && (
              <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>
                Loaded <strong>{importFileName}</strong> — {pendingBeneficiaries.length} row{pendingBeneficiaries.length === 1 ? '' : 's'} staged
                {importSkipped > 0 && ` (${importSkipped} skipped — missing name)`}
              </p>
            )}

            {/* Preview table — editable, removable, scrolls if long */}
            {pendingBeneficiaries.length > 0 && (
              <div className={'rounded-xl border overflow-hidden ' + (isDarkMode ? 'border-gray-700' : 'border-gray-200')}>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className={'sticky top-0 ' + (isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500')}>
                      <tr>
                        <th className="text-left font-semibold px-2 py-2">Resident Name</th>
                        <th className="text-left font-semibold px-2 py-2">Purok</th>
                        <th className="text-left font-semibold px-2 py-2">Remarks</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className={'divide-y ' + (isDarkMode ? 'divide-gray-800' : 'divide-gray-100')}>
                      {pendingBeneficiaries.map(row => (
                        <tr key={row.localId}>
                          <td className="px-2 py-1.5">
                            <input value={row.name} onChange={e => updateBeneficiaryRow(row.localId, 'name', e.target.value)}
                              placeholder="Resident name…"
                              className={'w-full bg-transparent px-1.5 py-1 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-green-500 ' +
                                (isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-800')} />
                          </td>
                          <td className="px-2 py-1.5">
                            <select value={row.purok} onChange={e => updateBeneficiaryRow(row.localId, 'purok', e.target.value)}
                              className={'w-full bg-transparent px-1.5 py-1 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-green-500 ' +
                                (isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-800')}>
                              <option value="">—</option>
                              {PUROKS_LIST.map(p => <option key={p}>{p}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input value={row.remarks} onChange={e => updateBeneficiaryRow(row.localId, 'remarks', e.target.value)}
                              placeholder="Notes…"
                              className={'w-full bg-transparent px-1.5 py-1 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-green-500 ' +
                                (isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-800')} />
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <button type="button" onClick={() => removeBeneficiaryRow(row.localId)}
                              className={'p-1 rounded ' + (isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500')}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={'px-3 py-2 text-xs border-t ' + (isDarkMode ? 'border-gray-700 text-gray-500 bg-gray-900/60' : 'border-gray-200 text-gray-500 bg-gray-50')}>
                  Rows without their own assistance type will use <strong>{form.assistanceType === 'Others' ? (form.assistanceTypeOther || 'Others') : form.assistanceType}</strong> by default.
                </div>
              </div>
            )}
          </div>

          {/* ── Step 4: Schedule ── */}
          <div className={sectionCls}>
            <div className="flex items-center space-x-2 mb-1">
              <div className={stepNum(4, 'purple')}>4</div>
              <p className={'text-sm font-bold ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>Schedule & Capacity</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date *</label>
                <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
                  onChange={e => set('date', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Total Families to Serve *</label>
                <input type="number" value={form.totalFamilies} min="1" placeholder="e.g. 50"
                  onChange={e => set('totalFamilies', e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Duration</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[
                  { key: 'preset',   label: 'Time Slot' },
                  { key: 'wholeday', label: 'Whole Day' },
                  { key: 'custom',   label: 'Custom Hours' },
                ].map(m => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => set('scheduleMode', m.key)}
                    className={
                      'px-2 py-2 rounded-lg text-xs font-semibold transition border ' +
                      (form.scheduleMode === m.key
                        ? 'bg-green-500 text-white border-green-500'
                        : (isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-300 text-gray-600'))
                    }
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {form.scheduleMode === 'preset' && (
                <select value={form.timeSlot} onChange={e => set('timeSlot', e.target.value)} className={inputCls}>
                  {['Early Morning (7AM-9AM)', 'Morning (8AM-10AM)', 'Late Morning (10AM-12PM)', 'Afternoon (2PM-4PM)'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              )}

              {form.scheduleMode === 'wholeday' && (
                <div className={'flex items-center space-x-2 text-xs px-3 py-2.5 rounded-xl border ' + (isDarkMode ? 'bg-gray-800/60 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200')}>
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Distribution runs the whole day: <strong>7:00 AM – 5:00 PM</strong></span>
                </div>
              )}

              {form.scheduleMode === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Start Time</label>
                    <input type="time" value={form.customStartTime}
                      onChange={e => set('customStartTime', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Hours (1-10)</label>
                    <input type="number" min="1" max="10" step="0.5" placeholder="e.g. 4"
                      value={form.customHours}
                      onChange={e => set('customHours', e.target.value)} className={inputCls} />
                  </div>
                  {form.customHours >= 1 && form.customHours <= 10 && (
                    <p className={'col-span-2 text-xs ' + (isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                      Runs {formatTime12h(form.customStartTime)} – {formatTime12h(addHours(form.customStartTime, parseFloat(form.customHours)))} ({form.customHours} hr{parseFloat(form.customHours) === 1 ? '' : 's'})
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className={labelCls}>Additional Notes (optional)</label>
              <textarea value={form.description} rows="2" placeholder="Special instructions…"
                onChange={e => set('description', e.target.value)} className={inputCls + ' resize-none'} />
            </div>
          </div>

          {/* ── AI Route Analysis – triggers on pin OR default Ilihan coords ── */}
          {aiAnalysis && (
            <div className={
              'rounded-2xl p-4 border ' +
              (isDarkMode ? 'bg-green-950/30 border-green-800/50' : 'bg-green-50 border-green-200')
            }>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className={'w-4 h-4 ' + (isDarkMode ? 'text-green-400' : 'text-green-600')} />
                  <span className={'text-sm font-bold ' + (isDarkMode ? 'text-green-300' : 'text-green-700')}>AI Route Analysis</span>
                  {aiAnalysis.isPinpointed && (
                    <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (isDarkMode ? 'bg-blue-900/60 text-blue-300' : 'bg-blue-100 text-blue-700')}>
                      📍 Pinpointed
                    </span>
                  )}
                </div>
                <span className={
                  'text-xs font-bold px-2.5 py-1 rounded-full ' +
                  (aiAnalysis.efficiency >= 85 ? 'bg-green-200 text-green-800'
                   : aiAnalysis.efficiency >= 70 ? 'bg-yellow-200 text-yellow-800'
                   : 'bg-red-200 text-red-800')
                }>
                  {aiAnalysis.efficiency}% Efficient
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { Icon: MapPin, text: aiAnalysis.distanceKm + ' km from hub' },
                  { Icon: Clock,  text: '~' + aiAnalysis.travelTimeMin + ' min travel' },
                  { Icon: Truck,  text: aiAnalysis.terrain + ' terrain' },
                  { Icon: Shield, text: 'Depart ' + aiAnalysis.recommendedDeparture },
                ].map(({ Icon, text }) => (
                  <div key={text} className={'flex items-center space-x-1.5 text-xs capitalize ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <p className={'text-xs leading-relaxed mb-2 ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                {aiAnalysis.routeDescription}
              </p>

              {aiAnalysis.risks.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {aiAnalysis.risks.map((r, i) => (
                    <div key={i} className={
                      'flex items-start space-x-1.5 text-xs ' +
                      (r.severity === 'high'   ? (isDarkMode ? 'text-red-400'    : 'text-red-700')
                     : r.severity === 'medium' ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-700')
                     :                           (isDarkMode ? 'text-blue-400'   : 'text-blue-700'))
                    }>
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{r.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Resident notification note */}
              <div className={'mt-3 flex items-start space-x-1.5 text-xs pt-3 border-t ' + (isDarkMode ? 'border-green-800/40 text-green-400' : 'border-green-200 text-green-700')}>
                <Users className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Residents in <strong>{form.purok || 'the selected area'}</strong> will be notified automatically when you post.</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={isPosting}
            className={
              'w-full py-3 rounded-xl font-bold text-white transition flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ' +
              (isDarkMode ? 'bg-green-700 hover:bg-green-600' : 'bg-green-500 hover:bg-green-600')
            }
          >
            {isPosting
              ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Posting & Notifying Residents…</span></>
              : <><Plus className="w-4 h-4" /><span>Post Distribution & Notify Residents</span></>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AI Route Info Modal ──────────────────────────────────────────────────────
function RouteModal({ dist, userCoords, userBarangay, isDarkMode, onClose }) {
  const fromLat  = userCoords?.lat ?? DISTRIBUTION_HUB.lat
  const fromLng  = userCoords?.lng ?? DISTRIBUTION_HUB.lng
  const fromName = userBarangay?.name ?? DISTRIBUTION_HUB.name

  const toLat  = dist.barangayLat ?? 10.3737
  const toLng  = dist.barangayLng ?? 123.6384
  const toName = dist.barangay
    ? (dist.barangay + (dist.purok ? ' · ' + dist.purok : ''))
    : (dist.purok || 'Unknown Location')

  const distKm     = haversineDistance(fromLat, fromLng, toLat, toLng)
  const targetB    = TOLEDO_BARANGAYS.find(b => b.name === dist.barangay)
  const travelTime = estimateTravelTime(distKm, targetB?.terrain || 'flat')
  const routeDesc  = targetB
    ? getRouteDescription(fromName, targetB)
    : 'Head towards ' + toName + ', approximately ' + distKm.toFixed(1) + ' km away.'

  const mapsUrl = 'https://www.google.com/maps/dir/' + fromLat + ',' + fromLng + '/' + toLat + ',' + toLng

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={
        'relative w-full max-w-sm rounded-2xl shadow-2xl p-5 ' +
        (isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white')
      }>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className={'w-5 h-5 ' + (isDarkMode ? 'text-green-400' : 'text-green-600')} />
            <h3 className={'font-bold ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>AI Route Guide</h3>
          </div>
          <button onClick={onClose} className={'p-1 rounded-lg ' + (isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}>
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* ── Two-Pin Route Map ── */}
        <div
          className={'mb-3 rounded-xl overflow-hidden border ' + (isDarkMode ? 'border-gray-700' : 'border-gray-200')}
          style={{ height: 190 }}
        >
          <MapContainer
            center={[(fromLat + toLat) / 2, (fromLng + toLng) / 2]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            <MapFitRoute positions={[[fromLat, fromLng], [toLat, toLng]]} />
            <Marker position={[fromLat, fromLng]} icon={FROM_ICON} />
            <Marker position={[toLat, toLng]}     icon={TO_ICON}   />
            <Polyline
              positions={[[fromLat, fromLng], [toLat, toLng]]}
              color="#3b82f6"
              weight={3}
              dashArray="10, 8"
              opacity={0.85}
            />
          </MapContainer>
        </div>

        {/* Map pin legend */}
        <div className={'flex items-center gap-5 mb-4 px-1 text-xs ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow flex-shrink-0" />
            <span><strong>Pin 1 (Origin):</strong> {fromName}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500 border border-white shadow flex-shrink-0" />
            <span><strong>Pin 2 (Dest):</strong> {toName.split('·')[0].trim()}</span>
          </div>
        </div>

        {/* From → To */}
        <div className={'rounded-xl p-3 mb-4 ' + (isDarkMode ? 'bg-gray-800' : 'bg-gray-50')}>
          <div className="flex items-center space-x-2 mb-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
            <span className={'text-sm font-medium ' + (isDarkMode ? 'text-gray-200' : 'text-gray-800')}>
              {fromName}{userCoords ? ' (Your Location)' : ''}
            </span>
          </div>
          <div className="ml-1.5 h-4 border-l-2 border-dashed border-gray-400" />
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
            <span className={'text-sm font-medium ' + (isDarkMode ? 'text-gray-200' : 'text-gray-800')}>{toName}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={'rounded-xl p-3 text-center ' + (isDarkMode ? 'bg-gray-800' : 'bg-blue-50')}>
            <p className={'text-2xl font-bold ' + (isDarkMode ? 'text-blue-400' : 'text-blue-600')}>{distKm.toFixed(1)}</p>
            <p className={'text-xs ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Kilometers</p>
          </div>
          <div className={'rounded-xl p-3 text-center ' + (isDarkMode ? 'bg-gray-800' : 'bg-green-50')}>
            <p className={'text-2xl font-bold ' + (isDarkMode ? 'text-green-400' : 'text-green-600')}>{travelTime}</p>
            <p className={'text-xs ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Est. Minutes</p>
          </div>
        </div>

        {targetB && (
          <div className={'flex items-center space-x-2 mb-3 ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
            <Truck className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs capitalize">{targetB.terrain} terrain · {targetB.accessibility} accessibility</span>
          </div>
        )}

        <p className={'text-xs leading-relaxed mb-4 ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>{routeDesc}</p>

        {/* Distribution details */}
        <div className={'rounded-xl p-3 mb-4 space-y-1.5 ' + (isDarkMode ? 'bg-gray-800' : 'bg-gray-50')}>
          <p className={'text-xs font-semibold mb-1 ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Distribution Details</p>
          <p className={'text-xs ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>📅 {dist.date} · {dist.timeSlot || 'Morning'}</p>
          <p className={'text-xs ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>👨‍👩‍👧 {dist.totalFamilies} families</p>
          {dist.packageType && <p className={'text-xs ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>📦 {dist.packageType}</p>}
          {dist.isPinpointed && (
            <p className={'text-xs font-semibold ' + (isDarkMode ? 'text-blue-400' : 'text-blue-600')}>
              📍 Exact pinpoint location set by official
            </p>
          )}
          {/* Delivery progress */}
          {dist.totalFamilies > 0 && (
            <div className="pt-2">
              <div className={'flex justify-between text-xs mb-1 ' + (isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                <span>Progress</span>
                <span className="font-semibold">{dist.deliveredFamilies || 0}/{dist.totalFamilies} families</span>
              </div>
              <div className={'w-full h-1.5 rounded-full ' + (isDarkMode ? 'bg-gray-700' : 'bg-gray-200')}>
                <div
                  className="h-1.5 rounded-full bg-green-500"
                  style={{ width: `${Math.min(100, Math.round(((dist.deliveredFamilies || 0) / dist.totalFamilies) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className={
            'block w-full py-2.5 rounded-xl text-center font-semibold text-sm text-white transition shadow-md ' +
            (isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600')
          }
        >
          🗺 Open in Google Maps
        </a>
      </div>
    </div>
  )
}

  

// ── Main Page ────────────────────────────────────────────────────────────────
// ── Admin: Assign Volunteer Modal ──────────────────────────────────────────────────────────
const VOLUNTEER_ROLE_OPTIONS = [
  { value: 'bhw',               label: 'BHW' },
  { value: 'resident',          label: 'Resident' },
  { value: 'barangay_official', label: 'Barangay Official' },
  { value: 'custom',            label: '+ Add Custom' },
]

function AssignVolunteerModal({ isDarkMode, onClose, onAssign }) {
  const [roleFilter,     setRoleFilter]     = useState('bhw')
  const [users,          setUsers]          = useState([])
  const [loadingUsers,   setLoadingUsers]   = useState(true)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [customName,     setCustomName]     = useState('')
  const [submitting,     setSubmitting]     = useState(false)

  useEffect(() => {
    adminService.getAllUsers()
      .then(all => setUsers(all))
      .finally(() => setLoadingUsers(false))
  }, [])

  const filteredUsers = users.filter(u => u.role === roleFilter)

  const handleRoleChange = val => {
    setRoleFilter(val)
    setSelectedUserId('')
    setCustomName('')
  }

  const handleSubmit = async () => {
    let volunteer = null
    if (roleFilter === 'custom') {
      if (!customName.trim()) { alert('Please enter a name.'); return }
      volunteer = { id: 'custom_' + Date.now(), name: customName.trim() }
    } else {
      const u = filteredUsers.find(u => u.id === selectedUserId)
      if (!u) { alert('Please select a volunteer from the list.'); return }
      volunteer = { id: u.id, name: u.fullName || u.name || u.email || 'Unnamed' }
    }
    try {
      setSubmitting(true)
      await onAssign(volunteer)
      onClose()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ' +
    (isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-900')
  const labelCls = 'block text-xs font-semibold mb-1.5 uppercase tracking-wide ' + (isDarkMode ? 'text-gray-400' : 'text-gray-500')

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={
        'relative w-full sm:max-w-sm max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 ' +
        (isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white')
      }>
        <div className="flex items-center justify-between mb-4">
          <h3 className={'font-bold text-base ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>Assign Volunteer</h3>
          <button onClick={onClose} className={'p-1.5 rounded-lg ' + (isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}>
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={labelCls}>Volunteer Type</label>
            <select value={roleFilter} onChange={e => handleRoleChange(e.target.value)} className={inputCls}>
              {VOLUNTEER_ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {roleFilter === 'custom' ? (
            <div>
              <label className={labelCls}>Custom Volunteer Name</label>
              <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                placeholder="e.g. Juan Dela Cruz (community volunteer)" className={inputCls} />
              <p className={'text-xs mt-1.5 ' + (isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
                Use this for volunteers who don't have a SmartCo account.
              </p>
            </div>
          ) : (
            <div>
              <label className={labelCls}>Select {VOLUNTEER_ROLE_OPTIONS.find(o => o.value === roleFilter)?.label}</label>
              {loadingUsers ? (
                <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-400')}>Loading users…</p>
              ) : filteredUsers.length === 0 ? (
                <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
                  No {VOLUNTEER_ROLE_OPTIONS.find(o => o.value === roleFilter)?.label} accounts found. Try "+ Add Custom" instead.
                </p>
              ) : (
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className={inputCls}>
                  <option value="">Select…</option>
                  {filteredUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName || u.name || u.email || u.id}{u.purok ? ` · ${u.purok}` : ''}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting}
            className={
              'w-full py-3 rounded-xl font-bold text-white transition flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 ' +
              (isDarkMode ? 'bg-green-700 hover:bg-green-600' : 'bg-green-500 hover:bg-green-600')
            }>
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Assigning…</span></> : <span>Assign Volunteer</span>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Admin: Workflow Actions (Approve → AI Schedule → Assign Volunteer → Start → Progress → Archive) ──
function FoodAidWorkflowActions({ dist }) {
  const { isDarkMode: isDarkModeCtx } = useTheme()
  const [busy, setBusy] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const stage = dist.progress?.workflowStatus || 'approved'
  const btnCls = 'text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/80 hover:bg-blue-500 text-white transition disabled:opacity-50'

  const run = async (fn) => {
    try {
      setBusy(true)
      await fn()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setBusy(false)
    }
  }
  // Real-time listener on the page refreshes the card automatically after each action.

  if (stage === 'pending_approval')
    return <button disabled={busy} onClick={() => run(() => foodAidService.approveDistribution(dist.id))} className={btnCls}>✓ Approve</button>

  if (stage === 'approved')
    return <button disabled={busy} onClick={() => run(() => foodAidService.generateAISchedule(dist.id))} className={btnCls}>✨ Generate AI Schedule</button>

  if (stage === 'ai_scheduled')
    return (
      <>
        <button disabled={busy} onClick={() => setShowAssignModal(true)} className={btnCls}>🧑‍🤝‍🧑 Assign Volunteer</button>
        {showAssignModal && (
          <AssignVolunteerModal
            isDarkMode={isDarkModeCtx}
            onClose={() => setShowAssignModal(false)}
            onAssign={volunteer => run(() => foodAidService.assignVolunteer(dist.id, volunteer))}
          />
        )}
      </>
    )

  if (stage === 'volunteer_assigned')
    return <button disabled={busy} onClick={() => run(() => foodAidService.startDistribution(dist.id))} className={btnCls}>🚚 Start Distribution</button>

  if (stage === 'distribution_started' || stage === 'in_progress')
    return <button disabled={busy} onClick={() => {
      const val = prompt('Households served so far?', String(dist.progress?.householdsServed || 0))
      if (val == null) return
      run(() => foodAidService.updateHouseholdProgress(dist.id, parseInt(val) || 0))
    }} className={btnCls}>📋 Update Progress</button>

  if (stage === 'completed')
    return <button disabled={busy} onClick={() => run(() => foodAidService.archiveDistribution(dist.id))} className={btnCls}>🗄 Archive</button>

  return null
}

// ── Export Beneficiaries Modal ──────────────────────────────────────────
// Scope is computed from the already-subscribed `distributions` list, so no
// extra Firestore reads are needed for "All" / "Per Purok" / "Per Schedule".
function ExportBeneficiariesModal({ distributions, isDarkMode, onClose }) {
  const [scope, setScope] = useState('all')       // all | purok | schedule
  const [purok, setPurok]   = useState(PUROKS_LIST[0] || '')
  const [scheduleId, setScheduleId] = useState(distributions[0]?.id || '')

  const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-500'
  const inputCls  = inputBase + (isDarkMode
    ? ' bg-gray-800 border-gray-700 text-gray-200'
    : ' bg-white border-gray-300 text-gray-900')
  const labelCls  = 'block text-xs font-semibold mb-1 uppercase tracking-wide ' + (isDarkMode ? 'text-gray-400' : 'text-gray-500')

  const getBeneficiaries = () => {
    if (scope === 'purok') {
      return distributions.filter(d => d.purok === purok).flatMap(d => d.beneficiaries || [])
    }
    if (scope === 'schedule') {
      const dist = distributions.find(d => d.id === scheduleId)
      return dist?.beneficiaries || []
    }
    return distributions.flatMap(d => d.beneficiaries || [])
  }

  const filenameSuffix = scope === 'purok' ? purok.replace(/\s+/g, '_')
    : scope === 'schedule' ? (distributions.find(d => d.id === scheduleId)?.date || scheduleId)
    : 'all'

  const handleExport = (format) => {
    const beneficiaries = getBeneficiaries()
    if (beneficiaries.length === 0) { alert('No beneficiaries found for this scope.'); return }
    if (format === 'csv') exportBeneficiariesToCSV(beneficiaries, `beneficiaries_${filenameSuffix}.csv`)
    else exportBeneficiariesToExcel(beneficiaries, `beneficiaries_${filenameSuffix}.xlsx`)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={'relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-4 space-y-4 ' +
        (isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white')}>
        <div className="flex items-center justify-between">
          <h3 className={'font-bold text-base ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>Export Beneficiaries</h3>
          <button onClick={onClose} className={'p-1.5 rounded-lg ' + (isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}>
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className={labelCls}>Scope</label>
          <select value={scope} onChange={e => setScope(e.target.value)} className={inputCls}>
            <option value="all">All Beneficiaries</option>
            <option value="purok">Per Purok</option>
            <option value="schedule">Per Assistance Schedule</option>
          </select>
        </div>

        {scope === 'purok' && (
          <div>
            <label className={labelCls}>Purok</label>
            <select value={purok} onChange={e => setPurok(e.target.value)} className={inputCls}>
              {PUROKS_LIST.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        )}

        {scope === 'schedule' && (
          <div>
            <label className={labelCls}>Schedule</label>
            <select value={scheduleId} onChange={e => setScheduleId(e.target.value)} className={inputCls}>
              {distributions.map(d => (
                <option key={d.id} value={d.id}>{d.purok} · {d.date} · {getAssistanceTypeLabel(d)}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={() => handleExport('csv')}
            className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition">
            <Download className="w-4 h-4" /><span>CSV</span>
          </button>
          <button onClick={() => handleExport('excel')}
            className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition">
            <Download className="w-4 h-4" /><span>Excel</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Beneficiary Manager Modal ───────────────────────────────────────────
// `dist` is passed in live from the parent's subscribeToFoodAid() list, so
// this modal re-renders automatically as beneficiaries are added/updated.
function BeneficiaryManagerModal({ dist, isDarkMode, onClose, readOnly }) {
  const [form, setForm] = useState({ name: '', purok: dist.purok || '', assistanceType: dist.assistanceType || 'Food Assistance', assistanceTypeOther: '', remarks: '' })
  const [busy, setBusy] = useState(false)
  const [showManualAdd, setShowManualAdd] = useState(false)
  const [importPreview, setImportPreview] = useState(null) // { rows, fileName, skipped }
  const [importDefaultType, setImportDefaultType] = useState(dist.assistanceType || 'Food Assistance')
  const [importDefaultOther, setImportDefaultOther] = useState('')
  const [importBusy, setImportBusy] = useState(false)
  const fileInputRef = useRef(null)
  const beneficiaries = dist.beneficiaries || []
  const [searchQuery, setSearchQuery] = useState('')
  const filteredBeneficiaries = searchQuery.trim()
    ? beneficiaries.filter(b => (b.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : beneficiaries

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-500'
  const inputCls  = inputBase + (isDarkMode
    ? ' bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500'
    : ' bg-white border-gray-300 text-gray-900 placeholder-gray-400')
  const labelCls  = 'block text-xs font-semibold mb-1 uppercase tracking-wide ' + (isDarkMode ? 'text-gray-400' : 'text-gray-500')

  const STATUS_CLS = {
    pending:   'bg-amber-500/15 text-amber-500 border border-amber-500/30',
    scheduled: 'bg-blue-500/15 text-blue-500 border border-blue-500/30',
    received:  'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
    completed: 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // lets the same file be re-selected later if needed
    if (!file) return
    try {
      const { rows, skipped } = await readBeneficiaryFile(file)
      if (rows.length === 0) { alert('No beneficiary rows were found. Make sure the file has a "Name" column.'); return }
      setImportPreview({ rows, fileName: file.name, skipped })
    } catch (err) {
      alert(err.message)
    }
  }

  const handleConfirmImport = async () => {
    if (!importPreview) return
    if (importDefaultType === 'Others' && !importDefaultOther.trim()) {
      alert('Please specify the default assistance type.'); return
    }
    try {
      setImportBusy(true)
      const resolvedDefault = importDefaultType === 'Others' ? importDefaultOther.trim() : importDefaultType
      await foodAidService.importBeneficiaries(dist.id, importPreview.rows, resolvedDefault)
      setImportPreview(null)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setImportBusy(false)
    }
  }

  const handleAdd = async () => {
    if (!form.name.trim()) { alert('Resident name is required.'); return }
    if (form.assistanceType === 'Others' && !form.assistanceTypeOther.trim()) {
      alert('Please specify the assistance type.'); return
    }
    try {
      setBusy(true)
      await foodAidService.addBeneficiary(dist.id, form)
      setForm({ name: '', purok: dist.purok || '', assistanceType: dist.assistanceType || 'Food Assistance', assistanceTypeOther: '', remarks: '' })
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (id) => {
    if (!confirm('Remove this beneficiary?')) return
    try { await foodAidService.removeBeneficiary(dist.id, id) }
    catch (err) { alert('Error: ' + err.message) }
  }

  const handleStatus = async (id, status) => {
    try { await foodAidService.updateBeneficiaryStatus(dist.id, id, status) }
    catch (err) { alert('Error: ' + err.message) }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={
        'relative w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl ' +
        (isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white')
      }>
        {/* Sticky header + search — combined into one sticky block so both stay pinned while scrolling */}
        <div className={
          'sticky top-0 z-10 border-b rounded-t-3xl sm:rounded-t-2xl ' +
          (isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-white')
        }>
          <div className="flex items-center justify-between p-4 pb-3">
            <div>
              <h3 className={'font-bold text-base ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>
                {readOnly ? 'Beneficiaries' : 'Beneficiary Management'}
              </h3>
              <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>
                {dist.barangay ? dist.barangay + ' · ' : ''}{dist.purok || 'Unspecified Purok'} · {dist.date}
              </p>
            </div>
            <button onClick={onClose} className={'p-1.5 rounded-lg flex-shrink-0 ' + (isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}>
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          {beneficiaries.length > 0 && (
            <div className="px-4 pb-3">
              <div className={'flex items-center gap-2 px-3 py-2 rounded-xl border ' +
                (isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200')}>
                <Search className={'w-4 h-4 flex-shrink-0 ' + (isDarkMode ? 'text-gray-500' : 'text-gray-400')} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search Resident…"
                  className={'flex-1 bg-transparent text-sm focus:outline-none ' + (isDarkMode ? 'text-gray-200 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400')}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className={isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          {!readOnly && (
            <>
              {/* Import from CSV/Excel — primary way to bring in beneficiaries */}
              <div className={'rounded-2xl p-4 border space-y-3 ' + (isDarkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200')}>
                <p className={'text-sm font-bold ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>Import Beneficiaries</p>
                <p className={'text-xs ' + (isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                  Upload a CSV or Excel file with a <strong>Name</strong> column (Purok, Assistance Type, and Remarks columns are optional).
                </p>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition">
                  <Upload className="w-4 h-4" />
                  <span>Choose CSV / Excel File…</span>
                </button>

                {importPreview && (
                  <div className={'rounded-xl border p-3 space-y-3 ' + (isDarkMode ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-white')}>
                    <div className="flex items-center justify-between">
                      <p className={'text-xs font-semibold ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
                        {importPreview.fileName} — {importPreview.rows.length} row{importPreview.rows.length === 1 ? '' : 's'} ready
                        {importPreview.skipped > 0 && ` (${importPreview.skipped} skipped — missing name)`}
                      </p>
                      <button onClick={() => setImportPreview(null)} className={isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}>
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto rounded-lg border divide-y text-xs "
                      style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                      {importPreview.rows.slice(0, 50).map((r, i) => (
                        <div key={i} className={'px-2 py-1.5 flex justify-between gap-2 ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
                          <span className="truncate">{r.name}</span>
                          <span className={'flex-shrink-0 ' + (isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
                            {r.purok || '—'} {r.assistanceType ? `· ${r.assistanceType}` : ''}
                          </span>
                        </div>
                      ))}
                      {importPreview.rows.length > 50 && (
                        <p className={'px-2 py-1.5 italic ' + (isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
                          + {importPreview.rows.length - 50} more…
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={labelCls}>Default Assistance Type <span className="normal-case font-normal">(used for rows without their own type)</span></label>
                      <select value={importDefaultType} onChange={e => setImportDefaultType(e.target.value)} className={inputCls}>
                        {ASSISTANCE_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      {importDefaultType === 'Others' && (
                        <input type="text" placeholder="Specify assistance type…" value={importDefaultOther}
                          onChange={e => setImportDefaultOther(e.target.value)} className={inputCls + ' mt-2'} />
                      )}
                    </div>

                    <button disabled={importBusy} onClick={handleConfirmImport}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-500 hover:bg-green-600 transition disabled:opacity-50">
                      {importBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>Import {importPreview.rows.length} Beneficiar{importPreview.rows.length === 1 ? 'y' : 'ies'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Manual single add — kept as a fallback for one-off corrections */}
              <button onClick={() => setShowManualAdd(v => !v)}
                className={'text-xs font-semibold ' + (isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}>
                {showManualAdd ? '− Hide manual add' : '+ Add one beneficiary manually'}
              </button>

              {showManualAdd && (
                <div className={'rounded-2xl p-4 border space-y-3 ' + (isDarkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200')}>
                  <div>
                    <label className={labelCls}>Resident Name *</label>
                    <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="e.g. Juan Dela Cruz" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Purok</label>
                      <select value={form.purok} onChange={e => set('purok', e.target.value)} className={inputCls}>
                        <option value="">Select Purok…</option>
                        {PUROKS_LIST.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Assistance Type</label>
                      <select value={form.assistanceType} onChange={e => set('assistanceType', e.target.value)} className={inputCls}>
                        {ASSISTANCE_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  {form.assistanceType === 'Others' && (
                    <input type="text" placeholder="Specify assistance type…" value={form.assistanceTypeOther}
                      onChange={e => set('assistanceTypeOther', e.target.value)} className={inputCls} />
                  )}
                  <div>
                    <label className={labelCls}>Remarks (optional)</label>
                    <input type="text" value={form.remarks} onChange={e => set('remarks', e.target.value)} className={inputCls} placeholder="Notes…" />
                  </div>
                  <button disabled={busy} onClick={handleAdd}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-500 hover:bg-green-600 transition disabled:opacity-50">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    <span>Add Beneficiary</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Beneficiary list — visible to everyone; export/download always available */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className={'text-sm font-bold ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>
                Beneficiaries ({filteredBeneficiaries.length}{searchQuery ? ` of ${beneficiaries.length}` : ''})
              </p>
              {beneficiaries.length > 0 && (
                <div className="flex gap-1.5">
                  <button onClick={() => exportBeneficiariesToCSV(beneficiaries, `beneficiaries_${dist.purok}_${dist.date}.csv`)}
                    className={'flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-lg ' + (isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600')}>
                    <Download className="w-3 h-3" /><span>CSV</span>
                  </button>
                  <button onClick={() => exportBeneficiariesToExcel(beneficiaries, `beneficiaries_${dist.purok}_${dist.date}.xlsx`)}
                    className={'flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-lg ' + (isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600')}>
                    <Download className="w-3 h-3" /><span>Excel</span>
                  </button>
                </div>
              )}
            </div>
            {beneficiaries.length === 0 ? (
              <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>
                {readOnly ? 'No beneficiaries have been added yet.' : 'No beneficiaries added yet — import a file above to get started.'}
              </p>
            ) : filteredBeneficiaries.length === 0 ? (
              <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>
                No residents match "{searchQuery}".
              </p>
            ) : filteredBeneficiaries.map(b => (
              <div key={b.id} className={'rounded-xl p-3 border ' + (isDarkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={'text-sm font-semibold truncate ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>{b.name}</p>
                    <p className={'text-xs ' + (isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                      {b.purok || '—'} · {b.assistanceType === 'Others' && b.assistanceTypeOther ? b.assistanceTypeOther : b.assistanceType}
                    </p>
                    {b.remarks && <p className={'text-xs italic mt-0.5 ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>{b.remarks}</p>}
                    {b.dateReceived && <p className={'text-xs mt-0.5 ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>📅 {b.dateReceived}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + STATUS_CLS[b.status]}>
                      {BENEFICIARY_STATUS_LABELS[b.status]}
                    </span>
                    {!readOnly && (
                      <button onClick={() => handleRemove(b.id)} className={'p-1 rounded ' + (isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500')}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {BENEFICIARY_STATUSES.filter(s => s !== b.status).map(s => (
                      <button key={s} onClick={() => handleStatus(b.id, s)}
                        className={'flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-lg transition ' +
                          (isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200')}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Mark {BENEFICIARY_STATUS_LABELS[s]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Distribution Detail Drawer ───────────────────────────────────────────────
// Resident View redesign: cards are now click-to-expand. This drawer shows the
// complete post — slide-over from the right on desktop, bottom sheet on mobile —
// with large, modern action buttons instead of a cluster of tiny ones.
function DistributionDetailDrawer({
  dist, isDarkMode, isAdmin, userCoords, expandedPriority, onTogglePriority,
  onClose, onViewBeneficiaries, onViewRoute,
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const badge = (() => {
    if (dist.approvalStatus === 'pending')  return { label: 'Pending Approval', cls: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' }
    if (dist.approvalStatus === 'rejected') return { label: 'Rejected',         cls: 'bg-red-500/20 text-red-300 border border-red-500/30' }
    const s = (dist.status || 'scheduled').toLowerCase().replace(/\s+/g, '-')
    if (s === 'in-progress') return { label: 'In Progress', cls: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' }
    if (s === 'completed')   return { label: 'Completed',   cls: 'bg-green-500/20 text-green-300 border border-green-500/30' }
    return { label: 'Scheduled', cls: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' }
  })()

  const beneficiaryCount = (dist.beneficiaries || []).length
  const distKm = userCoords && dist.barangayLat != null && dist.barangayLng != null
    ? haversineDistance(userCoords.lat, userCoords.lng, dist.barangayLat, dist.barangayLng)
    : null

  const handleDownload = () => {
    const lines = [
      `Community Assistance Distribution`,
      `================================`,
      `Assistance Type: ${getAssistanceTypeLabel(dist)}`,
      `Barangay: ${dist.barangay || BARANGAY_CONFIG.fullBarangayName}`,
      `Purok: ${dist.purok || '—'}`,
      `Status: ${badge.label}`,
      dist.priority ? `Priority Level: ${dist.priority}` : null,
      dist.priorityReason ? `Priority Reason: ${dist.priorityReason}` : null,
      `Date: ${dist.date || '—'}`,
      `Time: ${dist.timeSlot || '—'}`,
      `Number of Beneficiaries: ${beneficiaryCount}`,
      `Total Families Target: ${dist.totalFamilies ?? '—'}`,
      `Delivered Families: ${dist.deliveredFamilies || 0}`,
      dist.packageType ? `Package Type: ${dist.packageType}` : null,
      `Created By: ${dist.createdByName || '—'}`,
      dist.description ? `Description: ${dist.description}` : null,
      dist.remarks ? `Notes: ${dist.remarks}` : null,
    ].filter(Boolean).join('\n')

    const blob = new Blob([lines], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assistance_${(dist.purok || 'details').replace(/\s+/g, '_')}_${dist.date || ''}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const panelBase = isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
  const fieldRow = 'flex items-start justify-between gap-3 py-2.5 border-b last:border-b-0 ' + (isDarkMode ? 'border-gray-800' : 'border-gray-100')
  const fieldLabel = 'text-xs font-semibold uppercase tracking-wide flex-shrink-0 ' + (isDarkMode ? 'text-gray-500' : 'text-gray-400')
  const fieldValue = 'text-sm font-medium text-right ' + (isDarkMode ? 'text-gray-200' : 'text-gray-800')

  return (
    <div className="fixed inset-0 z-[9999]">
      <div
        className={'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ' + (mounted ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      {/* Panel: bottom sheet on mobile, right slide-over on desktop */}
      <div
        className={
          'absolute inset-x-0 bottom-0 sm:inset-x-auto sm:right-0 sm:top-0 sm:h-full sm:w-[440px] max-w-full ' +
          'max-h-[90vh] sm:max-h-none rounded-t-3xl sm:rounded-none border-t sm:border-t-0 sm:border-l shadow-2xl ' +
          'flex flex-col transition-transform duration-300 ease-out ' +
          (mounted ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full') +
          ' ' + panelBase
        }
      >
        {/* Sticky header */}
        <div className={'sticky top-0 z-10 flex items-start justify-between gap-3 p-4 sm:p-5 border-b ' + (isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white')}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + badge.cls}>{badge.label}</span>
              {dist.priority && PRIORITY_STYLES[dist.priority] && (
                <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + PRIORITY_STYLES[dist.priority].cls}>
                  {PRIORITY_STYLES[dist.priority].emoji} {dist.priority.toUpperCase()}
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg truncate">{getAssistanceTypeLabel(dist)}</h3>
            <p className={'text-sm truncate ' + (isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
              {dist.barangay ? dist.barangay + ' · ' : ''}{dist.purok || 'Unspecified Purok'}
            </p>
          </div>
          <button onClick={onClose} className={'flex-shrink-0 p-2 rounded-xl ' + (isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {dist.description && (
            <div>
              <p className={fieldLabel + ' mb-1'}>Description</p>
              <p className="text-sm leading-relaxed">{dist.description}</p>
            </div>
          )}

          <div>
            <div className={fieldRow}>
              <span className={fieldLabel}>Schedule</span>
              <span className={fieldValue}>{dist.date}{dist.timeSlot ? ` · ${dist.timeSlot}` : ''}</span>
            </div>
            <div className={fieldRow}>
              <span className={fieldLabel}>Number of Beneficiaries</span>
              <span className={fieldValue}>{beneficiaryCount}</span>
            </div>
            <div className={fieldRow}>
              <span className={fieldLabel}>Families Target</span>
              <span className={fieldValue}>{dist.deliveredFamilies || 0} / {dist.totalFamilies || 0}</span>
            </div>
            {dist.packageType && (
              <div className={fieldRow}>
                <span className={fieldLabel}>Package Type</span>
                <span className={fieldValue}>{dist.packageType}</span>
              </div>
            )}
            {distKm != null && (
              <div className={fieldRow}>
                <span className={fieldLabel}>Distance</span>
                <span className={fieldValue}>{distKm.toFixed(1)} km away</span>
              </div>
            )}
            <div className={fieldRow}>
              <span className={fieldLabel}>Created By</span>
              <span className={fieldValue}>{dist.createdByName || '—'}</span>
            </div>
            {dist.remarks && (
              <div className={fieldRow}>
                <span className={fieldLabel}>Notes</span>
                <span className={fieldValue}>{dist.remarks}</span>
              </div>
            )}
          </div>

          {/* Priority reasoning — same AI explainability panel, now always reachable from the drawer */}
          {dist.priority && dist.prioritySource && (
            <div>
              <button
                onClick={() => onTogglePriority(dist.id)}
                className={'flex items-center gap-1.5 text-xs font-semibold ' + (isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {expandedPriority[dist.id] ? 'Hide priority details' : 'Why this priority level?'}
              </button>
              {expandedPriority[dist.id] && (
                <div className={'mt-2 rounded-xl border p-3 text-xs space-y-1 ' + (isDarkMode ? 'border-gray-800 bg-gray-800/50 text-gray-300' : 'border-gray-100 bg-gray-50 text-gray-600')}>
                  <p><span className="font-semibold">Assigned by:</span> {dist.prioritySource}</p>
                  {dist.suggestedAssistanceTypes?.length > 0 && (
                    <p><span className="font-semibold">Suggested Assistance:</span> {dist.suggestedAssistanceTypes.join(' / ')}</p>
                  )}
                  {dist.priorityReason && <p><span className="font-semibold">Reason:</span> {dist.priorityReason}</p>}
                </div>
              )}
            </div>
          )}

          {/* Admin operations — kept fully intact, just relocated out of the crowded card */}
          {isAdmin && (
            <div className={'rounded-xl border p-3 space-y-2.5 ' + (isDarkMode ? 'border-gray-800 bg-gray-800/40' : 'border-gray-100 bg-gray-50')}>
              <p className={fieldLabel}>Barangay Official Tools</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-400">
                  {WORKFLOW_LABELS[dist.progress?.workflowStatus] || 'Approved'}
                </span>
                {dist.assignedVolunteer?.name && (
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                    👤 {dist.assignedVolunteer.name}
                  </span>
                )}
                <FoodAidWorkflowActions dist={dist} />
              </div>
              {dist.totalFamilies > 0 && (
                <div className="pt-1">
                  <div className={'flex justify-between text-xs mb-1 ' + (isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                    <span>Distribution Progress</span>
                    <span className="font-semibold">{Math.min(100, Math.round(((dist.deliveredFamilies || 0) / dist.totalFamilies) * 100))}%</span>
                  </div>
                  <div className={'w-full h-2 rounded-full overflow-hidden ' + (isDarkMode ? 'bg-gray-700' : 'bg-gray-200')}>
                    <div className="h-2 rounded-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round(((dist.deliveredFamilies || 0) / dist.totalFamilies) * 100))}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky footer — large, modern action buttons */}
        <div className={'sticky bottom-0 p-4 sm:p-5 border-t space-y-2.5 ' + (isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white')}>
          <button onClick={onViewBeneficiaries}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg transition hover:from-emerald-600 hover:to-green-700">
            <Users className="w-4.5 h-4.5" />
            <span>View Beneficiary List ({beneficiaryCount})</span>
          </button>
          <button onClick={onViewRoute}
            className={'w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition ' +
              (isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200')}>
            <Calendar className="w-4 h-4" />
            <span>View Full Schedule &amp; Route</span>
          </button>
          <button onClick={handleDownload}
            className={'w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition ' +
              (isDarkMode ? 'bg-gray-800/60 hover:bg-gray-800 text-gray-300 border border-gray-800' : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200')}>
            <Download className="w-4 h-4" />
            <span>Download Details</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────────────────
const FoodAidPage = () => {
  const { isDarkMode } = useTheme()
  const { user }       = useAuth()
  const navigate       = useNavigate()
  const isAdmin        = user?.role === 'admin' || user?.role === 'barangay_official'

  // Location state
  const [locationStatus, setLocationStatus] = useState('idle')
  const [userCoords,     setUserCoords]     = useState(null)
  const [userBarangay,   setUserBarangay]   = useState(null)
  const [manualBarangay, setManualBarangay] = useState('')

  // Data
  const [distributions, setDistributions] = useState([])
  const [loading,       setLoading]       = useState(true)

  // UI
  const [activeTab,     setActiveTab]     = useState('list')
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [showPostModal, setShowPostModal] = useState(false)
  const [routeDist,     setRouteDist]     = useState(null)
  const [expandedPriority, setExpandedPriority] = useState({})
  const [beneficiaryDistId, setBeneficiaryDistId] = useState(null)
  const beneficiaryDist = distributions.find(d => d.id === beneficiaryDistId) || null
  const [showExportModal, setShowExportModal] = useState(false)
  const [detailDistId, setDetailDistId] = useState(null)
  const detailDist = distributions.find(d => d.id === detailDistId) || null


  useEffect(() => {
    detectLocation()
    setLoading(true)
    const unsubscribe = foodAidService.subscribeToFoodAid(all => {
      const enriched = all.map(d => {
        if (d.barangayLat && d.barangayLng) return d
        const b  = TOLEDO_BARANGAYS.find(b => b.name === d.barangay || b.id === d.barangayId)
        if (b) return { ...d, barangayLat: b.lat, barangayLng: b.lng }
        const pc = PUROK_COORDS[d.purok]
        if (pc) return { ...d, barangayLat: pc.lat, barangayLng: pc.lng }
        return { ...d, barangayLat: 10.3737, barangayLng: 123.6384 }
      })
      setDistributions(enriched)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const detectLocation = async () => {
    setLocationStatus('detecting')
    try {
      const coords = await getPositionAsync()
      setUserCoords(coords)
      setUserBarangay(detectNearestBarangay(coords.lat, coords.lng))
      setLocationStatus('success')
    } catch {
      setLocationStatus('error')
    }
  }

  const handleManualSelect = id => {
    setManualBarangay(id)
    const b = TOLEDO_BARANGAYS.find(b => b.id === id)
    if (b) setUserBarangay(b)
  }

  // No-op: the onSnapshot listener registered above already keeps `distributions`
  // in sync in real time, including right after a new post succeeds.
  const fetchDistributions = () => {}

  const getFiltered = () => {
  let list = [...distributions]
  if (statusFilter !== 'all') {
    list = list.filter(d => {
      const s = (d.status || 'scheduled').toLowerCase().replace(/\s+/g, '-')
      return s === statusFilter
    })
  }
  if (userCoords) {
    // FR-FA-01: explicitly compute and attach distanceAway (km) to each record
    list = list.map(d => ({
      ...d,
      distanceAway: (d.barangayLat != null && d.barangayLng != null)
        ? haversineDistance(userCoords.lat, userCoords.lng, d.barangayLat, d.barangayLng)
        : null,
    }))
    list.sort((a, b) => {
      if (a.distanceAway == null) return 1
      if (b.distanceAway == null) return -1
      return a.distanceAway - b.distanceAway
    })
  } else {
    list = list.map(d => ({ ...d, distanceAway: null }))
  }
  return list
}

  const getStatusBadge = (status, approvalStatus) => {
    if (approvalStatus === 'pending')  return { label: 'Pending Approval', cls: isDarkMode ? 'bg-orange-950/60 text-orange-400' : 'bg-orange-100 text-orange-700' }
    if (approvalStatus === 'rejected') return { label: 'Rejected',         cls: isDarkMode ? 'bg-red-950/60 text-red-400'       : 'bg-red-100 text-red-700' }
    const s = (status || 'scheduled').toLowerCase().replace(/\s+/g, '-')
    if (s === 'in-progress') return { label: 'In Progress', cls: isDarkMode ? 'bg-yellow-950/60 text-yellow-400' : 'bg-yellow-100 text-yellow-700' }
    if (s === 'completed')   return { label: 'Completed',   cls: isDarkMode ? 'bg-green-950/60 text-green-400'   : 'bg-green-100 text-green-700' }
    return { label: 'Scheduled', cls: isDarkMode ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-100 text-blue-700' }
  }

  const getMarkerColor = d => {
    if (d.approvalStatus === 'pending')  return STATUS_COLORS.pending
    if (d.approvalStatus === 'rejected') return STATUS_COLORS.rejected
    const s = (d.status || 'scheduled').toLowerCase().replace(/\s+/g, '-')
    return STATUS_COLORS[s] || STATUS_COLORS.scheduled
  }

  const filtered    = getFiltered()
  const mapCenter   = userCoords ? [userCoords.lat, userCoords.lng] : [10.3737, 123.6384]
  const activeCount = distributions.filter(d => ['scheduled', 'in-progress'].includes((d.status || '').toLowerCase().replace(/\s+/g, '-'))).length
  const servedToday = distributions
    .filter(d => d.date === new Date().toISOString().split('T')[0])
    .reduce((s, d) => s + (d.deliveredFamilies || 0), 0)

  /* glass card — same design language as HomePage / HealthPage */
  const card =
    'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all duration-300 hover:border-white/40 hover:shadow-blue-500/10'

  return (
    <div className="min-h-screen relative">
      {/* Background — matches HomePage/HealthPage's hero shell */}
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${isDarkMode
          ? 'bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-indigo-950/95'
          : 'bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-800/90'}`}
        />
      </div>

      {/* Decorative blobs — matches HomePage/HealthPage's gradient shell */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      <div className="mx-auto max-w-7xl space-y-5 p-4 pb-24 sm:space-y-6 sm:p-6 lg:p-8">

        {/* ── Hero header banner ── */}
        <section className={`${card} overflow-hidden bg-gradient-to-r from-emerald-500/30 via-green-500/20 to-teal-500/30`}>
          <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                GPS-smart route optimization
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Community Assistance Distribution
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base">
                Track deliveries and get AI-optimized routes to every barangay.
              </p>
            </div>
            {isAdmin && (
              <div className="hidden sm:flex items-center gap-2 self-start lg:self-center">
                <button onClick={() => setShowExportModal(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-white/20">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                <button onClick={() => setShowPostModal(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700">
                  <Plus className="h-4 w-4" />
                  <span>Post Distribution</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Location Card */}
        <div className={`${card} p-4`}>
          {locationStatus === 'idle' || locationStatus === 'detecting' ? (
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <Navigation className="h-4 w-4 animate-pulse text-blue-200" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {locationStatus === 'detecting' ? 'Detecting your location via GPS…' : 'Initializing GPS…'}
                </p>
                <p className="text-xs text-white/50">
                  AI will identify your barangay and sort distributions by distance
                </p>
              </div>
              <Loader2 className="h-5 w-5 animate-spin text-blue-200" />
            </div>
          ) : locationStatus === 'success' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <Navigation className="h-4 w-4 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-bold text-white">{userBarangay?.name}</p>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-xs text-white/50">
                    GPS detected {userCoords?.accuracy} accuracy · Distributions sorted by distance
                  </p>
                </div>
              </div>
              <button onClick={detectLocation} className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* GPS error – manual barangay selector */
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <AlertCircle className="h-4 w-4 text-orange-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">GPS Unavailable</p>
                  <p className="text-xs text-white/50">Select your barangay manually to enable smart sorting</p>
                </div>
                <button onClick={detectLocation} className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-blue-200 hover:bg-white/20">
                  Retry GPS
                </button>
              </div>
              <select value={manualBarangay} onChange={e => handleManualSelect(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50">
                <option value="" className="text-gray-900">Select your barangay…</option>
                {TOLEDO_BARANGAYS.map(b => <option key={b.id} value={b.id} className="text-gray-900">{b.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Distributions', value: distributions.length, color: 'text-blue-200' },
            { label: 'Active Now',    value: activeCount,          color: 'text-emerald-200' },
            { label: 'Served Today',  value: servedToday,          color: 'text-violet-200' },
          ].map(s => (
            <div key={s.label} className={`${card} p-3 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-white/50">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab Bar + Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {[{ id: 'list', label: 'List View', Icon: List }, { id: 'map', label: 'Map View', Icon: Map }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                activeTab === t.id
                  ? 'border-white/30 bg-white/20 text-white shadow-md'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}>
              <t.Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          ))}

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="ml-auto rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50">
            <option value="all" className="text-gray-900">All Status</option>
            <option value="scheduled" className="text-gray-900">Scheduled</option>
            <option value="in-progress" className="text-gray-900">In Progress</option>
            <option value="completed" className="text-gray-900">Completed</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className={`${card} p-10 text-center`}>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-300" />
            <p className="mt-3 text-sm text-white/60">Loading distributions…</p>
          </div>

        ) : activeTab === 'map' ? (
          /* ── Map View ── */
          <div className={`${card} overflow-hidden`}>
            <div style={{ height: '400px' }}>
              <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                <MapUpdater center={mapCenter} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* User location */}
                {userCoords && (
                  <>
                    <Marker position={[userCoords.lat, userCoords.lng]} icon={USER_ICON}>
                      <Popup>
                        <div style={{ minWidth: 160 }}>
                          <p style={{ fontWeight: 'bold', marginBottom: 4 }}>📍 Your Location</p>
                          <p style={{ fontSize: 12 }}>{userBarangay?.name}</p>
                          <p style={{ fontSize: 11, color: '#6b7280' }}>±{userCoords.accuracy}m GPS accuracy</p>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle center={[userCoords.lat, userCoords.lng]} radius={userCoords.accuracy}
                      color="#3b82f6" fillColor="#3b82f6" fillOpacity={0.1} weight={1} />
                  </>
                )}

                {/* Distribution markers */}
                {filtered.map(d => {
                  const color = getMarkerColor(d)
                  const badge = getStatusBadge(d.status, d.approvalStatus)
                  const dist = d.distanceAway
                  return (
                    <Marker key={d.id} position={[d.barangayLat, d.barangayLng]} icon={makeCircleIcon(color, 18)}>
                      <Popup>
                        <div style={{ minWidth: 180 }}>
                          <p style={{ fontWeight: 'bold', marginBottom: 4 }}>
                            {d.barangay ? d.barangay + (d.purok ? ' · ' + d.purok : '') : d.purok}
                          </p>
                          <p style={{ fontSize: 12 }}>📅 {d.date} · {d.timeSlot || 'Morning'}</p>
                          <p style={{ fontSize: 12 }}>👨‍👩‍👧 {d.totalFamilies} families</p>
                          {d.packageType && <p style={{ fontSize: 12 }}>📦 {d.packageType}</p>}
                          {dist != null && <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>📍 {dist.toFixed(1)} km from you</p>}
                          <div style={{ display: 'inline-block', marginTop: 6, padding: '2px 10px', borderRadius: 999, background: color, color: '#fff', fontSize: 11, fontWeight: 700 }}>
                            {badge.label}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <button onClick={() => setRouteDist(d)}
                              style={{ fontSize: 11, color: '#10b981', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                              ✨ View AI Route →
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            </div>

            {/* Map legend */}
            <div className="flex flex-wrap items-center gap-4 border-t border-white/10 bg-white/5 p-3">
              <span className="text-xs font-semibold text-white/50">Legend:</span>
              {[
                { color: '#3b82f6', label: 'You' },
                { color: STATUS_COLORS.scheduled,     label: 'Scheduled' },
                { color: STATUS_COLORS['in-progress'], label: 'In Progress' },
                { color: STATUS_COLORS.completed,     label: 'Completed' },
                { color: STATUS_COLORS.pending,       label: 'Pending' },
              ].map(l => (
                <div key={l.label} className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full border border-white/50" style={{ background: l.color }} />
                  <span className="text-xs text-white/70">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

        ) : (
          /* ── List View ── */
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className={`${card} p-8 text-center`}>
                <Package className="mx-auto mb-3 h-12 w-12 text-white/30" />
                <p className="mb-1 text-sm font-semibold text-white">No distributions found</p>
                <p className="mb-4 text-xs text-white/50">
                  {statusFilter !== 'all'
                    ? 'Try changing the status filter above.'
                    : 'No community assistance distributions have been posted yet. Check back soon.'}
                </p>
                {isAdmin && (
                  <>
                    <button onClick={() => setShowPostModal(true)} className="text-sm font-semibold text-emerald-300 hover:underline">
                      + Post a new distribution
                    </button>
                    
                  </>
                )}
              </div>
            ) : (
              filtered.map((d, idx) => {
                const badge  = getStatusBadge(d.status, d.approvalStatus)
                const distKm = d.distanceAway
                const isNearest = userCoords && idx === 0
                const beneficiaryCount = (d.beneficiaries || []).length

                return (
                  <button
                    key={d.id}
                    onClick={() => setDetailDistId(d.id)}
                    className={`${card} w-full p-4 sm:p-5 text-left group cursor-pointer`}
                  >
                    {isNearest && (
                      <div className="mb-2 flex items-center space-x-1.5 text-xs font-bold text-emerald-300">
                        <Star className="w-3.5 h-3.5" />
                        <span>Nearest distribution to you</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-white truncate">
                            {getAssistanceTypeLabel(d)}
                          </h4>
                        </div>
                        <p className="text-sm text-white/70 truncate mt-0.5">
                          {d.barangay ? d.barangay + ' · ' + (d.purok || '') : d.purok}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/60">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{d.date}{d.timeSlot ? ' · ' + d.timeSlot : ''}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>{d.totalFamilies} families</span>
                          </div>
                          {distKm != null && (
                            <div className="flex items-center space-x-1 font-semibold text-blue-200">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{distKm.toFixed(1)} km away</span>
                            </div>
                          )}
                          {beneficiaryCount > 0 && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">
                              {beneficiaryCount} beneficiar{beneficiaryCount === 1 ? 'y' : 'ies'}
                            </span>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/60">
                              {WORKFLOW_LABELS[d.progress?.workflowStatus] || 'Approved'}
                            </span>
                            {d.assignedVolunteer?.name && (
                              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                                👤 {d.assignedVolunteer.name}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {d.priority && PRIORITY_STYLES[d.priority] && (
                          <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + PRIORITY_STYLES[d.priority].cls}>
                            {PRIORITY_STYLES[d.priority].emoji} {d.priority.toUpperCase()}
                          </span>
                        )}
                        <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + badge.cls}>
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    {/* Delivery progress bar — kept at a glance since it's the most-checked stat */}
                    {d.totalFamilies > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/10">
                          <div
                            className="h-1.5 rounded-full bg-emerald-400 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.round(((d.deliveredFamilies || 0) / d.totalFamilies) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-xs font-semibold text-white/50 group-hover:text-white/80 transition">
                      <span>Tap to view details</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}

        {/* Optimize Schedule CTA — admin/barangay official only */}
        {isAdmin && (
          <button onClick={() => navigate('/food-aid/optimize')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700 sm:w-auto">
            <TrendingUp className="w-5 h-5" />
            <span>AI Optimize Multi-Stop Distribution Schedule</span>
          </button>
        )}
      </div>

      {/* Admin FAB (mobile) */}
      {isAdmin && (
        <button onClick={() => setShowPostModal(true)}
          className="sm:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center transition">
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Modals */}
      {showPostModal && (
        <PostDistributionModal isDarkMode={isDarkMode} user={user}
          onClose={() => setShowPostModal(false)}
          onSuccess={() => { setShowPostModal(false); fetchDistributions() }}
        />
      )}
      {routeDist && (
        <RouteModal dist={routeDist} userCoords={userCoords} userBarangay={userBarangay}
          isDarkMode={isDarkMode} onClose={() => setRouteDist(null)} />
      )}
      {beneficiaryDist && (
        <BeneficiaryManagerModal dist={beneficiaryDist} isDarkMode={isDarkMode} readOnly={!isAdmin}
          onClose={() => setBeneficiaryDistId(null)} />
      )}
      {detailDist && (
        <DistributionDetailDrawer
          dist={detailDist} isDarkMode={isDarkMode} isAdmin={isAdmin} userCoords={userCoords}
          expandedPriority={expandedPriority} onTogglePriority={id => setExpandedPriority(m => ({ ...m, [id]: !m[id] }))}
          onClose={() => setDetailDistId(null)}
          onViewBeneficiaries={() => setBeneficiaryDistId(detailDist.id)}
          onViewRoute={() => setRouteDist(detailDist)}
        />
      )}
      {showExportModal && (
        <ExportBeneficiariesModal distributions={distributions} isDarkMode={isDarkMode}
          onClose={() => setShowExportModal(false)} />
      )}
    </div>
  )
}

export default FoodAidPage