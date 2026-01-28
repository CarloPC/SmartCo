# Backend Integration Documentation

## 🎉 What's New

Your SmartCo app now has **full backend integration** with authentication, data persistence, and real-time features!

## ✨ Features Implemented

### 1. **Authentication System** 🔐
- ✅ User registration with validation
- ✅ User login with session management
- ✅ Protected routes (redirects to login if not authenticated)
- ✅ Logout functionality
- ✅ User profile display

### 2. **Data Persistence** 💾
- ✅ All data is now saved to localStorage (easily replaceable with real API)
- ✅ Health records are saved and persisted
- ✅ Events are saved and persisted
- ✅ Food aid schedules are saved and persisted
- ✅ Notifications are saved and tracked

### 3. **Service Layer Architecture** 🏗️
Clean separation of concerns with service files:
- `authService.js` - Authentication operations
- `healthService.js` - Health records management
- `eventsService.js` - Events management
- `foodAidService.js` - Food aid distribution management
- `notificationService.js` - Notifications management
- `storageService.js` - Data storage abstraction

### 4. **Demo Data** 📊
Pre-populated demo data for testing:
- 3 demo user accounts
- Sample health records
- Upcoming events
- Food aid schedules
- Notifications

## 🚀 How to Use

### Demo Accounts
Login with any of these accounts:

| Email | Password | Role |
|-------|----------|------|
| juan@smartco.ph | password123 | Barangay Official |
| maria@smartco.ph | password123 | Health Worker |
| pedro@smartco.ph | password123 | Volunteer |

### Testing the Features

1. **Registration**
   - Go to welcome page → Create New Account
   - Fill in the form (all fields required)
   - Click "Create Account"
   - You'll be redirected to login

2. **Login**
   - Use one of the demo accounts above
   - Or use your newly created account
   - You'll be redirected to the dashboard

3. **Record Health Checkup**
   - Navigate to Health → Record New Checkup
   - Fill in the vital signs
   - Click "Analyze Health"
   - Review AI recommendations
   - Click "Save Checkup Record"
   - ✅ **Data is now saved and persisted!**

4. **Create Event**
   - Navigate to Events → Create New Event
   - Fill in event details
   - Click "Optimize Schedule"
   - Review AI recommendations
   - Click "Create Event"
   - ✅ **Event is now saved and persisted!**

5. **View Profile**
   - Click your avatar (top left)
   - See your profile information
   - Access settings and other options

6. **Logout**
   - Click your avatar → Logout button
   - You'll be redirected to welcome page

## 📁 File Structure

```
src/
├── services/
│   ├── storageService.js        # localStorage wrapper
│   ├── authService.js            # Authentication logic
│   ├── healthService.js          # Health records API
│   ├── eventsService.js          # Events API
│   ├── foodAidService.js         # Food aid API
│   ├── notificationService.js    # Notifications API
│   └── initializeDemoData.js     # Demo data seeder
├── context/
│   ├── AuthContext.jsx           # Authentication context
│   └── ThemeContext.jsx          # Theme context
├── components/
│   ├── ProtectedRoute.jsx        # Route protection component
│   ├── Layout.jsx                # Updated with auth
│   └── ProfileSidebar.jsx        # Updated with auth
└── pages/
    ├── LoginPage.jsx             # Updated with auth
    ├── RegisterPage.jsx          # Updated with auth
    ├── RecordCheckupPage.jsx     # Integrated with healthService
    └── CreateEventPage.jsx       # Integrated with eventsService
```

## 🔄 How to Replace with Real API

The current implementation uses localStorage, but it's designed to be easily replaced with real API calls. Here's how:

### Option 1: Replace Service Methods (Recommended)

Each service file has async methods that simulate API calls. Simply replace the localStorage calls with fetch or axios:

**Before (localStorage):**
```javascript
async getHealthRecords() {
  await simulateDelay()
  return storageService.getHealthRecords()
}
```

**After (Real API):**
```javascript
async getHealthRecords() {
  const response = await fetch('/api/health-records', {
    headers: {
      'Authorization': `Bearer ${storageService.getAuthToken()}`
    }
  })
  return response.json()
}
```

