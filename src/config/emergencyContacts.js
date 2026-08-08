// Centralized emergency contact configuration for SmartCo.
//
// ── VERIFIED NUMBERS ─────────────────────────────────────────────────────
// - `general` (911) was already used elsewhere in the app (ReportEmergencyPage's
//   existing "Call 911" hotline button/stat), so it is reused here as-is.
// - `barangay` reuses the contact number already listed on HelpSupportPage
//   ("Call Us" / +63 32 461 1234). That number is presented there as SmartCo's/
//   the Barangay's general contact line, not specifically labeled as an
//   emergency-response number — reuse it with that caveat in mind.
//
// ── NOT VERIFIED ─────────────────────────────────────────────────────────
// `medical`, `fire`, and `police` do NOT have distinct, verified direct lines
// anywhere in this codebase. In the Philippines, 911 is the standard national
// emergency number that routes to medical/fire/police dispatch, so each of
// these currently falls back to 911 rather than a fabricated direct line.
//
// ⚠️ IMPORTANT: If Barangay Ilihan / Toledo City has its own dedicated
// medical, fire (Bureau of Fire Protection), police (PNP station), or
// Barangay Emergency Response Team numbers, replace the `number` fields
// below with those officially verified numbers. Do not ship this to
// production with unverified contact info.

const GENERAL_EMERGENCY_NUMBER = '911' // Already used in ReportEmergencyPage
const BARANGAY_CONTACT_NUMBER = '+6332461234' // Already used in HelpSupportPage ("Call Us")

const emergencyContacts = {
  general: {
    key: 'general',
    name: 'Emergency Hotline',
    number: GENERAL_EMERGENCY_NUMBER,
    verified: true,
  },
  medical: {
    key: 'medical',
    name: 'Medical Emergency',
    // No distinct verified medical dispatch line exists in the codebase —
    // falls back to the national 911 hotline.
    number: GENERAL_EMERGENCY_NUMBER,
    verified: false,
  },
  fire: {
    key: 'fire',
    name: 'Fire Emergency',
    // No distinct verified Bureau of Fire Protection line exists in the
    // codebase — falls back to the national 911 hotline.
    number: GENERAL_EMERGENCY_NUMBER,
    verified: false,
  },
  police: {
    key: 'police',
    name: 'Police Emergency',
    // No distinct verified PNP station line exists in the codebase —
    // falls back to the national 911 hotline.
    number: GENERAL_EMERGENCY_NUMBER,
    verified: false,
  },
  barangay: {
    key: 'barangay',
    name: 'Barangay Emergency',
    // Reused from HelpSupportPage's "Call Us" contact — verify this is
    // actually monitored for emergencies before relying on it as such.
    number: BARANGAY_CONTACT_NUMBER,
    verified: false,
  },
}

// tel: links must not contain spaces/parentheses for maximum device
// compatibility — this strips everything except a leading + and digits.
export const toTelHref = (number) => `tel:${String(number).replace(/[^\d+]/g, '')}`

export default emergencyContacts
