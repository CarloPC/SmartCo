import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Shield, Zap, Users, Globe, Award } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'

const AboutPage = () => {
  const navigate = useNavigate()

  const features = [
    { icon: Heart, title: 'Health Management', description: 'Mobile-based health checkup recording and emergency reporting' },
    { icon: Globe, title: 'AI-Powered Distribution', description: 'Intelligent food aid distribution scheduling per purok' },
    { icon: Users, title: 'Volunteer Management', description: 'Optimized task and route assignment for volunteers' },
    { icon: Zap, title: 'Event Scheduling', description: 'Community and sports event scheduling with participant management' },
    { icon: Shield, title: 'Real-time Alerts', description: 'Instant notifications and alerts for community members' },
    { icon: Award, title: 'Centralized Dashboard', description: 'Monitor health, food aid, and events in one place' }
  ]

  const team = [
    { name: 'Development Team', role: 'Capstone Project 2026' },
    { name: 'Toledo City', role: 'Barangay Management' },
    { name: 'Community Partners', role: 'Local Organizations' }
  ]

  return (
    <div className="min-h-screen relative pb-20">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: `url(${toledoImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85"></div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">About SmartCo</h1>
          <div className="w-10" />
        </div>

        {/* Logo & App Info */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-6 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <span className="text-white font-bold text-5xl">S</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">SmartCo</h2>
          <p className="text-gray-600 mb-1">Barangay Management System</p>
          <p className="text-sm text-gray-500">Version 1.0.0</p>
          <div className="mt-4 inline-block bg-blue-50 px-4 py-2 rounded-full">
            <p className="text-sm font-medium text-blue-600">Powered by AI Technology</p>
          </div>
        </div>

        {/* Mission */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-3">Our Mission</h3>
          <p className="text-gray-600 leading-relaxed">
            SmartCo is designed to revolutionize barangay management through technology. 
            We aim to streamline health services, food aid distribution, and community engagement 
            by leveraging AI-powered solutions to create a more efficient, transparent, and 
            responsive barangay governance system.
          </p>
        </div>

        {/* Key Features */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Key Features</h3>
          <div className="grid grid-cols-1 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50">
                <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{feature.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Built With</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="font-semibold text-gray-800">React</p>
              <p className="text-xs text-gray-500">Frontend</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="font-semibold text-gray-800">Tailwind CSS</p>
              <p className="text-xs text-gray-500">Styling</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="font-semibold text-gray-800">AI/ML</p>
              <p className="text-xs text-gray-500">Optimization</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="font-semibold text-gray-800">Cloud</p>
              <p className="text-xs text-gray-500">Infrastructure</p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Created By</h3>
          <div className="space-y-3">
            {team.map((member, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal & Contact */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Legal & Contact</h3>
          <div className="space-y-2 text-sm">
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 font-medium">
              Privacy Policy
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 font-medium">
              Terms of Service
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 font-medium">
              License Information
            </button>
            <div className="p-3 bg-gray-50 rounded-lg mt-3">
              <p className="text-gray-600">
                <strong>Contact:</strong> support@smartco.ph
              </p>
              <p className="text-gray-600 mt-1">
                <strong>Location:</strong> Toledo City, Cebu, Philippines
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-white text-sm">
            © 2026 SmartCo. All rights reserved.
          </p>
          <p className="text-blue-200 text-xs mt-1">
            Made with ❤️ for the community of Toledo City
          </p>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
