import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, GeoJSON, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, AlertCircle, CheckCircle2, Loader2, RotateCcw, Truck, ShieldAlert } from 'lucide-react'
import { haversineDistance, estimateTravelTime, isPointInGeoJSONPolygon } from '../utils/locationUtils'

// Fix Leaflet default icon broken by Vite bundler
const _pinIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Pin 1: Origin / Distribution Hub (blue with home icon)
const HUB_ICON = L.divIcon({
  html: `
    <div style="position:relative;width:36px;height:52px">
      <div style="
        width:36px;height:36px;
        background:linear-gradient(135deg,#3b82f6,#2563eb);
        border:3px solid white;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 0 4px rgba(59,130,246,0.25),0 4px 14px rgba(59,130,246,0.5);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
      <div style="
        position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);
        background:#2563eb;color:white;
        font-size:8px;font-weight:800;padding:2px 5px;border-radius:4px;
        white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.25);
      ">📦 ORIGIN</div>
    </div>
  `,
  className: '',
  iconSize: [36, 52],
  iconAnchor: [18, 18],
})

// Pin 2: Delivery Destination (green teardrop)
const DEST_ICON = L.divIcon({
  html: `
    <div style="position:relative;width:36px;height:52px">
      <div style="
        width:32px;height:32px;
        background:linear-gradient(135deg,#10b981,#059669);
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:3px solid white;
        box-shadow:0 4px 14px rgba(16,185,129,0.5);
      "></div>
      <div style="
        position:absolute;top:-18px;left:50%;transform:translateX(-50%);
        background:#059669;color:white;
        font-size:8px;font-weight:800;padding:2px 5px;border-radius:4px;
        white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.25);
      ">📍 DEST</div>
    </div>
  `,
  className: '',
  iconSize: [32, 52],
  iconAnchor: [16, 32],
})

// Auto-fit map bounds to show all pins
function MapBoundsAutoFit({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (!positions || positions.length === 0) return
    if (positions.length === 1) {
      map.setView(positions[0], 15)
    } else {
      map.fitBounds(positions, { padding: [50, 50] })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(positions), map])
  return null
}

// Listens for map clicks to drop/move the destination pin
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

const GEO_STATES = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  GRANTED: 'granted',
  DENIED: 'denied',
}

/**
 * LocationPicker
 * Props:
 *  - value: { lat, lng } | null          ← destination pin
 *  - onChange: (coords | null) => void
 *  - isDarkMode: boolean
 *  - originPin: { lat, lng, name? } | null  ← optional Pin 1 (e.g. Distribution Hub)
 *  - originLabel: string                 ← label for Pin 1
 *
 * ─── Optional geofencing (all optional — omitting them keeps the map exactly
 *     as it behaves today, e.g. for FoodAidPage's city-wide delivery picker) ───
 *  - boundaryGeoJSON: GeoJSON Polygon Feature | null
 *      When provided: drawn as an outline on the map, AND used to validate
 *      every click/drag/GPS-fix — points outside it are rejected instead of
 *      being placed.
 *  - boundaryBounds: [[southLat,westLng],[northLat,eastLng]] | null
 *      Leaflet `maxBounds` — panning/dragging beyond this elastically
 *      bounces back. Should fully contain `boundaryGeoJSON`.
 *  - lockCenter: [lat, lng] | null   ← permanent map center
 *  - lockZoom: { initial, min, max } | null
 *  - boundaryLabel: string           ← used in the default rejection message
 *  - outsideBoundaryMessage: string  ← overrides the default rejection message
 *  - pinLabel: string                ← header text (default: "Pin the Delivery Destination")
 *  - pinLabelHint: string            ← small text next to pinLabel (default: "(recommended)"); pass '' to hide
 */
