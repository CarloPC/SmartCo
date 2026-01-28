import storageService from './storageService'

// Initialize demo data for the app
export const initializeDemoData = () => {
  // Check if data is already initialized
  if (storageService.get('demo_data_initialized')) {
    return
  }

  // Create demo users
  const demoUsers = [
    {
      id: 'user_demo_1',
      fullName: 'Juan Dela Cruz',
      email: 'juan@smartco.ph',
      phone: '+63 912 345 6789',
      role: 'official',
      purok: 'purok1',
      password: 'password123',
      createdAt: new Date('2026-01-01').toISOString()
    },
    {
      id: 'user_demo_2',
      fullName: 'Maria Santos',
      email: 'maria@smartco.ph',
      phone: '+63 923 456 7890',
      role: 'health',
      purok: 'purok2',
      password: 'password123',
      createdAt: new Date('2026-01-05').toISOString()
    },
    {
      id: 'user_demo_3',
      fullName: 'Pedro Garcia',
      email: 'pedro@smartco.ph',
      phone: '+63 934 567 8901',
      role: 'volunteer',
      purok: 'purok3',
      password: 'password123',
      createdAt: new Date('2026-01-10').toISOString()
    }
  ]

  // Create demo health records
  const demoHealthRecords = [
    {
      id: 'health_demo_1',
      userId: 'user_demo_1',
      userName: 'Juan Dela Cruz',
      userPurok: 'purok1',
      formData: {
        bloodPressureSystolic: '118',
        bloodPressureDiastolic: '78',
        temperature: '36.6',
        heartRate: '72',
        weight: '65',
        oxygenSaturation: '98',
        symptoms: '',
        painLevel: 0
      },
      healthAssessment: {
        overallStatus: 'good',
        vitalsSummary: 'All vitals are within normal range - Keep up the great work!',
        vitalsDetails: [],
        requiresAppointment: false,
        urgencyLevel: 'routine'
      },
      recordedBy: 'Maria Santos',
      createdAt: new Date('2026-01-24').toISOString()
    },
    {
      id: 'health_demo_2',
      userId: 'user_demo_2',
      userName: 'Maria Santos',
      userPurok: 'purok2',
      formData: {
        bloodPressureSystolic: '142',
        bloodPressureDiastolic: '92',
        temperature: '37.1',
        heartRate: '85',
        weight: '58',
        oxygenSaturation: '96',
        symptoms: 'Mild headache',
        painLevel: 3
      },
      healthAssessment: {
        overallStatus: 'concerning',
        vitalsSummary: 'Some vitals need monitoring - Please schedule a checkup',
        vitalsDetails: [],
        requiresAppointment: true,
        urgencyLevel: 'soon'
      },
      recordedBy: 'Maria Santos',
      createdAt: new Date('2026-01-23').toISOString()
    }
  ]

  // Create demo events
  const demoEvents = [
    {
      id: 'event_demo_1',
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
      createdBy: 'Juan Dela Cruz',
      createdById: 'user_demo_1',
      createdAt: new Date('2026-01-20').toISOString()
    },
    {
      id: 'event_demo_2',
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
      createdBy: 'Maria Santos',
      createdById: 'user_demo_2',
      createdAt: new Date('2026-01-18').toISOString()
    },
    {
      id: 'event_demo_3',
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
      createdBy: 'Pedro Garcia',
      createdById: 'user_demo_3',
      createdAt: new Date('2026-01-15').toISOString()
    }
  ]

  // Create demo food aid schedules
  const demoFoodAid = [
    {
      id: 'foodaid_demo_1',
      purok: 'Purok 1',
      date: '2026-02-01',
      totalFamilies: 24,
      deliveredFamilies: 24,
      status: 'completed',
      route: 'Main Road → Street A → Street B',
      createdAt: new Date('2026-01-15').toISOString()
    },
    {
      id: 'foodaid_demo_2',
      purok: 'Purok 2',
      date: '2026-02-02',
      totalFamilies: 18,
      deliveredFamilies: 18,
      status: 'completed',
      route: 'Main Road → Street C',
      createdAt: new Date('2026-01-16').toISOString()
    },
    {
      id: 'foodaid_demo_3',
      purok: 'Purok 3',
      date: '2026-02-03',
      totalFamilies: 31,
      deliveredFamilies: 21,
      status: 'in-progress',
      route: 'Main Road → Street D → Street E → Street F',
      createdAt: new Date('2026-01-17').toISOString()
    },
    {
      id: 'foodaid_demo_4',
      purok: 'Purok 4',
      date: '2026-02-05',
      totalFamilies: 28,
      deliveredFamilies: 10,
      status: 'in-progress',
      route: 'Main Road → Street G → Street H',
      createdAt: new Date('2026-01-18').toISOString()
    },
    {
      id: 'foodaid_demo_5',
      purok: 'Purok 5',
      date: '2026-02-08',
      totalFamilies: 22,
      deliveredFamilies: 0,
      status: 'scheduled',
      route: 'Main Road → Street I',
      createdAt: new Date('2026-01-19').toISOString()
    }
  ]

  // Create demo notifications
  const demoNotifications = [
    {
      id: 'notif_demo_1',
      type: 'emergency',
      category: 'health',
      message: 'Medical emergency reported in Purok 4',
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
      read: false
    },
    {
      id: 'notif_demo_2',
      type: 'success',
      category: 'health',
      message: 'Senior citizen checkup completed - 15 residents',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      read: false
    },
    {
      id: 'notif_demo_3',
      type: 'info',
      category: 'events',
      message: 'New event created: Basketball Tournament 2026 on 2026-02-15',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      read: false
    },
    {
      id: 'notif_demo_4',
      type: 'info',
      category: 'foodaid',
      message: 'Food aid scheduled for Purok 5 on 2026-02-08',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      read: true
    }
  ]

  // Save all demo data
  storageService.setUsers(demoUsers)
  storageService.setHealthRecords(demoHealthRecords)
  storageService.setEvents(demoEvents)
  storageService.setFoodAid(demoFoodAid)
  storageService.setNotifications(demoNotifications)

  // Mark demo data as initialized
  storageService.set('demo_data_initialized', true)

  console.log('Demo data initialized successfully!')
  console.log('Demo accounts:')
  console.log('1. Email: juan@smartco.ph | Password: password123')
  console.log('2. Email: maria@smartco.ph | Password: password123')
  console.log('3. Email: pedro@smartco.ph | Password: password123')
}