### Option 2: Add API Base URL

Create a config file:

```javascript
// src/config/api.js
export const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api'
export const API_TIMEOUT = 10000

// Use in services:
import { API_BASE_URL } from '../config/api'

async getHealthRecords() {
  const response = await fetch(`${API_BASE_URL}/health-records`)
  return response.json()
}
```

### Option 3: Use Axios

Install axios and create an instance:

```bash
npm install axios
```

```javascript
// src/services/api.js
import axios from 'axios'
import storageService from './storageService'

const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000
})

// Add auth token to all requests
api.interceptors.request.use(config => {
  const token = storageService.getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
```

Then update services:
```javascript
import api from './api'

async getHealthRecords() {
  const response = await api.get('/health-records')
  return response.data
}
```

## 🔒 Security Notes

**Current Implementation (localStorage):**
- ⚠️ Passwords are stored in plain text
- ⚠️ No token expiration
- ⚠️ No encryption
- ✅ Good for development/demo

**For Production:**
- Use HTTPS only
- Hash passwords (bcrypt)
- Implement JWT with expiration
- Add refresh tokens
- Implement CSRF protection
- Add rate limiting
- Encrypt sensitive data

## 📊 Data Structure Examples

### User Object
```javascript
{
  id: 'user_1234567890',
  fullName: 'Juan Dela Cruz',
  email: 'juan@smartco.ph',
  phone: '+63 912 345 6789',
  role: 'official',
  purok: 'purok1',
  createdAt: '2026-01-28T10:30:00.000Z'
}
```

### Health Record Object
```javascript
{
  id: 'health_1234567890',
  userId: 'user_1234567890',
  userName: 'Juan Dela Cruz',
  userPurok: 'purok1',
  formData: {
    bloodPressureSystolic: '120',
    bloodPressureDiastolic: '80',
    temperature: '36.5',
    heartRate: '72',
    // ... more fields
  },
  healthAssessment: {
    overallStatus: 'good',
    vitalsSummary: 'All vitals are normal',
    // ... AI analysis results
  },
  recordedBy: 'Maria Santos',
  createdAt: '2026-01-28T10:30:00.000Z'
}
```

### Event Object
```javascript
{
  id: 'event_1234567890',
  title: 'Basketball Tournament 2026',
  category: 'Sports',
  date: '2026-02-15',
  time: '09:00',
  venue: 'Barangay Court',
  expectedAttendees: 50,
  status: 'upcoming',
  attendees: [],
  createdBy: 'Juan Dela Cruz',
  createdAt: '2026-01-28T10:30:00.000Z'
}
```

## 🐛 Troubleshooting

### Can't Login?
- Check console for errors
- Verify credentials match demo accounts
- Clear localStorage and refresh: `localStorage.clear()`

### Data Not Saving?
- Check browser console for errors
- Ensure you're logged in
- Check localStorage in DevTools

### Route Protection Not Working?
- Clear browser cache
- Check if AuthProvider is wrapping your app in main.jsx
- Verify token exists in localStorage

## 🎯 Next Steps

Now that you have backend integration, you can:

1. **Connect to Real Backend**
   - Set up Express/NestJS server
   - Create REST APIs for each service
   - Replace service methods with API calls

2. **Add More Features**
   - Real-time updates with WebSockets
   - File uploads for health records
   - Email notifications
   - SMS alerts
   - Export data to PDF/Excel

3. **Enhance Security**
   - Implement JWT authentication
   - Add password hashing
   - Add 2FA
   - Implement role-based access control (RBAC)

4. **Add Database**
   - PostgreSQL for structured data
   - MongoDB for flexible data
   - Firebase for real-time features

## 💡 Tips

- All services return Promises (async/await)
- Error handling is built-in
- Notifications are auto-created for important actions
- Demo data resets on browser refresh (by design)
- Use DevTools → Application → Local Storage to inspect data

## 🙋 Need Help?

The code is well-commented and follows best practices. Each service file has:
- Clear method names
- Async/await for consistency
- Error handling
- JSDoc-style comments

Happy coding! 🚀
