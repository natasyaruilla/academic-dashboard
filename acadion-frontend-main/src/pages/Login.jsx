// ==========================================
// src/pages/Login.jsx
// ==========================================
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData);
      const userRole = response.data.user.role;
      
      // Redirect based on role
      if (userRole === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image/Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #46525c, #2d3640)' }}>
        <div className="absolute inset-0 bg-black opacity-20"></div>
        
        {/* Decorative circles */}
        <div 
          className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"
          style={{
            opacity: 0.2,
            animation: 'float1 6s ease-in-out infinite'
          }}
        ></div>
        <div 
          className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"
          style={{
            opacity: 0.15,
            animation: 'float2 8s ease-in-out infinite'
          }}
        ></div>
        
        <style>{`
          @keyframes float1 {
            0%, 100% {
              transform: translate(0, 0);
            }
            25% {
              transform: translate(60px, -50px);
            }
            50% {
              transform: translate(-50px, 60px);
            }
            75% {
              transform: translate(40px, 30px);
            }
          }
          
          @keyframes float2 {
            0%, 100% {
              transform: translate(0, 0);
            }
            25% {
              transform: translate(-60px, 70px);
            }
            50% {
              transform: translate(70px, -60px);
            }
            75% {
              transform: translate(-40px, -50px);
            }
          }
        `}</style>
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white">
          <div className="max-w-md">
            <div className="mb-8">
              <div className="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-6">
                <LogIn className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4 text-white">
                Selamat Datang!
              </h1>
              <p className="text-xl text-white">
                Masuk untuk melanjutkan pengelolaan capstone dan lacak kemajuan akademik Anda.
              </p>
            </div>
            
            {/* Illustration or image placeholder */}
            <div className="mt-12 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 backdrop-blur rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-white">Lacak kemajuan proyek Anda</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 backdrop-blur rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-white">Berkolaborasi dengan tim Anda</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 backdrop-blur rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-white">Kirim tugas dengan mudah</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg" style={{ backgroundColor: '#46525c' }}>
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Sign In
            </h2>
            <p className="text-gray-600">
              Masukkan kredensial untuk mengakses akun Anda.
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 rounded-lg font-medium focus:ring-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#46525c' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#353f47'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#46525c'}
              >
                {loading ? 'Masuk...' : 'Masuk'}
              </button>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Belum Punya Akun? <span className="font-bold" style={{ color: '#1a5ace' }}>Hubungi Tim Program</span>
                </p>
              </div>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            © 2025 Acadion Team. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;