import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, AlertCircle, CheckCircle2, Loader2, RotateCcw } from 'lucide-react'

// Fix Leaflet default icon broken by Vite bundler
const pinIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Custom red icon for emergencies
const emergencyIcon = L.divIcon({
  html: `<div style="
    width:32px;height:32px;
    background:linear-gradient(135deg,#dc2626,#ea580c);
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  className: '',
})

// Internal component: listens for map clicks to move the marker
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

// Internal component: re-centers map when coords change externally
const MapAutoCenter = ({ coords, mapRef }) => {
  useEffect(() => {
    if (mapRef.current && coords) {
      mapRef.current.setView([coords.lat, coords.lng], 17)
    }
  }, [coords, mapRef])
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
 *  - value: { lat, lng } | null
 *  - onChange: (coords: { lat, lng } | null) => void
 *  - isDarkMode: boolean
 */
const LocationPicker = ({ value, onChange, isDarkMode }) => {
  const [geoState, setGeoState] = useState(GEO_STATES.IDLE)
  const [mapRef] = useState(() => ({ current: null }))

  const card = `${isDarkMode
    ? 'bg-gray-900/95 border-gray-700/50'
    : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border`

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoState(GEO_STATES.DENIED)
      return
    }
    setGeoState(GEO_STATES.REQUESTING)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        onChange(coords)
        setGeoState(GEO_STATES.GRANTED)
      },
      () => {
        setGeoState(GEO_STATES.DENIED)
      },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }, [onChange])

  const handleMarkerDrag = useCallback((e) => {
    const { lat, lng } = e.target.getLatLng()
    onChange({ lat, lng })
  }, [onChange])

  const handleMapClick = useCallback((coords) => {
    onChange(coords)
    if (geoState === GEO_STATES.IDLE) setGeoState(GEO_STATES.GRANTED)
  }, [onChange, geoState])

  const handleReset = () => {
    onChange(null)
    setGeoState(GEO_STATES.IDLE)
  }

  // Default center: Toledo City, Cebu, Philippines
  const defaultCenter = [10.3770, 123.6410]
  const mapCenter = value ? [value.lat, value.lng] : defaultCenter

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className={`text-sm font-semibold flex items-center space-x-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          <MapPin className="w-4 h-4 text-red-500" />
          <span>Pinpoint Exact Location</span>
          <span className={`text-xs font-normal ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>(optional but recommended)</span>
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

      {/* Get Location Button */}
      {geoState === GEO_STATES.IDLE && (
        <div className={`${isDarkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 text-center space-y-3`}>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Click the button to use your device's GPS, or click anywhere on the map below to drop a pin manually.
          </div>
          <button
            type="button"
            onClick={requestLocation}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-md"
          >
            <Navigation className="w-4 h-4" />
            <span>Use My Location (GPS)</span>
          </button>
        </div>
      )}

      {geoState === GEO_STATES.REQUESTING && (
        <div className={`${isDarkMode ? 'bg-blue-950/30 border-blue-800/50' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4 flex items-center space-x-3`}>
          <Loader2 className="w-5 h-5 animate-spin text-blue-500 flex-shrink-0" />
          <div>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Requesting location…</p>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>Please allow access when your browser asks.</p>
          </div>
        </div>
      )}

      {geoState === GEO_STATES.DENIED && (
        <div className={`${isDarkMode ? 'bg-red-950/30 border-red-800/50' : 'bg-red-50 border-red-200'} border rounded-xl p-4 flex items-start space-x-3`}>
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>Location access denied</p>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
              You can still drop a pin manually by clicking on the map below.
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

      {/* Coordinates display */}
      {value && (
        <div className={`${isDarkMode ? 'bg-green-950/30 border-green-800/50' : 'bg-green-50 border-green-200'} border rounded-xl px-4 py-2.5 flex items-center justify-between flex-wrap gap-2`}>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className={`text-xs font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Pin set</span>
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
            Open in Google Maps ↗
          </a>
        </div>
      )}

      {/* Interactive Map — always visible so user can click to drop pin */}
      <div className="rounded-xl overflow-hidden border-2 border-red-500/30 shadow-lg" style={{ height: 300 }}>
        <MapContainer
          center={mapCenter}
          zoom={value ? 17 : 14}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(map) => { mapRef.current = map }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={emergencyIcon}
              draggable={true}
              eventHandlers={{ dragend: handleMarkerDrag }}
            />
          )}
        </MapContainer>
      </div>
      <p className={`text-xs text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        📍 Click on the map to drop a pin, or drag the pin to adjust the location.
      </p>
    </div>
  )
}

export default LocationPicker
