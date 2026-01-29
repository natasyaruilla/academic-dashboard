import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { contentAPI, groupAPI } from '../../services/api';
import { 
  Calendar, FileText, Info, ExternalLink, AlertCircle, 
  Users, ArrowRight, CheckCircle, Clock, Building 
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [information, setInformation] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [docs, setDocs] = useState([]);
  const [myGroup, setMyGroup] = useState(null);
  const [registrationPeriod, setRegistrationPeriod] = useState(null);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState({});
  const [showGroupAlert, setShowGroupAlert] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    // Show alert if group is approved and hasn't been dismissed
    if (myGroup && myGroup.status === 'approved') {
      const dismissedGroupId = localStorage.getItem('dismissedGroupAlert');
      if (dismissedGroupId !== String(myGroup.group_id)) {
        setShowGroupAlert(true);
      } else {
        setShowGroupAlert(false);
      }
    } else {
      setShowGroupAlert(false);
    }
  }, [myGroup]);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

      // Parallel fetching for better performance
      const [infoRes, timelineRes, docsRes, groupRes, regPeriodRes] = await Promise.all([
        contentAPI.getInformation().catch(() => ({ data: { data: [] }})),
        contentAPI.getTimeline().catch(() => ({ data: { data: [] }})),
        contentAPI.getDocs().catch(() => ({ data: { data: [] }})),
        groupAPI.getMyGroup().catch(() => ({ data: { data: null }})),
        // Fetch registration status manually as it might not be in the service file yet
        fetch(`${API_URL}/registration/active`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json()).catch(() => ({ success: false }))
      ]);

      setInformation(infoRes?.data?.data || []);
      setTimeline(timelineRes?.data?.data || []);
      setDocs(docsRes?.data?.data || []);
      setMyGroup(groupRes?.data?.data || null);

      if (regPeriodRes.success && regPeriodRes.data) {
        setRegistrationPeriod(regPeriodRes.data);
      }

    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAnnouncement = (id) => {
    setExpandedAnnouncements(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getTimeRemaining = (closeDate) => {
    const now = new Date();
    const close = new Date(closeDate);
    const diff = close - now;
    
    if (diff <= 0) return 'Registration closed';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'ready': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const dismissGroupAlert = () => {
    if (myGroup) {
      localStorage.setItem('dismissedGroupAlert', String(myGroup.group_id));
    }
    setShowGroupAlert(false);
  };

  // Determine banner variant for registration period
  const getBannerVariant = (reg) => {
    // defaults for closed / missing
    const closed = {
      container: 'border-l-red-500 bg-red-50',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
      headingText: 'text-red-900',
      bodyText: 'text-red-800',
      cta: 'bg-red-600 hover:bg-red-700 text-white'
    };

    if (!reg) return closed;
    if (!reg.is_open) return closed;

    const now = new Date();
    const close = new Date(reg.close_date);
    const diffMs = close - now;
    const daysUntilClose = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // If within 3 days before close -> urgent (red)
    if (daysUntilClose <= 3) {
      return {
        container: 'border-l-red-500 bg-red-50',
        iconBg: 'bg-red-100',
        iconText: 'text-red-600',
        headingText: 'text-red-900',
        bodyText: 'text-red-800',
        cta: 'bg-red-600 hover:bg-red-700 text-white'
      };
    }

    // Otherwise when open and not close -> attention (yellow)
    return {
      container: 'border-l-yellow-400 bg-yellow-50',
      iconBg: 'bg-yellow-100',
      iconText: 'text-yellow-600',
      headingText: 'text-yellow-900',
      bodyText: 'text-yellow-800',
      cta: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    };
  };

  // Consolidated banner component to handle registration
  // NOTE: only shows when user doesn't have a group yet and registration period exists
  const RegistrationBanner = ({ reg, hasGroup }) => {
    // Don't show if user already has a group
    if (hasGroup) return null;
    
    // Only show when registration period exists
    if (!reg) return null;

    // registration period exists, show variant (yellow/red/closed)
    const v = getBannerVariant(reg);

    return (
      <div className={`card mb-6 border-l-4 ${v.container}`}>
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full ${v.iconBg}`}>
            <Calendar className={`w-6 h-6 ${v.iconText}`} />
          </div>

          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${v.headingText}`}>
              {reg.is_open
                ? (v.container.includes('yellow') ? '⚠️ Team Registration is OPEN' : '🎉 Team Registration is OPEN!')
                : '⛔ Team Registration is CLOSED'}
            </h3>

            <div className={`mt-2 space-y-1 text-sm ${v.bodyText}`}>
              <p>
                <span className="font-medium">Buka:</span>{' '}
                {new Date(reg.open_date).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} WIB
              </p>
              <p>
                <span className="font-medium">Tutup:</span>{' '}
                {new Date(reg.close_date).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} WIB
              </p>
              {reg.is_open && (
                <p className="font-semibold mt-2">⏰ {getTimeRemaining(reg.close_date)}</p>
              )}
            </div>

            {/* CTA logic: if open -> allow create; if closed -> show contact program team */}
            {reg.is_open ? (
              <button
                onClick={() => navigate('/student/use-cases')}
                className={`mt-4 inline-flex items-center px-4 py-2 ${v.cta} font-medium rounded-lg transition-colors`}
              >
                <Users className="w-5 h-5 mr-2" />
                Pilih Use Case Sekarang
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <span className="font-semibold">Periode registrasi telah ditutup.</span> Silakan hubungi tim program untuk bantuan lebih lanjut.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Selamat datang kembali, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 mt-2">
                Berikut update terkini proyek capstone Anda
              </p>
            </div>

            {/* Consolidated Registration / Warning Banner */}
            <RegistrationBanner reg={registrationPeriod} hasGroup={!!myGroup} />

            {/* ==========================================
                GROUP STATUS CARD - If in a group
                ========================================== */}
            {myGroup && showGroupAlert && (
              <div 
                className="card mb-6 border-l-4 border-l-blue-500 relative"
              >
                <button
                  onClick={dismissGroupAlert}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Tutup"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div 
                  className="flex items-start justify-between cursor-pointer hover:bg-gray-50 transition-colors rounded-lg p-2 -m-2"
                  onClick={() => navigate('/student/group')}
                >
                  <div className="flex-1 pr-8">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {myGroup.group_name || 'Tim Kamu'}
                      </h3>
                      <span className={`badge ${getStatusColor(myGroup.status)} flex items-center space-x-1`}>
                        {getStatusIcon(myGroup.status)}
                        <span>{myGroup.status?.toUpperCase()}</span>
                      </span>
                    </div>

                    {/* Use Case Info */}
                    {myGroup.use_case_name && (
                      <div className="flex items-center text-gray-600 mb-2">
                        <Building className="w-4 h-4 mr-2" />
                        <span className="font-medium">{myGroup.use_case_name}</span>
                        {myGroup.use_case_company && (
                          <span className="text-gray-400 ml-2">• {myGroup.use_case_company}</span>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-gray-600">
                      Role: <span className="font-medium capitalize">{myGroup.role}</span>
                      {myGroup.members && (
                        <span className="ml-4">
                          • {myGroup.members.length} anggota
                        </span>
                      )}
                    </p>

                    {/* Validation Status */}
                    {myGroup.validation && (
                      <div className="mt-3">
                        {myGroup.validation.allRequiredPassed ? (
                          <span className="inline-flex items-center text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Semua syarat terpenuhi
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-yellow-600 text-sm">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Belum memenuhi semua syarat
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Announcements */}
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="flex items-center space-x-3 mb-6">
                    <Info className="w-6 h-6" style={{ color: '#46525c' }} />
                    <h2 className="text-xl font-bold text-gray-900">
                      Pengumuman
                    </h2>
                  </div>
                  
                  {information.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Belum ada pengumuman
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {information.slice(0, 5).map((item) => {
                        const isExpanded = expandedAnnouncements[item.id] || false;
                        const content = item.content || '';
                        const needsTruncate = content.length > 200;
                        const displayContent = isExpanded || !needsTruncate 
                          ? content 
                          : content.slice(0, 200) + '...';
                        
                        return (
                          <div
                            key={item.id}
                            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <h3 className="font-semibold text-gray-900 mb-2">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">
                              {displayContent}
                            </p>
                            {needsTruncate && (
                              <button
                                onClick={() => toggleAnnouncement(item.id)}
                                className="text-sm font-medium mt-1 focus:outline-none hover:underline"
                                style={{ color: '#1a5ace' }}
                              >
                                {isExpanded ? '← Lihat Lebih Sedikit' : 'Baca Selengkapnya →'}
                              </button>
                            )}
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">
                                {new Date(item.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="card mt-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <Calendar className="w-6 h-6" style={{ color: '#46525c' }} />
                    <h2 className="text-xl font-bold text-gray-900">
                      Timeline
                    </h2>
                  </div>
                  
                  {timeline.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Belum ada timeline
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {timeline.map((item, index) => (
                        <div key={item.id} className="flex">
                          <div className="flex flex-col items-center mr-4">
                            <div className="w-3 h-3 bg-red-600 rounded-full" />
                            {index < timeline.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-300 mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <h3 className="font-semibold text-gray-900">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>
                                Mulai: {new Date(item.start_at).toLocaleDateString('id-ID')}
                              </span>
                              <span>
                                Selesai: {new Date(item.end_at).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Important Documents & Quick Actions */}
              <div className="lg:col-span-1">
                <div className="sticky top-4 space-y-6">
                  {/* Dokumen Penting */}
                  <div className="card">
                    <div className="flex items-center space-x-3 mb-6">
                      <FileText className="w-6 h-6" style={{ color: '#46525c' }} />
                      <h2 className="text-xl font-bold text-gray-900">
                        Dokumen Penting
                      </h2>
                    </div>
                    
                    {docs.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        Belum ada dokumen
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {docs.map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors group"
                          >
                            <span className="text-sm font-medium truncate">
                              {doc.title}
                            </span>
                            <ExternalLink className="w-4 h-4 flex-shrink-0 ml-2 group-hover:text-blue-600" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Aksi Cepat
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => navigate('/student/use-cases')}
                        className="w-full btn btn-primary text-left flex items-center justify-between"
                      >
                        <span>Pilih Use Case</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate('/student/invitations')}
                        className="w-full btn btn-secondary text-left flex items-center justify-between"
                      >
                        <span>Cek Undangan</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default StudentDashboard;