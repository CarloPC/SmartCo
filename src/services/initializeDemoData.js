import { collection, getDocs, addDoc, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'

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
    // 1. Email: juan@smartco.ph | Password: password123 | Role: official | Purok: Purok 1
    // 2. Email: maria@smartco.ph | Password: password123 | Role: health | Purok: Purok 2
    // 3. Email: pedro@smartco.ph | Password: password123 | Role: volunteer | Purok: Purok 3

    // Create demo events (these don't require user authentication)
    const demoEvents = [
      {
        title: 'Basketball Tournament 2026',
        category: 'Sports',
        date: '2026-02-15',
        time: '09:00',
        duration: 'Full day',
        venue: 'Barangay Court',
        expectedAttendees: 50,
        description: 'Annual basketball tournament for all puroks',
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
        venue: 'Barangay Hall',
        expectedAttendees: 60,
        description: 'Free health checkup for senior citizens',
        status: 'upcoming',
        attendees: [],
        createdBy: 'demo',
        createdAt: new Date('2026-01-18').toISOString(),
        updatedAt: new Date('2026-01-18').toISOString()
      },
      {
        title: 'Community Clean-up',
        category: 'Community Service',
        date: '2026-02-08',
        time: '06:00',
        duration: '3 hours',
        venue: 'All Puroks',
        expectedAttendees: 80,
        description: 'Monthly community cleanup drive',
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
        purok: 'Purok 1',
        date: '2026-02-01',
        totalFamilies: 24,
        deliveredFamilies: 24,
        status: 'completed',
        route: 'Main Road → Street A → Street B',
        createdBy: 'demo',
        createdAt: new Date('2026-01-15').toISOString(),
        updatedAt: new Date('2026-01-15').toISOString()
      },
      {
        purok: 'Purok 2',
        date: '2026-02-02',
        totalFamilies: 18,
        deliveredFamilies: 18,
        status: 'completed',
        route: 'Main Road → Street C',
        createdBy: 'demo',
        createdAt: new Date('2026-01-16').toISOString(),
        updatedAt: new Date('2026-01-16').toISOString()
      },
      {
        purok: 'Purok 3',
        date: '2026-02-03',
        totalFamilies: 31,
        deliveredFamilies: 21,
        status: 'in-progress',
        route: 'Main Road → Street D → Street E → Street F',
        createdBy: 'demo',
        createdAt: new Date('2026-01-17').toISOString(),
        updatedAt: new Date('2026-01-17').toISOString()
      },
      {
        purok: 'Purok 4',
        date: '2026-02-05',
        totalFamilies: 28,
        deliveredFamilies: 10,
        status: 'in-progress',
        route: 'Main Road → Street G → Street H',
        createdBy: 'demo',
        createdAt: new Date('2026-01-18').toISOString(),
        updatedAt: new Date('2026-01-18').toISOString()
      },
      {
        purok: 'Purok 5',
        date: '2026-02-08',
        totalFamilies: 22,
        deliveredFamilies: 0,
        status: 'scheduled',
        route: 'Main Road → Street I',
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

    console.log('✅ Demo data initialized successfully!')
    console.log('\n📝 To use the app, please register demo accounts:')
    console.log('1. Email: juan@smartco.ph | Password: password123 | Role: official | Purok: Purok 1')
    console.log('2. Email: maria@smartco.ph | Password: password123 | Role: health | Purok: Purok 2')
    console.log('3. Email: pedro@smartco.ph | Password: password123 | Role: volunteer | Purok: Purok 3')
  } catch (error) {
    console.error('Error initializing demo data:', error)
    console.log('\n⚠️ Could not initialize demo data. This is normal if:')
    console.log('- Firebase is not configured yet')
    console.log('- You are not connected to the internet')
    console.log('- Firestore security rules are not set up')
    console.log('\nYou can still use the app by registering a new account!')
  }
}
