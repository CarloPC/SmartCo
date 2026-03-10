// Toledo City, Cebu – Barangay GPS data
export const TOLEDO_BARANGAYS = [
  { id: 'poblacion',       name: 'Poblacion',              lat: 10.3737, lng: 123.6384, terrain: 'flat',        accessibility: 'excellent', hub: true },
  { id: 'cantabaco',       name: 'Cantabaco',              lat: 10.3508, lng: 123.6073, terrain: 'hilly',       accessibility: 'good' },
  { id: 'lutopan',         name: 'Lutopan',                lat: 10.3212, lng: 123.6492, terrain: 'mixed',       accessibility: 'moderate' },
  { id: 'capayas',         name: 'Capayas',                lat: 10.4003, lng: 123.6201, terrain: 'flat',        accessibility: 'good' },
  { id: 'buanoy',          name: 'Buanoy',                 lat: 10.4215, lng: 123.6523, terrain: 'hilly',       accessibility: 'good' },
  { id: 'malubog',         name: 'Malubog',                lat: 10.3089, lng: 123.5934, terrain: 'mountainous', accessibility: 'moderate' },
  { id: 'bagakay',         name: 'Bagakay',                lat: 10.3825, lng: 123.6547, terrain: 'flat',        accessibility: 'excellent' },
  { id: 'dumlog',          name: 'Dumlog',                 lat: 10.3643, lng: 123.6712, terrain: 'flat',        accessibility: 'good' },
  { id: 'tibag',           name: 'Tibag',                  lat: 10.3456, lng: 123.6234, terrain: 'mixed',       accessibility: 'good' },
  { id: 'subayon',         name: 'Subayon',                lat: 10.3889, lng: 123.6089, terrain: 'flat',        accessibility: 'good' },
  { id: 'ibo',             name: 'Ibo',                    lat: 10.3654, lng: 123.6445, terrain: 'flat',        accessibility: 'excellent' },
  { id: 'ilihan',          name: 'Ilihan',                 lat: 10.3321, lng: 123.6187, terrain: 'hilly',       accessibility: 'moderate' },
  { id: 'capitan-claudio', name: 'Capitan Claudio',        lat: 10.4102, lng: 123.6334, terrain: 'mixed',       accessibility: 'good' },
  { id: 'carolina',        name: 'Carolina',               lat: 10.3876, lng: 123.6621, terrain: 'flat',        accessibility: 'good' },
  { id: 'loay',            name: 'Loay',                   lat: 10.3567, lng: 123.6398, terrain: 'flat',        accessibility: 'good' },
  { id: 'pangamihan',      name: 'Pangamihan',             lat: 10.3412, lng: 123.6156, terrain: 'hilly',       accessibility: 'moderate' },
  { id: 'sagay',           name: 'Sagay',                  lat: 10.4321, lng: 123.6445, terrain: 'flat',        accessibility: 'good' },
  { id: 'san-vicente',     name: 'San Vicente',            lat: 10.4187, lng: 123.6189, terrain: 'mixed',       accessibility: 'good' },
  { id: 'media-once',      name: 'Media Once',             lat: 10.3934, lng: 123.6312, terrain: 'flat',        accessibility: 'good' },
  { id: 'talavera',        name: 'Talavera',               lat: 10.3601, lng: 123.6561, terrain: 'flat',        accessibility: 'excellent' },
]

export const PUROKS_LIST = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6']

// Distribution hub (Barangay Hall at Poblacion)
export const DISTRIBUTION_HUB = { lat: 10.3737, lng: 123.6384, name: 'Poblacion (Barangay Hall)' }

// Purok → approximate barangay coordinates (for enriching legacy data)
export const PUROK_COORDS = {
  'Purok 1': { lat: 10.3737, lng: 123.6384, barangay: 'Poblacion' },
  'Purok 2': { lat: 10.3825, lng: 123.6547, barangay: 'Bagakay' },
  'Purok 3': { lat: 10.3508, lng: 123.6073, barangay: 'Cantabaco' },
  'Purok 4': { lat: 10.3643, lng: 123.6712, barangay: 'Dumlog' },
  'Purok 5': { lat: 10.3889, lng: 123.6089, barangay: 'Subayon' },
  'Purok 6': { lat: 10.4003, lng: 123.6201, barangay: 'Capayas' },
}

