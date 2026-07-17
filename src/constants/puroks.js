/**
 * Barangay Ilihan Puroks
 * 
 * This is the central source of truth for all puroks in Barangay Ilihan.
 * All references to puroks throughout the application should import from this file.
 * 
 * NOTE: These are placeholder names. Once official purok names from Barangay Hall are available,
 * replace the placeholder values with the official names. Do not hardcode puroks anywhere else.
 */

export const PUROKS_ILIHAN = [
  'Purok 1 - [Pending Official Name]',
  'Purok 2 - [Pending Official Name]',
  'Purok 3 - [Pending Official Name]',
  'Purok 4 - [Pending Official Name]',
  'Purok 5 - [Pending Official Name]',
  'Purok 6 - [Pending Official Name]',
]

/**
 * Short labels for charts, dropdowns, and compact displays
 */
export const PUROKS_SHORT = [
  'Purok 1',
  'Purok 2',
  'Purok 3',
  'Purok 4',
  'Purok 5',
  'Purok 6',
]

/**
 * Helper function to get the full purok name
 */
export const getFullPurokName = (purok) => {
  if (!purok) return 'Unassigned'
  
  // If it's just a number, get the full name
  const index = parseInt(purok.replace('Purok ', '')) - 1
  if (!isNaN(index) && PUROKS_ILIHAN[index]) {
    return PUROKS_ILIHAN[index]
  }
  
  // If it's already a full name, return it
  return purok
}

/**
 * Helper function to get the short purok name
 */
export const getShortPurokName = (purok) => {
  if (!purok) return 'Unassigned'
  
  // Extract just "Purok N"
  const match = purok.match(/Purok \d+/)
  return match ? match[0] : purok
}

export default PUROKS_ILIHAN
