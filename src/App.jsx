import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import WelcomePage from './pages/WelcomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import HealthPage from './pages/HealthPage'
import RecordCheckupPage from './pages/RecordCheckupPage'
import FoodAidPage from './pages/FoodAidPage'
import OptimizeSchedulePage from './pages/OptimizeSchedulePage'
import EventsPage from './pages/EventsPage'
import CreateEventPage from './pages/CreateEventPage'
import MyProfilePage from './pages/MyProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import PrivacySecurityPage from './pages/PrivacySecurityPage'
import HelpSupportPage from './pages/HelpSupportPage'
import AboutPage from './pages/AboutPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - Authentication Pages */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes - Main App */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Layout>
                <HomePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/health"
          element={
            <ProtectedRoute>
              <Layout>
                <HealthPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/health/record"
          element={
            <ProtectedRoute>
              <Layout>
                <RecordCheckupPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/food-aid"
          element={
            <ProtectedRoute>
              <Layout>
                <FoodAidPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/food-aid/optimize"
          element={
            <ProtectedRoute>
              <Layout>
                <OptimizeSchedulePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Layout>
                <EventsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/create"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateEventPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Profile & Settings Routes */}
        <Route path="/profile" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/privacy-security" element={<ProtectedRoute><PrivacySecurityPage /></ProtectedRoute>} />
        <Route path="/help-support" element={<ProtectedRoute><HelpSupportPage /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />

        {/* Redirect to welcome if no match */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