/**
 * Haversine great-circle distance (km) between two lat/lng points.
 */
export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371
  const toR = deg => (deg * Math.PI) / 180
  const dLat = toR(lat2 - lat1)
  const dLng = toR(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Returns the nearest Toledo City barangay to given GPS coordinates.
 */
export const detectNearestBarangay = (lat, lng) => {
  let nearest = TOLEDO_BARANGAYS[0]
  let minDist = Infinity
  TOLEDO_BARANGAYS.forEach(b => {
    const d = haversineDistance(lat, lng, b.lat, b.lng)
    if (d < minDist) { minDist = d; nearest = b }
  })
  return { ...nearest, distanceKm: +minDist.toFixed(2) }
}

/**
 * Nearest-neighbour route: greedily visits the closest unvisited destination each step.
 * Returns ordered array of destinations, each with a `distFromPrev` field (km).
 */
export const nearestNeighborRoute = (startLat, startLng, destinations) => {
  if (!destinations.length) return []
  const unvisited = [...destinations]
  const route = []
  let curLat = startLat, curLng = startLng

  while (unvisited.length) {
    let bestIdx = 0, bestDist = Infinity
    unvisited.forEach((d, i) => {
      const dist = haversineDistance(curLat, curLng, d.lat, d.lng)
      if (dist < bestDist) { bestDist = dist; bestIdx = i }
    })
    const next = { ...unvisited.splice(bestIdx, 1)[0], distFromPrev: +bestDist.toFixed(2) }
    route.push(next)
    curLat = next.lat
    curLng = next.lng
  }
  return route
}

/**
 * Estimate travel time in minutes given distance and terrain type.
 */
export const estimateTravelTime = (distanceKm, terrain = 'flat') => {
  const avgKph = { flat: 35, mixed: 25, hilly: 18, mountainous: 12 }
  return Math.ceil((distanceKm / (avgKph[terrain] || 25)) * 60)
}

/**
 * Generate a human-readable route description between two points.
 */
export const getRouteDescription = (fromName, toBarangay) => {
  const dist = haversineDistance(
    DISTRIBUTION_HUB.lat, DISTRIBUTION_HUB.lng,
    toBarangay.lat, toBarangay.lng
  ).toFixed(1)

  const terrainDesc = {
    flat:        'mostly flat, well-paved roads',
    mixed:       'mixed terrain with some elevation changes',
    hilly:       'hilly roads with winding sections and moderate slopes',
    mountainous: 'steep mountain roads — a 4×4 vehicle is recommended',
  }
  const accDesc = {
    excellent: 'Roads are wide and well-maintained throughout.',
    good:      'Standard vehicles can access this barangay.',
    moderate:  'Some sections are narrow — proceed carefully.',
  }

  return `From ${fromName}, travel approximately ${dist} km through ${terrainDesc[toBarangay.terrain] || terrainDesc.flat}. ${accDesc[toBarangay.accessibility] || accDesc.good} Follow barangay road signs toward ${toBarangay.name}.`
}

/**
 * Full AI route analysis for a single distribution target from the hub.
 */
export const generateAIRouteAnalysis = (barangay, date) => {
  const dist = haversineDistance(
    DISTRIBUTION_HUB.lat, DISTRIBUTION_HUB.lng,
    barangay.lat, barangay.lng
  )
  const travelTime = estimateTravelTime(dist, barangay.terrain)
  const risks = []

  if (barangay.terrain === 'hilly' || barangay.terrain === 'mountainous') {
    risks.push({ severity: 'medium', text: 'Steep terrain – use a vehicle with reliable brakes and good ground clearance.' })
  }
  if (barangay.accessibility === 'moderate') {
    risks.push({ severity: 'medium', text: 'Narrow roads – coordinate with local traffic management if needed.' })
  }
  if (dist > 5) {
    risks.push({ severity: 'low', text: `Long distance (${dist.toFixed(1)} km) – ensure adequate fuel and emergency kit on board.` })
  }
  if (date) {
    const day = new Date(date).getDay()
    if (day === 1) risks.push({ severity: 'low', text: 'Monday morning can have heavy traffic near the market area.' })
  }

  let efficiency = 100
  if (barangay.terrain === 'mountainous') efficiency -= 25
  else if (barangay.terrain === 'hilly') efficiency -= 15
  else if (barangay.terrain === 'mixed') efficiency -= 8
  if (barangay.accessibility === 'moderate') efficiency -= 10
  if (dist > 5) efficiency -= 8
  efficiency = Math.max(50, efficiency)

  const departure = travelTime > 30 ? '7:00 AM' : '8:00 AM'

  return {
    distanceKm:         +dist.toFixed(2),
    travelTimeMin:      travelTime,
    terrain:            barangay.terrain,
    accessibility:      barangay.accessibility,
    recommendedDeparture: departure,
    routeDescription:   getRouteDescription(DISTRIBUTION_HUB.name, barangay),
    risks,
    efficiency,
  }
}

/**
 * AI route analysis for a PINPOINTED location.
 * Uses the pin's coordinates as the target; derives terrain/accessibility from the nearest barangay.
 */
export const generatePinpointAIAnalysis = (pinLat, pinLng, nearestBarangay, purok, date) => {
  const dist = haversineDistance(DISTRIBUTION_HUB.lat, DISTRIBUTION_HUB.lng, pinLat, pinLng)
  const terrain = nearestBarangay?.terrain || 'flat'
  const accessibility = nearestBarangay?.accessibility || 'good'
  const travelTime = estimateTravelTime(dist, terrain)
  const risks = []

  if (terrain === 'hilly' || terrain === 'mountainous') {
    risks.push({ severity: 'medium', text: 'Steep terrain – use a vehicle with reliable brakes and good ground clearance.' })
  }
  if (accessibility === 'moderate') {
    risks.push({ severity: 'medium', text: 'Narrow roads – coordinate with local traffic management if needed.' })
  }
  if (dist > 5) {
    risks.push({ severity: 'low', text: `Long distance (${dist.toFixed(1)} km) – ensure adequate fuel and emergency kit on board.` })
  }
  if (date) {
    const day = new Date(date).getDay()
    if (day === 1) risks.push({ severity: 'low', text: 'Monday morning can have heavy traffic near the market area.' })
  }

  let efficiency = 100
  if (terrain === 'mountainous') efficiency -= 25
  else if (terrain === 'hilly') efficiency -= 15
  else if (terrain === 'mixed') efficiency -= 8
  if (accessibility === 'moderate') efficiency -= 10
  if (dist > 5) efficiency -= 8
  efficiency = Math.max(50, efficiency)

  const departure = travelTime > 30 ? '7:00 AM' : '8:00 AM'
  const purokLabel = purok ? ` · ${purok}` : ''
  const areaLabel = (nearestBarangay?.name || 'target area') + purokLabel
  const accessDesc =
    accessibility === 'excellent' ? 'Roads are wide and well-maintained throughout.' :
    accessibility === 'good' ? 'Standard vehicles can access this area.' :
    'Some sections are narrow — proceed carefully.'

  return {
    distanceKm: +dist.toFixed(2),
    travelTimeMin: travelTime,
    terrain,
    accessibility,
    recommendedDeparture: departure,
    routeDescription: `From ${DISTRIBUTION_HUB.name}, travel approximately ${dist.toFixed(1)} km to the pinpointed delivery location in ${areaLabel}. The area has ${terrain} terrain. ${accessDesc} Navigate to the dropped pin on the map for the precise delivery point.`,
    risks,
    efficiency,
    isPinpointed: true,
  }
}

/**
 * Wraps navigator.geolocation.getCurrentPosition in a Promise.
 */
export const getPositionAsync = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos =>
        resolve({
          lat:      pos.coords.latitude,
          lng:      pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    )
  })
