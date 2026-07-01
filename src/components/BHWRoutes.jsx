import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BHWDashboard from '../pages/BHWDashboard'

const BHWRoutes = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    )
  }

  if (user?.role !== 'bhw') {
    return <Navigate to="/home" replace />
  }

  return (
    <Routes>
      <Route path="" element={<BHWDashboard />} />
      <Route path="*" element={<Navigate to="/bhw" replace />} />
    </Routes>
  )
}

export default BHWRoutes
