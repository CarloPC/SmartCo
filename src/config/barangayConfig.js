/**
 * Central Barangay Configuration
 * This file contains all barangay-specific information used throughout the application.
 * It is designed to be maintainable and easily updatable without searching through the codebase.
 */

export const BARANGAY_CONFIG = {
  // Barangay Information
  barangayName: 'Ilihan',
  municipality: 'Toledo City',
  province: 'Cebu',
  country: 'Philippines',
  
  // Full display names for UI
  fullBarangayName: 'Barangay Ilihan',
  fullAddress: 'Barangay Ilihan, Toledo City, Cebu, Philippines',
  
  // Health Services
  healthCenterName: 'Barangay Ilihan Health Center',
  
  // Application Information
  applicationName: 'SmartCo',
  applicationTagline: 'Smart Barangay Management System',
  applicationScope: 'Barangay Ilihan Only',
  implementationArea: 'Barangay Ilihan, Toledo City, Cebu',
  
  // Default Coordinates (Barangay Ilihan, Toledo City)
  // Verified against Toledo City Hall / Barangay Ilihan location
  // (~10.3808–10.3820 N, 123.6594–123.6604 E per PhilAtlas and public
  // geocoding sources). Previous values (10.3321, 123.6187) actually
  // pointed at neighboring Barangay Awihao.
  defaultCoordinates: {
    lat: 10.3820,
    lng: 123.6604,
  },
  
  // Distribution Hub (Barangay Hall)
  distributionHub: {
    name: 'Barangay Ilihan Hall',
    lat: 10.3820,
    lng: 123.6604,
  },
  
  // Multi-barangay expansion flag (currently false)
  // Set to true in future if expanding to support multiple barangays
  supportsMultipleBarangays: false,
  
  // Deployment Information
  deploymentVersion: '1.0.0',
  deploymentYear: 2026,
  
  // Contact Information
  contactEmail: 'support@smartco-ilihan.ph',
  contactPhone: '+63 (0) 32 XXXX XXXX',
}

export default BARANGAY_CONFIG