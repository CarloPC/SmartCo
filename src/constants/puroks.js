
/**
 * Barangay Ilihan Puroks (Areas)
 * 
 * This is the central source of truth for all official areas in Barangay Ilihan.
 * All references to areas throughout the application should import from this file.
 * 
 * These are the official area names for Barangay Ilihan, Toledo City, Cebu.
 * Do not hardcode these names anywhere else in the codebase.
 */

export const PUROKS_ILIHAN = [
  'Sitio Proper Ilihan',
  'Cabulihan Uno',
  'Cabulihan Dos',
  'Sitio Mangga',
  'Sambag Ilihan',
]

/**
 * Kept as an alias of PUROKS_ILIHAN for backward compatibility with existing
 * imports (e.g. charts, dropdowns) that expect a "short label" list. The
 * official area names above are already concise, so no separate short form
 * is needed.
 */
export const PUROKS_SHORT = [...PUROKS_ILIHAN]

/**
 * Helper function to get the full/display area name.
 * Kept for backward compatibility with existing call sites; since area
 * names are now the official names themselves, this is effectively an
 * identity function (it still normalizes missing values to 'Unassigned').
 */
export const getFullPurokName = (purok) => {
  if (!purok) return 'Unassigned'
  return purok
}

/**
 * Helper function to get the short/compact area name.
 * Kept for backward compatibility with existing call sites; since area
 * names are now the official names themselves, this is effectively an
 * identity function (it still normalizes missing values to 'Unassigned').
 */
export const getShortPurokName = (purok) => {
  if (!purok) return 'Unassigned'
  return purok
}

export default PUROKS_ILIHAN

