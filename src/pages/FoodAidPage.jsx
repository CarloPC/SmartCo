import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Package, MapPin, Navigation, AlertCircle, Clock, Users,
  TrendingUp, Loader2, XCircle, RefreshCw, Plus, Map, List,
  Sparkles, Truck, Star, AlertTriangle, Shield
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import foodAidService from '../services/foodAidService'
import LocationPicker from '../components/LocationPicker'
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

// ── Post Distribution Modal ──────────────────────────────────────────────────
function PostDistributionModal({ isDarkMode, user, onClose, onSuccess }) {
  const [form, setForm] = useState({
    barangay: '', purok: '', date: '', timeSlot: 'Morning (8AM-10AM)',
    totalFamilies: '', packageType: 'Mixed', description: '',
  })
  const [aiAnalysis,      setAiAnalysis]      = useState(null)
  const [isPosting,       setIsPosting]       = useState(false)
  const [pinCoords,       setPinCoords]       = useState(null)
  const [customPurokMode, setCustomPurokMode] = useState(false)

  // AI analysis fires whenever the pin changes (pin-first) or barangay/date/purok changes
  useEffect(() => {
    if (pinCoords) {
      const nearest = detectNearestBarangay(pinCoords.lat, pinCoords.lng)
      setAiAnalysis(generatePinpointAIAnalysis(pinCoords.lat, pinCoords.lng, nearest, form.purok, form.date || null))
    } else if (form.barangay) {
      const b = TOLEDO_BARANGAYS.find(b => b.id === form.barangay)
      if (b) setAiAnalysis(generateAIRouteAnalysis(b, form.date || null))
      else   setAiAnalysis(null)
    } else {
      setAiAnalysis(null)
    }
  }, [pinCoords, form.barangay, form.date, form.purok])

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleSubmit = async () => {
    const b = TOLEDO_BARANGAYS.find(b => b.id === form.barangay)
    if ((!b && !pinCoords) || !form.purok || !form.date || !form.totalFamilies) {
      alert('Please fill in all required fields. A barangay selection or pinpointed location is required.')
      return
    }
    const nearest       = pinCoords ? detectNearestBarangay(pinCoords.lat, pinCoords.lng) : null
    const targetBarangay = b || nearest
    const targetLat     = pinCoords?.lat ?? b?.lat
    const targetLng     = pinCoords?.lng ?? b?.lng
    try {
      setIsPosting(true)
      await foodAidService.postDistribution({
        barangay:            targetBarangay?.name ?? '',
        barangayId:          targetBarangay?.id   ?? '',
        barangayLat:         targetLat,
        barangayLng:         targetLng,
        pinLat:              pinCoords?.lat ?? null,
        pinLng:              pinCoords?.lng ?? null,
        isPinpointed:        !!pinCoords,
        purok:               form.purok,
        date:                form.date,
        timeSlot:            form.timeSlot,
        totalFamilies:       parseInt(form.totalFamilies),
        packageType:         form.packageType,
        description:         form.description,
        routeDistance:       aiAnalysis?.distanceKm,
        estimatedTravelTime: aiAnalysis?.travelTimeMin,
        terrain:             aiAnalysis?.terrain ?? targetBarangay?.terrain,
        efficiency:          aiAnalysis?.efficiency,
        createdByName:       user?.fullName,
        aiOptimized:         !!pinCoords,
      })
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
  const sectionCls = 'rounded-2xl p-4 border space-y-3 ' + (isDarkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200')
  const stepNum    = (n, color) => `w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-${color}-500`

  // Nearest barangay label from pin
  const nearestFromPin = pinCoords ? detectNearestBarangay(pinCoords.lat, pinCoords.lng) : null

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={
        'relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl ' +
        (isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white')
      }>
        {/* Header */}
        <div className={
          'sticky top-0 z-10 flex items-center justify-between p-4 border-b rounded-t-3xl sm:rounded-t-2xl ' +
          (isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-white')
        }>
          <div className="flex items-center space-x-2">
            <div className={'w-8 h-8 rounded-lg flex items-center justify-center ' + (isDarkMode ? 'bg-green-900/50' : 'bg-green-50')}>
              <Package className={'w-4 h-4 ' + (isDarkMode ? 'text-green-400' : 'text-green-600')} />
            </div>
            <div>
              <h3 className={'font-bold text-base ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>Post Distribution Event</h3>
              <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>Barangay Official · Pin-First AI Route Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className={'p-1.5 rounded-lg ' + (isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}>
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">

          {/* ── Step 1: Pinpoint Location ── */}
          <div className={sectionCls}>
            <div className="flex items-center space-x-2">
              <div className={stepNum(1, 'green')}>1</div>
            <div>
                <p className={'text-sm font-bold ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>Set Origin &amp; Destination Pins</p>
                <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>
                  🔵 <strong>Pin 1 (Origin)</strong> is auto-set to the Distribution Hub. 🟢 <strong>Pin 2 (Destination)</strong>: click the map or use GPS to pin the delivery location. The AI will analyze the best route.
                </p>
              </div>
            </div>

            <LocationPicker
                value={pinCoords}
                onChange={setPinCoords}
                isDarkMode={isDarkMode}
                originPin={DISTRIBUTION_HUB}
                originLabel="Distribution Hub (Barangay Hall)"
              />

            {/* Auto-detected nearest barangay from pin */}
            {nearestFromPin && (
              <div className={'flex items-center space-x-2 text-xs px-3 py-2 rounded-xl ' + (isDarkMode ? 'bg-green-950/40 text-green-300' : 'bg-green-50 text-green-700')}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Nearest barangay detected: <strong>{nearestFromPin.name}</strong> ({nearestFromPin.terrain} terrain)</span>
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

            {/* Barangay – optional when pin is set */}
            <div>
              <label className={labelCls}>
                Barangay {pinCoords
                  ? <span className={'normal-case font-normal ' + (isDarkMode ? 'text-gray-500' : 'text-gray-400')}>(optional – auto-detected from pin)</span>
                  : <span className="text-red-500">*</span>}
              </label>
              <select value={form.barangay} onChange={e => set('barangay', e.target.value)} className={inputCls}>
                <option value="">{pinCoords ? `Auto: ${nearestFromPin?.name || 'Detected from pin'}` : 'Select Barangay…'}</option>
                {TOLEDO_BARANGAYS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
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
                  {customPurokMode ? '↩ Use Dropdown' : '✏ Custom Purok'}
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

            {/* Package Type */}
            <div>
              <label className={labelCls}>Package Type</label>
              <select value={form.packageType} onChange={e => set('packageType', e.target.value)} className={inputCls}>
                {['Mixed', 'Rice', 'Canned Goods', 'Vegetables', 'Full Pack'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* ── Step 3: Schedule ── */}
          <div className={sectionCls}>
            <div className="flex items-center space-x-2 mb-1">
              <div className={stepNum(3, 'purple')}>3</div>
              <p className={'text-sm font-bold ' + (isDarkMode ? 'text-white' : 'text-gray-900')}>Schedule & Capacity</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date *</label>
                <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
                  onChange={e => set('date', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Time Slot</label>
                <select value={form.timeSlot} onChange={e => set('timeSlot', e.target.value)} className={inputCls}>
                  {['Early Morning (7AM-9AM)', 'Morning (8AM-10AM)', 'Late Morning (10AM-12PM)', 'Afternoon (2PM-4PM)'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Total Families to Serve *</label>
              <input type="number" value={form.totalFamilies} min="1" placeholder="e.g. 50"
                onChange={e => set('totalFamilies', e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Additional Notes (optional)</label>
              <textarea value={form.description} rows="2" placeholder="Special instructions…"
                onChange={e => set('description', e.target.value)} className={inputCls + ' resize-none'} />
            </div>
          </div>

          {/* ── AI Route Analysis – triggers on pin OR barangay ── */}
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

  useEffect(() => { detectLocation(); fetchDistributions() }, [])

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

  const fetchDistributions = async () => {
    try {
      setLoading(true)
      const all = await foodAidService.getAllFoodAidSchedules()
      const enriched = all.map(d => {
        if (d.barangayLat && d.barangayLng) return d
        const b  = TOLEDO_BARANGAYS.find(b => b.name === d.barangay || b.id === d.barangayId)
        if (b) return { ...d, barangayLat: b.lat, barangayLng: b.lng }
        const pc = PUROK_COORDS[d.purok]
        if (pc) return { ...d, barangayLat: pc.lat, barangayLng: pc.lng }
        return { ...d, barangayLat: 10.3737, barangayLng: 123.6384 }
      })
      setDistributions(enriched)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getFiltered = () => {
    let list = [...distributions]
    if (statusFilter !== 'all') {
      list = list.filter(d => {
        const s = (d.status || 'scheduled').toLowerCase().replace(/\s+/g, '-')
        return s === statusFilter
      })
    }
    if (userCoords) {
      list.sort((a, b) =>
        haversineDistance(userCoords.lat, userCoords.lng, a.barangayLat, a.barangayLng) -
        haversineDistance(userCoords.lat, userCoords.lng, b.barangayLat, b.barangayLng)
      )
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

  const card = (isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30') + ' backdrop-blur-lg rounded-2xl shadow-xl border'

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: 'url(' + toledoImage + ')' }}>
        <div className={'absolute inset-0 ' + (isDarkMode
          ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95'
          : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85')} />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-screen-xl pb-24">

        {/* Header */}
        <div className={
          'backdrop-blur-sm rounded-2xl p-5 lg:p-6 text-white shadow-xl border ' +
          (isDarkMode
            ? 'bg-gradient-to-r from-green-900/90 to-emerald-950/90 border-gray-700/50'
            : 'bg-gradient-to-r from-green-500/90 to-emerald-600/90 border-white/20')
        }>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold">Food Aid Distribution</h2>
                <p className={'text-sm ' + (isDarkMode ? 'text-green-200' : 'text-green-100')}>
                  GPS-Smart Tracking · AI Route Optimization
                </p>
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => setShowPostModal(true)}
                className="hidden sm:flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-semibold text-sm transition border border-white/20">
                <Plus className="w-4 h-4" />
                <span>Post Distribution</span>
              </button>
            )}
          </div>
        </div>

        {/* Location Card */}
        <div className={card + ' p-4'}>
          {locationStatus === 'idle' || locationStatus === 'detecting' ? (
            <div className="flex items-center space-x-3">
              <div className={'w-9 h-9 rounded-xl flex items-center justify-center ' + (isDarkMode ? 'bg-blue-900/50' : 'bg-blue-50')}>
                <Navigation className={'w-4 h-4 animate-pulse ' + (isDarkMode ? 'text-blue-400' : 'text-blue-600')} />
              </div>
              <div className="flex-1">
                <p className={'text-sm font-medium ' + (isDarkMode ? 'text-gray-200' : 'text-gray-800')}>
                  {locationStatus === 'detecting' ? 'Detecting your location via GPS…' : 'Initializing GPS…'}
                </p>
                <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>
                  AI will identify your barangay and sort distributions by distance
                </p>
              </div>
              <Loader2 className={'w-5 h-5 animate-spin ' + (isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
            </div>
          ) : locationStatus === 'success' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={'w-9 h-9 rounded-xl flex items-center justify-center ' + (isDarkMode ? 'bg-green-900/50' : 'bg-green-50')}>
                  <Navigation className={'w-4 h-4 ' + (isDarkMode ? 'text-green-400' : 'text-green-600')} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className={'text-sm font-bold ' + (isDarkMode ? 'text-gray-100' : 'text-gray-900')}>{userBarangay?.name}</p>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>
                    GPS detected · ±{userCoords?.accuracy}m accuracy · Distributions sorted by distance
                  </p>
                </div>
              </div>
              <button onClick={detectLocation} className={'p-2 rounded-lg transition ' + (isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}>
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* GPS error – manual barangay selector */
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className={'w-9 h-9 rounded-xl flex items-center justify-center ' + (isDarkMode ? 'bg-orange-900/50' : 'bg-orange-50')}>
                  <AlertCircle className={'w-4 h-4 ' + (isDarkMode ? 'text-orange-400' : 'text-orange-600')} />
                </div>
                <div className="flex-1">
                  <p className={'text-sm font-medium ' + (isDarkMode ? 'text-gray-200' : 'text-gray-800')}>GPS Unavailable</p>
                  <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>Select your barangay manually to enable smart sorting</p>
                </div>
                <button onClick={detectLocation} className={'text-xs px-2.5 py-1.5 rounded-lg font-medium ' + (isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-600')}>
                  Retry GPS
                </button>
              </div>
              <select value={manualBarangay} onChange={e => handleManualSelect(e.target.value)}
                className={'w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ' + (isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-900')}>
                <option value="">Select your barangay…</option>
                {TOLEDO_BARANGAYS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Distributions', value: distributions.length, color: isDarkMode ? 'text-blue-400'   : 'text-blue-600' },
            { label: 'Active Now',    value: activeCount,          color: isDarkMode ? 'text-green-400'  : 'text-green-600' },
            { label: 'Served Today',  value: servedToday,          color: isDarkMode ? 'text-purple-400' : 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className={card + ' p-3 text-center'}>
              <p className={'text-2xl font-bold ' + s.color}>{s.value}</p>
              <p className={'text-xs mt-0.5 ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab Bar + Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {[{ id: 'list', label: 'List View', Icon: List }, { id: 'map', label: 'Map View', Icon: Map }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={
                'flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition ' +
                (activeTab === t.id
                  ? (isDarkMode ? 'bg-green-900/80 text-green-300 border border-green-700/50' : 'bg-green-500 text-white shadow-md')
                  : (isDarkMode ? 'bg-gray-800/80 text-gray-400 hover:bg-gray-700/80' : 'bg-white/80 text-gray-600 hover:bg-white shadow-sm'))
              }>
              <t.Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          ))}

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className={
              'ml-auto px-3 py-2 rounded-xl text-sm border focus:outline-none ' +
              (isDarkMode ? 'bg-gray-800/80 border-gray-700 text-gray-300' : 'bg-white/80 border-white/50 text-gray-700')
            }>
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className={card + ' p-10 text-center'}>
            <Loader2 className={'w-8 h-8 animate-spin mx-auto ' + (isDarkMode ? 'text-green-400' : 'text-green-500')} />
            <p className={'mt-3 text-sm ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Loading distributions…</p>
          </div>

        ) : activeTab === 'map' ? (
          /* ── Map View ── */
          <div className={card + ' overflow-hidden'}>
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
                  const dist  = userCoords
                    ? haversineDistance(userCoords.lat, userCoords.lng, d.barangayLat, d.barangayLng)
                    : null
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
            <div className={'p-3 flex flex-wrap items-center gap-4 border-t ' + (isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50/50')}>
              <span className={'text-xs font-semibold ' + (isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Legend:</span>
              {[
                { color: '#3b82f6', label: 'You' },
                { color: STATUS_COLORS.scheduled,     label: 'Scheduled' },
                { color: STATUS_COLORS['in-progress'], label: 'In Progress' },
                { color: STATUS_COLORS.completed,     label: 'Completed' },
                { color: STATUS_COLORS.pending,       label: 'Pending' },
              ].map(l => (
                <div key={l.label} className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full border border-white/50" style={{ background: l.color }} />
                  <span className={'text-xs ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

        ) : (
          /* ── List View ── */
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className={card + ' p-8 text-center'}>
                <Package className={'w-12 h-12 mx-auto mb-3 ' + (isDarkMode ? 'text-gray-600' : 'text-gray-400')} />
                <p className={'text-sm font-semibold mb-1 ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>No distributions found</p>
                <p className={'text-xs mb-4 ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>
                  {statusFilter !== 'all'
                    ? 'Try changing the status filter above.'
                    : 'No food aid distributions have been posted yet. Check back soon.'}
                </p>
                {isAdmin && (
                  <>
                    <button onClick={() => setShowPostModal(true)} className="text-sm text-green-500 font-semibold hover:underline">
                      + Post a new distribution
                    </button>
                    {statusFilter === 'all' && (
                      <div className={'mt-5 mx-auto max-w-xs text-left px-4 py-3 rounded-xl border text-xs ' + (isDarkMode ? 'bg-yellow-950/30 border-yellow-800/50 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800')}>
                        <p className="font-bold mb-1">⚠️ Residents can&apos;t see distributions?</p>
                        <p>
                          Update your <strong>Firestore Security Rules</strong> so all authenticated users can read food aid schedules.
                          Copy the updated rules from <code className="font-mono">FIRESTORE_RULES_UPDATED.txt</code> and paste them into Firebase Console → Firestore → Rules.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              filtered.map((d, idx) => {
                const badge  = getStatusBadge(d.status, d.approvalStatus)
                const distKm = userCoords && d.barangayLat
                  ? haversineDistance(userCoords.lat, userCoords.lng, d.barangayLat, d.barangayLng)
                  : null
                const isNearest = userCoords && idx === 0

                return (
                  <div key={d.id} className={card + ' p-4'}>
                    {isNearest && (
                      <div className={'flex items-center space-x-1.5 mb-2 text-xs font-bold ' + (isDarkMode ? 'text-green-400' : 'text-green-600')}>
                        <Star className="w-3.5 h-3.5" />
                        <span>Nearest distribution to you</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className={'font-bold ' + (isDarkMode ? 'text-gray-100' : 'text-gray-900')}>
                          {d.barangay ? d.barangay + ' · ' + (d.purok || '') : d.purok}
                        </h4>
                        <div className={'flex flex-wrap items-center gap-3 mt-1 text-xs ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{d.date}{d.timeSlot ? ' · ' + d.timeSlot : ''}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>{d.totalFamilies} families</span>
                          </div>
                          {distKm != null && (
                            <div className={'flex items-center space-x-1 font-semibold ' + (isDarkMode ? 'text-blue-400' : 'text-blue-600')}>
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{distKm.toFixed(1)} km away</span>
                            </div>
                          )}
                          {d.packageType && (
                            <span className={'px-2 py-0.5 rounded-full ' + (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}>
                              📦 {d.packageType}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={'text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-2 ' + badge.cls}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Delivery progress bar */}
                    {d.totalFamilies > 0 && (
                      <div className={'mb-3 pt-3 border-t ' + (isDarkMode ? 'border-gray-700' : 'border-gray-100')}>
                        <div className={'flex items-center justify-between text-xs mb-1.5 ' + (isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                          <span>Distribution Progress</span>
                          <span className="font-semibold">{d.deliveredFamilies || 0} / {d.totalFamilies} families</span>
                        </div>
                        <div className={'w-full h-2 rounded-full overflow-hidden ' + (isDarkMode ? 'bg-gray-700' : 'bg-gray-200')}>
                          <div
                            className="h-2 rounded-full bg-green-500 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.round(((d.deliveredFamilies || 0) / d.totalFamilies) * 100))}%` }}
                          />
                        </div>
                        <p className={'text-xs mt-1 text-right ' + (isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
                          {Math.min(100, Math.round(((d.deliveredFamilies || 0) / d.totalFamilies) * 100))}% complete
                        </p>
                      </div>
                    )}

                    {/* AI Route button */}
                    <button onClick={() => setRouteDist(d)}
                      className={
                        'w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-medium transition ' +
                        (isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700')
                      }>
                      <Sparkles className={'w-4 h-4 ' + (isDarkMode ? 'text-green-400' : 'text-green-500')} />
                      <span>View AI Route from {userCoords ? 'My Location' : 'Hub'}</span>
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Optimize Schedule CTA — admin/barangay official only */}
        {isAdmin && (
          <button onClick={() => navigate('/food-aid/optimize')}
            className={
              'w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-xl font-semibold transition shadow-xl border ' +
              (isDarkMode
                ? 'bg-green-900/90 hover:bg-green-800 border-gray-700/50 text-white'
                : 'bg-green-500/90 hover:bg-green-600 border-white/20 text-white')
            }>
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
    </div>
  )
}

export default FoodAidPage
