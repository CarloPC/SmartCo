/**
 * Barangay Ilihan, Toledo City, Cebu — Boundary Data
 * ─────────────────────────────────────────────────────────────────────────
 * ⚠️ APPROXIMATION NOTICE
 * No official/authoritative GeoJSON polygon for Barangay Ilihan's boundary
 * (e.g. from the Toledo City Planning & Development Office, PhilGIS, or an
 * official OpenStreetMap boundary relation) was available at the time this
 * file was generated. The polygon below is an APPROXIMATE boundary, hand
 * built around Barangay Ilihan's centroid — verified against the Toledo
 * City Hall / Barangay Ilihan location (~10.3808–10.3820 N, 123.6594–
 * 123.6604 E per PhilAtlas and public geocoding sources) — with a radius
 * roughly matching the built-up area of the barangay.
 *
 * It is good enough to demo real geofencing (map lock, bounds, marker
 * validation, submission validation) for the capstone defense, but it is
 * NOT survey-accurate and should not be used to make real boundary/legal
 * decisions.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * HOW TO REPLACE THIS WITH THE OFFICIAL BOUNDARY LATER
 * Nothing outside this file needs to change. Every consumer (LocationPicker,
 * ReportEmergencyPage, emergencyService, etc.) imports the named exports
 * below — `ilihanBoundary` (GeoJSON Feature) and `ILIHAN_BOUNDS_LATLNG`
 * (Leaflet-ready bounds array) — not raw coordinates. So to upgrade:
 *
 *   1. Get the official polygon (ideally as GeoJSON) from the Barangay/City
 *      Planning Office, PhilGIS, PSA, or a verified OSM boundary relation.
 *   2. Replace the `coordinates` array inside `ilihanBoundary` below with
 *      the official ring — an array of [lng, lat] pairs, first and last
 *      point identical (a closed ring), still wrapped in one extra array
 *      (GeoJSON Polygon coordinates are `[ [ [lng,lat], ... ] ]`).
 *   3. Leave everything else (exports, helper functions, this file's path)
 *      exactly as-is so no other file needs to change.
 */

// Approximate boundary polygon for Barangay Ilihan, Toledo City, Cebu.
// GeoJSON coordinates are [longitude, latitude], per the GeoJSON spec.
export const ilihanBoundary = {
  type: 'Feature',
  properties: {
    name: 'Barangay Ilihan',
    municipality: 'Toledo City',
    province: 'Cebu',
    country: 'Philippines',
    source: 'approximate — generated, not an official survey boundary',
  },
  geometry: {
    type: 'Polygon',
   // Replace ONLY the coordinates array

coordinates: [
  [
    [123.65740, 10.38695], // NW
    [123.65905, 10.38765],
    [123.66130, 10.38755],
    [123.66360, 10.38680],
    [123.66555, 10.38510],
    [123.66595, 10.38290],
    [123.66520, 10.38070],
    [123.66380, 10.37870],
    [123.66215, 10.37695],
    [123.66010, 10.37595],
    [123.65820, 10.37630],
    [123.65670, 10.37760],
    [123.65555, 10.37930],
    [123.65510, 10.38135],
    [123.65555, 10.38360],
    [123.65640, 10.38540],
    [123.65740, 10.38695] // close polygon
  ]
]
  },
}

// The same ring, as [lat, lng] pairs — the order Leaflet/react-leaflet
// (Polygon, Marker, bounds, etc.) expects.
export const ILIHAN_BOUNDARY_LATLNG = ilihanBoundary.geometry.coordinates[0].map(
  ([lng, lat]) => [lat, lng]
)

// A rectangular "safety net" a little larger than the polygon above, used
// for Leaflet's `maxBounds` (which only accepts a rectangle). Dragging is
// elastically bounced back at this rectangle; the *actual* allowed area for
// placing a marker is the polygon itself, checked with point-in-polygon
// logic (see `isPointInIlihan` in `src/utils/locationUtils.js`).
const lats = ILIHAN_BOUNDARY_LATLNG.map(([lat]) => lat)
const lngs = ILIHAN_BOUNDARY_LATLNG.map(([, lng]) => lng)
const PAD = 0.0015 // ~150m padding so the polygon isn't flush against the edge

export const ILIHAN_BOUNDS_LATLNG = [
  [Math.min(...lats) - PAD, Math.min(...lngs) - PAD], // south-west corner
  [Math.max(...lats) + PAD, Math.max(...lngs) + PAD], // north-east corner
]

// Center point to permanently focus the map on (mirrors barangayConfig.js).
export const ILIHAN_CENTER_LATLNG = [10.3820, 123.6604]

export default ilihanBoundary