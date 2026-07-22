
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import { PUROKS_ILIHAN } from '../constants/puroks'

// Helper to check if demo data exists
async function isDemoDataInitialized() {
  try {
    const eventsSnapshot = await getDocs(collection(db, 'events'))
    const foodAidSnapshot = await getDocs(collection(db, 'foodAid'))
    
    // If there's already some data, assume demo data is initialized
    return eventsSnapshot.size > 0 || foodAidSnapshot.size > 0
  } catch (error) {
    console.error('Error checking demo data:', error)
    return false
  }
}

// Initialize demo data for the app
export const initializeDemoData = async () => {
  try {
    // Check if data is already initialized
    const isInitialized = await isDemoDataInitialized()
    if (isInitialized) {
      console.log('Demo data already exists')
      return
    }

    console.log('Initializing demo data...')

    // Note: Demo users must be registered through Firebase Authentication
    // You can register them manually or through the registration page:
    // 1. Email: juan@smartco.ph | Password: password123 | Role: official | Purok: Sitio Proper Ilihan
    // 2. Email: maria@smartco.ph | Password: password123 | Role: health | Purok: Cabulihan Uno
    // 3. Email: pedro@smartco.ph | Password: password123 | Role: volunteer | Purok: Cabulihan Dos

    // Create demo events (these don't require user authentication)
    const demoEvents = [
      {
        title: 'Basketball Tournament 2026',
        category: 'Sports',
        date: '2026-02-15',
        time: '09:00',
        duration: 'Full day',
        venue: 'Barangay Ilihan Court',
        expectedAttendees: 50,
        description: 'Annual basketball tournament for all areas of Barangay Ilihan',
        status: 'upcoming',
        attendees: [],
        createdBy: 'demo',
        createdAt: new Date('2026-01-20').toISOString(),
        updatedAt: new Date('2026-01-20').toISOString()
      },
      {
        title: 'Health Check-up Drive',
        category: 'Health',
        date: '2026-02-01',
        time: '08:00',
        duration: 'Half day',
        venue: 'Barangay Ilihan Hall',
        expectedAttendees: 60,
        description: 'Free health checkup for senior citizens in Barangay Ilihan',
        status: 'upcoming',
        attendees: [],
        createdBy: 'demo',
        createdAt: new Date('2026-01-18').toISOString(),
        updatedAt: new Date('2026-01-18').toISOString()
      },
      {
        title: 'Barangay Ilihan Clean-up',
        category: 'Community Service',
        date: '2026-02-08',
        time: '06:00',
        duration: '3 hours',
        venue: 'All Areas',
        expectedAttendees: 80,
        description: 'Monthly community cleanup drive for Barangay Ilihan',
        status: 'upcoming',
        attendees: [],
        createdBy: 'demo',
        createdAt: new Date('2026-01-15').toISOString(),
        updatedAt: new Date('2026-01-15').toISOString()
      }
    ]

    // Create demo food aid schedules
    const demoFoodAid = [
      {
        purok: PUROKS_ILIHAN[0],
        date: '2026-02-01',
        totalFamilies: 24,
        deliveredFamilies: 24,
        status: 'completed',
        route: 'Main Road â†’ Street A â†’ Street B',
        createdBy: 'demo',
        createdAt: new Date('2026-01-15').toISOString(),
        updatedAt: new Date('2026-01-15').toISOString()
      },
      {
        purok: PUROKS_ILIHAN[1],
        date: '2026-02-02',
        totalFamilies: 18,
        deliveredFamilies: 18,
        status: 'completed',
        route: 'Main Road â†’ Street C',
        createdBy: 'demo',
        createdAt: new Date('2026-01-16').toISOString(),
        updatedAt: new Date('2026-01-16').toISOString()
      },
      {
        purok: PUROKS_ILIHAN[2],
        date: '2026-02-03',
        totalFamilies: 31,
        deliveredFamilies: 21,
        status: 'in-progress',
        route: 'Main Road â†’ Street D â†’ Street E â†’ Street F',
        createdBy: 'demo',
        createdAt: new Date('2026-01-17').toISOString(),
        updatedAt: new Date('2026-01-17').toISOString()
      },
      {
        purok: PUROKS_ILIHAN[3],
        date: '2026-02-05',
        totalFamilies: 28,
        deliveredFamilies: 10,
        status: 'in-progress',
        route: 'Main Road â†’ Street G â†’ Street H',
        createdBy: 'demo',
        createdAt: new Date('2026-01-18').toISOString(),
        updatedAt: new Date('2026-01-18').toISOString()
      },
      {
        purok: PUROKS_ILIHAN[4],
        date: '2026-02-08',
        totalFamilies: 22,
        deliveredFamilies: 0,
        status: 'scheduled',
        route: 'Main Road â†’ Street I',
        createdBy: 'demo',
        createdAt: new Date('2026-01-19').toISOString(),
        updatedAt: new Date('2026-01-19').toISOString()
      }
    ]

    // Add events to Firestore
    for (const event of demoEvents) {
      await addDoc(collection(db, 'events'), event)
    }

    // Add food aid schedules to Firestore
    for (const schedule of demoFoodAid) {
      await addDoc(collection(db, 'foodAid'), schedule)
    }

    console.log('âœ… Demo data initialized successfully!')
    console.log('\nðŸ“ To use the app, please register demo accounts:')
    console.log('1. Email: juan@smartco.ph | Password: password123 | Role: official | Purok: Sitio Proper Ilihan')
    console.log('2. Email: maria@smartco.ph | Password: password123 | Role: health | Purok: Cabulihan Uno')
    console.log('3. Email: pedro@smartco.ph | Password: password123 | Role: volunteer | Purok: Cabulihan Dos')
  } catch (error) {
    console.error('Error initializing demo data:', error)
    console.log('\nâš ï¸ Could not initialize demo data. This is normal if:')
    console.log('- Firebase is not configured yet')
    console.log('- You are not connected to the internet')
    console.log('- Firestore security rules are not set up')
    console.log('\nYou can still use the app by registering a new account!')
  }
}

