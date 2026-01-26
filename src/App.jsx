import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
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
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/health"
          element={
            <Layout>
              <HealthPage />
            </Layout>
          }
        />
        <Route
          path="/health/record"
          element={
            <Layout>
              <RecordCheckupPage />
            </Layout>
          }
        />
        <Route
          path="/food-aid"
          element={
            <Layout>
              <FoodAidPage />
            </Layout>
          }
        />
        <Route
          path="/food-aid/optimize"
          element={
            <Layout>
              <OptimizeSchedulePage />
            </Layout>
          }
        />
        <Route
          path="/events"
          element={
            <Layout>
              <EventsPage />
            </Layout>
          }
        />
        <Route
          path="/events/create"
          element={
            <Layout>
              <CreateEventPage />
            </Layout>
          }
        />

        {/* Profile & Settings Routes */}
        <Route path="/profile" element={<MyProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/privacy-security" element={<PrivacySecurityPage />} />
        <Route path="/help-support" element={<HelpSupportPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Redirect to welcome if no match */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