const LocationPicker = ({
  value, onChange, isDarkMode, originPin, originLabel,
  boundaryGeoJSON = null,
  boundaryBounds = null,
  lockCenter = null,
  lockZoom = null,
  boundaryLabel = 'the allowed area',
  outsideBoundaryMessage = null,
  pinLabel = 'Pin the Delivery Destination',
  pinLabelHint = '(recommended)',
}) => {
  const [geoState, setGeoState] = useState(GEO_STATES.IDLE)
  const [mapRef] = useState(() => ({ current: null }))
  const [boundaryWarning, setBoundaryWarning] = useState('')

  const rejectMessage = outsideBoundaryMessage || `Location must be inside ${boundaryLabel}.`

  // Returns true if the given coords pass the boundary check (or if there's
  // no boundary restriction configured at all).
  const isAllowed = useCallback((lat, lng) => {
    if (!boundaryGeoJSON) return true
    return isPointInGeoJSONPolygon(lat, lng, boundaryGeoJSON)
  }, [boundaryGeoJSON])

  // Route info: compute when both origin and destination pins are set
  const routeInfo = (originPin && value)
    ? (() => {
        const distKm = haversineDistance(originPin.lat, originPin.lng, value.lat, value.lng)
        const travelMin = estimateTravelTime(distKm, 'mixed') // conservative default
        return { distKm: distKm.toFixed(2), travelMin }
      })()
    : null

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setGeoState(GEO_STATES.DENIED); return }
    setGeoState(GEO_STATES.REQUESTING)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (!isAllowed(lat, lng)) {
          setBoundaryWarning(`Your current GPS location is outside ${boundaryLabel}. ${rejectMessage}`)
          setGeoState(GEO_STATES.DENIED)
          return
        }
        setBoundaryWarning('')
        onChange({ lat, lng })
        setGeoState(GEO_STATES.GRANTED)
      },
      () => setGeoState(GEO_STATES.DENIED),
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }, [onChange, isAllowed, boundaryLabel, rejectMessage])

  const handleMarkerDrag = useCallback((e) => {
    const { lat, lng } = e.target.getLatLng()
    if (!isAllowed(lat, lng)) {
      setBoundaryWarning(rejectMessage)
      // Snap the marker back — don't call onChange, so on re-render the
      // Marker's `position` prop (driven by `value`) reverts it visually.
      if (value) e.target.setLatLng([value.lat, value.lng])
      return
    }
    setBoundaryWarning('')
    onChange({ lat, lng })
  }, [onChange, isAllowed, rejectMessage, value])

  const handleMapClick = useCallback((coords) => {
    if (!isAllowed(coords.lat, coords.lng)) {
      setBoundaryWarning(rejectMessage)
      return
    }
    setBoundaryWarning('')
    onChange(coords)
    if (geoState === GEO_STATES.IDLE) setGeoState(GEO_STATES.GRANTED)
  }, [onChange, geoState, isAllowed, rejectMessage])

  const handleReset = () => { onChange(null); setGeoState(GEO_STATES.IDLE); setBoundaryWarning('') }

  // Build positions list for auto-fit bounds
  const boundsPositions = [
    ...(originPin ? [[originPin.lat, originPin.lng]] : []),
    ...(value     ? [[value.lat,     value.lng    ]] : []),
  ]

  // Default map center: locked center (when geofenced) > origin hub > Toledo City
  const defaultCenter = lockCenter || (originPin ? [originPin.lat, originPin.lng] : [10.3770, 123.6410])
  const mapCenter     = lockCenter || (value ? [value.lat, value.lng] : defaultCenter)

  return (
    <div className="space-y-3">

      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className={`text-sm font-semibold flex items-center space-x-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          <MapPin className="w-4 h-4 text-green-500" />
          <span>{pinLabel}</span>
          {pinLabelHint && <span className={`text-xs font-normal ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{pinLabelHint}</span>}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleReset}
            className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg transition ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Dual-pin legend — only shown when originPin is provided */}
      {originPin && (
        <div className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 px-3 py-2.5 rounded-xl text-xs border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center space-x-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow flex-shrink-0" />
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              <span className="font-bold">Pin 1 (Origin):</span> {originLabel || 'Distribution Hub'}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow flex-shrink-0" />
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              <span className="font-bold">Pin 2 (Destination):</span> {value ? 'Set ✓' : 'Click map to set'}
            </span>
          </div>
        </div>
      )}

      {/* Route distance badge — visible when both pins are set */}
      {routeInfo && (
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${isDarkMode ? 'bg-blue-950/40 border-blue-800/40' : 'bg-blue-50 border-blue-200'}`}>
          <div className={`flex items-center space-x-2 text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            <Truck className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Estimated route from origin to destination</span>
          </div>
          <div className={`flex items-center gap-3 text-xs font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            <span>🛣 {routeInfo.distKm} km</span>
            <span className="font-normal opacity-80">~{routeInfo.travelMin} min</span>
          </div>
        </div>
      )}

      {/* GPS button (idle state) */}
      {geoState === GEO_STATES.IDLE && (
        <div className={`${isDarkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-3 text-center space-y-2`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Use GPS to auto-set your location as the destination, or click anywhere on the map.
          </p>
          <button
            type="button"
            onClick={requestLocation}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-md"
          >
            <Navigation className="w-4 h-4" />
            <span>Use My Location (GPS)</span>
          </button>
        </div>
      )}

      {geoState === GEO_STATES.REQUESTING && (
        <div className={`${isDarkMode ? 'bg-blue-950/30 border-blue-800/50' : 'bg-blue-50 border-blue-200'} border rounded-xl p-3 flex items-center space-x-3`}>
          <Loader2 className="w-5 h-5 animate-spin text-blue-500 flex-shrink-0" />
          <div>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Requesting location…</p>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>Please allow access when your browser asks.</p>
          </div>
        </div>
      )}

      {geoState === GEO_STATES.DENIED && (
        <div className={`${isDarkMode ? 'bg-red-950/30 border-red-800/50' : 'bg-red-50 border-red-200'} border rounded-xl p-3 flex items-start space-x-3`}>
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>Location access denied</p>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
              Click on the map below to drop a destination pin manually.
            </p>
          </div>
          <button
            type="button"
            onClick={requestLocation}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition ${isDarkMode ? 'bg-red-900/60 hover:bg-red-800 text-red-300' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
          >
            Retry
          </button>
        </div>
      )}

      {/* Boundary rejection banner */}
      {boundaryWarning && (
        <div className={`${isDarkMode ? 'bg-amber-950/30 border-amber-800/50' : 'bg-amber-50 border-amber-200'} border rounded-xl p-3 flex items-start space-x-3`}>
          <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className={`text-sm font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
            {boundaryWarning}
          </p>
        </div>
      )}

      {/* Destination coordinates display */}
      {value && (
        <div className={`${isDarkMode ? 'bg-green-950/30 border-green-800/50' : 'bg-green-50 border-green-200'} border rounded-xl px-4 py-2.5 flex items-center justify-between flex-wrap gap-2`}>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className={`text-xs font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Destination pin set</span>
          </div>
          <code className={`text-xs font-mono ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </code>
          <a
            href={`https://maps.google.com/?q=${value.lat},${value.lng}`}
            target="_blank"
            rel="noreferrer"
            className={`text-xs underline ${isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-700 hover:text-green-900'}`}
          >
            Open in Maps ↗
          </a>
        </div>
      )}

      {/* Interactive map — always visible */}
      <div
        className="rounded-xl overflow-hidden shadow-lg"
        style={{ height: 300, border: '2px solid rgba(16,185,129,0.35)' }}
      >
        <MapContainer
          center={mapCenter}
          zoom={lockZoom?.initial ?? (value ? 14 : 13)}
          minZoom={lockZoom?.min}
          maxZoom={lockZoom?.max}
          maxBounds={boundaryBounds || undefined}
          maxBoundsViscosity={boundaryBounds ? 1.0 : undefined}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(map) => { mapRef.current = map }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />

          {/* Auto-fit to show both pins (skipped when the map is locked to a boundary) */}
          {!lockCenter && boundsPositions.length > 0 && (
            <MapBoundsAutoFit positions={boundsPositions} />
          )}

          {/* Boundary outline — semi-transparent, purely visual guide */}
          {boundaryGeoJSON && (
            <GeoJSON
              data={boundaryGeoJSON}
              style={{ color: '#2563eb', weight: 3, fillOpacity: 0.08 }}
            />
          )}

          {/* Pin 1: Origin hub (blue) — fixed */}
          {originPin && (
            <Marker position={[originPin.lat, originPin.lng]} icon={HUB_ICON} />
          )}

          {/* Route polyline — dashed blue line from origin to destination */}
          {originPin && value && (
            <Polyline
              positions={[[originPin.lat, originPin.lng], [value.lat, value.lng]]}
              color="#3b82f6"
              weight={3}
              dashArray="10, 8"
              opacity={0.85}
            />
          )}

          {/* Pin 2: Destination (green) — draggable */}
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={DEST_ICON}
              draggable={true}
              eventHandlers={{ dragend: handleMarkerDrag }}
            />
          )}
        </MapContainer>
      </div>

      <p className={`text-xs text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {boundaryGeoJSON
          ? `📍 Click inside the outlined area to drop a pin. Map is locked to ${boundaryLabel}.`
          : originPin
            ? '🔵 Blue = Distribution Hub (origin)  ·  🟢 Green = Delivery destination. Click map or drag pin to adjust.'
            : '📍 Click on the map to drop a pin, or drag the pin to adjust the location.'}
      </p>
    </div>
  )
}

export default LocationPicker