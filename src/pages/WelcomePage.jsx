import { useNavigate } from 'react-router-dom'
import { Heart, Package, Calendar, Users, ArrowRight, Shield, Zap, Bell } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'

const WelcomePage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${toledoImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Enhanced Logo Section */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <div className="relative">
              <span className="text-blue-600 font-bold text-4xl">S</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">SmartCo</h1>
          <p className="text-blue-100 text-lg">Barangay Management System</p>
          <p className="text-blue-200 text-sm mt-2">Powered by AI Technology</p>
        </div>

        {/* Features Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <p className="text-white text-sm font-medium">Health Care</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Package className="w-6 h-6 text-white" />
              </div>
              <p className="text-white text-sm font-medium">Food Aid</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="text-white text-sm font-medium">Events</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-white text-sm font-medium">Community</p>
            </div>
          </div>

          {/* Key Features */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-white">
              <Shield className="w-5 h-5 text-green-300" />
              <span className="text-sm">Secure & Private Data</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span className="text-sm">AI-Powered Analytics</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <Bell className="w-5 h-5 text-red-300" />
              <span className="text-sm">Real-time Alerts</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-white text-blue-600 font-bold py-4 rounded-xl hover:bg-blue-50 transition shadow-xl flex items-center justify-center space-x-2 group"
          >
            <span>Sign In</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => navigate('/register')}
            className="w-full bg-white/10 backdrop-blur text-white font-semibold py-4 rounded-xl hover:bg-white/20 transition border-2 border-white/30"
          >
            Create New Account
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-100 text-sm mt-6">
          © 2026 SmartCo. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default WelcomePage
