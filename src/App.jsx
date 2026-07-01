import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
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
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminApprovalsPage from './pages/AdminApprovalsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminRequestsPage from './pages/AdminRequestsPage'
import RequestAdminPage from './pages/RequestAdminPage'
import ReportEmergencyPage from './pages/ReportEmergencyPage'
import EmergencyManagementPage from './pages/EmergencyManagementPage'
import BHWDashboard from './pages/BHWDashboard'

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
            <AdminRoute>
              <Layout>
                <OptimizeSchedulePage />
              </Layout>
            </AdminRoute>
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
            <AdminRoute>
              <Layout>
                <CreateEventPage />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/bhw"
          element={
            <ProtectedRoute>
              <Layout>
                <BHWDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bhw/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <BHWDashboard />
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
        <Route path="/request-admin" element={<ProtectedRoute><RequestAdminPage /></ProtectedRoute>} />

        {/* Emergency Routes */}
        <Route
          path="/emergency/report"
          element={
            <ProtectedRoute>
              <Layout>
                <ReportEmergencyPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/emergency"
          element={
            <AdminRoute>
              <Layout>
                <EmergencyManagementPage />
              </Layout>
            </AdminRoute>
          }
        />

        {/* Admin Routes - Only accessible by admin and barangay officials */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Layout>
                <AdminDashboardPage />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <Layout>
                <AdminDashboardPage />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/approvals"
          element={
            <AdminRoute>
              <Layout>
                <AdminApprovalsPage />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <Layout>
                <AdminUsersPage />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <AdminRoute>
              <Layout>
                <AdminRequestsPage />
              </Layout>
            </AdminRoute>
          }
        />

        {/* Redirect to welcome if no match */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
