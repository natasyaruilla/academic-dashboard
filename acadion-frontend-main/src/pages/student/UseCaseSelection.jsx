import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Search, Building, Users, GraduationCap, 
  ChevronRight, CheckCircle, Filter, X, AlertCircle, Mail
} from 'lucide-react';
import { useCaseAPI, groupAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const UseCaseSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [useCases, setUseCases] = useState([]);
  const [filteredUseCases, setFilteredUseCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUseCase, setSelectedUseCase] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [notification, setNotification] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [registrationPeriod, setRegistrationPeriod] = useState(null);
  const [hasGroup, setHasGroup] = useState(false);
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [groupData, setGroupData] = useState(null);
  const [teamUseCaseId, setTeamUseCaseId] = useState(null);
  const [isGroupLocked, setIsGroupLocked] = useState(false);

  useEffect(() => {
    checkExistingGroup();
  }, []);

  useEffect(() => {
    // Filter use cases based on search
    if (searchQuery.trim() === '') {
      setFilteredUseCases(useCases);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = useCases.filter(uc =>
        uc.name.toLowerCase().includes(query) ||
        uc.company?.toLowerCase().includes(query) ||
        uc.description?.toLowerCase().includes(query)
      );
      setFilteredUseCases(filtered);
    }
  }, [searchQuery, useCases]);

  const checkExistingGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

      // Check registration period first
      const regPeriodRes = await fetch(`${API_URL}/registration/active`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json()).catch(() => ({ success: false }));

      let periodClosed = false;
      if (regPeriodRes.success && regPeriodRes.data) {
        setRegistrationPeriod(regPeriodRes.data);
        periodClosed = !regPeriodRes.data.is_open;
        setRegistrationClosed(periodClosed);
      } else {
        // No registration period = accessible anytime
        setRegistrationClosed(false);
        periodClosed = false;
      }

      // Check if user already has a group
      const groupResponse = await groupAPI.getMyGroup();
      const userHasGroup = groupResponse.data.data !== null;
      setHasGroup(userHasGroup);

      if (userHasGroup) {
        // Save group data for display
        setGroupData(groupResponse.data.data);
        setTeamUseCaseId(groupResponse.data.data.use_case_id);
        // Check if group is locked/approved
        const groupStatus = groupResponse.data.data.status;
        const groupLocked = groupResponse.data.data.locked_at !== null;
        setIsGroupLocked(groupLocked || groupStatus === 'approved' || groupStatus === 'ready');
      }

      // Only block if: period exists AND is closed AND user has no group
      if (periodClosed && !userHasGroup) {
        setLoading(false);
        return;
      }

      // Load use cases for all scenarios
      const response = await useCaseAPI.getAllUseCases({ batch_id: user.batch_id });
      setUseCases(response.data.data);
      setFilteredUseCases(response.data.data);
    } catch (error) {
      console.error('Failed to load:', error);
      setHasGroup(false);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (useCase) => {
    try {
      const response = await useCaseAPI.getUseCaseDetail(useCase.id);
      setSelectedUseCase(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to load use case details' });
    }
  };

  const handleSelectUseCase = (useCase) => {
    setSelectedUseCase(useCase);
    if (hasGroup && !isGroupLocked) {
      // For changing use case
      setGroupName(groupData.group_name); // Keep existing group name
    } else {
      // For new group
      setGroupName(`Team ${useCase.name}`);
    }
    setShowDetailModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmSelection = async () => {
    if (!groupName.trim()) {
      setNotification({ type: 'error', message: 'Please enter a group name' });
      return;
    }

    setSubmitting(true);
    try {
      if (hasGroup && !isGroupLocked) {
        // Change existing group's use case
        await groupAPI.changeUseCase(groupData.id, selectedUseCase.id);
        setNotification({ 
          type: 'success', 
          message: `Use case berhasil diubah ke "${selectedUseCase.name}"! Redirecting...` 
        });
      } else {
        // Create new group
        await groupAPI.selectUseCaseAndCreateGroup({
          use_case_id: selectedUseCase.id,
          group_name: groupName
        });
        setNotification({ 
          type: 'success', 
          message: `Use case "${selectedUseCase.name}" selected! Redirecting...` 
        });
      }

      setTimeout(() => {
        navigate('/student/group');
      }, 1500);
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to select use case' 
      });
      setSubmitting(false);
    }
  };

  const getRuleIcon = (ruleType) => {
    switch (ruleType) {
      case 'GROUP_SIZE':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'MAX_SAME_UNIVERSITY':
        return <Building className="w-5 h-5 text-purple-600" />;
      case 'REQUIRED_LEARNING_PATHS':
        return <GraduationCap className="w-5 h-5 text-green-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatRuleDisplay = (rule) => {
    switch (rule.rule_type) {
      case 'GROUP_SIZE':
        return `${rule.rule_value} anggota`;
      case 'MAX_SAME_UNIVERSITY':
        return `Max ${rule.rule_value} dari universitas yang sama`;
      case 'REQUIRED_LEARNING_PATHS':
        return rule.rule_value;
      default:
        return rule.rule_value;
    }
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return 'Tidak ada deskripsi';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading use cases..." />
        </div>
      </div>
    );
  }

  // If registration is closed and user doesn't have a group, show empty state
  if (registrationClosed && !hasGroup) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Pilih Use Case</h1>
              </div>

              {/* Empty State - Registration Closed */}
              <div className="card">
                <div className="text-center py-16">
                  <div className="mb-6 flex justify-center">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-12 h-12 text-red-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Periode Registrasi Telah Ditutup
                  </h2>
                  <p className="text-gray-600 mb-4 max-w-lg mx-auto">
                    Anda tidak dapat memilih use case karena periode registrasi telah ditutup 
                    dan Anda belum terdaftar dalam tim manapun.
                  </p>
                  <p className="text-gray-700 font-medium mb-8 max-w-lg mx-auto">
                    Silakan menghubungi tim program untuk mendapatkan bantuan lebih lanjut.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => navigate('/student/dashboard')}
                      className="btn btn-secondary inline-flex items-center space-x-2"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                      <span>Kembali ke Dashboard</span>
                    </button>
                    <a
                      href="mailto:program@acadion.com"
                      className="btn btn-primary inline-flex items-center space-x-2"
                    >
                      <Mail className="w-5 h-5" />
                      <span>Hubungi Tim Program</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Pilih Use Case
              </h1>
              <p className="text-gray-600 mt-2">
                Pilih project use case yang sesuai dengan tim kamu
              </p>
            </div>

            {/* Banner for students already in a team */}
            {hasGroup && groupData && (
              <div className={`border-l-4 p-6 mb-6 rounded-lg ${
                isGroupLocked 
                  ? 'bg-blue-50 border-blue-500' 
                  : 'bg-yellow-50 border-yellow-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {isGroupLocked ? (
                        <CheckCircle className="w-8 h-8 text-blue-600" />
                      ) : (
                        <AlertCircle className="w-8 h-8 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-2 ${
                        isGroupLocked ? 'text-blue-900' : 'text-yellow-900'
                      }`}>
                        Anda Sudah Terdaftar di {groupData.group_name}
                      </h3>
                      <p className={`mb-1 ${
                        isGroupLocked ? 'text-blue-800' : 'text-yellow-800'
                      }`}>
                        Use Case: <span className="font-semibold">{groupData.use_case_name || 'Loading...'}</span>
                      </p>
                      <p className={`text-sm ${
                        isGroupLocked ? 'text-blue-700' : 'text-yellow-700'
                      }`}>
                        {isGroupLocked 
                          ? 'Tim sudah dikunci. Anda hanya dapat melihat detail use case lainnya.'
                          : 'Tim masih dalam status draft. Anda masih dapat mengubah pilihan use case.'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/student/group')}
                    className="btn btn-primary flex items-center space-x-2 ml-4"
                  >
                    <Users className="w-5 h-5" />
                    <span>Lihat Tim Saya</span>
                  </button>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="card mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan nama, perusahaan, atau deskripsi..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Menampilkan {filteredUseCases.length} dari {useCases.length} use cases
              </p>
            </div>

            {/* Use Case Grid */}
            {filteredUseCases.length === 0 ? (
              <div className="card text-center py-16">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'Tidak ada hasil' : 'Belum ada use case'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? 'Coba kata kunci yang berbeda'
                    : 'Use case akan muncul di sini setelah admin menambahkannya'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUseCases.map((useCase) => {
                  const isTeamUseCase = hasGroup && teamUseCaseId === useCase.id;
                  return (
                    <div 
                      key={useCase.id} 
                      className={`card transition-all duration-200 relative flex flex-col ${
                        isTeamUseCase ? 'border-2 border-green-500 bg-green-50' : ''
                      }`}
                    >
                      {/* Badge for team's selected use case */}
                      {isTeamUseCase && (
                        <div className="absolute top-4 right-4 z-10">
                          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Use Case Tim Anda</span>
                          </span>
                        </div>
                      )}
                      
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-3 pr-8">
                        {useCase.name}
                      </h3>

                      {/* Company */}
                      {useCase.company && (
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <Building className="w-4 h-4 mr-1" />
                          {useCase.company}
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 flex-grow" style={{ minHeight: '60px' }}>
                        {truncateText(useCase.description, 150)}
                      </p>

                      {/* Komposisi Tim / Rules */}
                      {useCase.rules && useCase.rules.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Komposisi Tim:</p>
                          <div className="flex flex-wrap gap-2">
                            {useCase.rules.map((rule) => {
                              // Parse rule values to display as badges
                              let badgeColor = 'bg-gray-100 text-gray-800';
                              let displayText = rule.rule_value;

                              if (rule.rule_type === 'REQUIRED_LEARNING_PATHS') {
                                // Parse learning paths like "2 Frontend, 3 Backend, 1 Mobile"
                                const paths = rule.rule_value.split(',').map(p => p.trim());
                                return paths.map((path, idx) => {
                                  const [count, type] = path.split(' ');
                                  let color = 'bg-gray-100 text-gray-800';
                                  
                                  if (type?.toLowerCase().includes('frontend')) {
                                    color = 'bg-blue-100 text-blue-700';
                                  } else if (type?.toLowerCase().includes('backend')) {
                                    color = 'bg-green-100 text-green-700';
                                  } else if (type?.toLowerCase().includes('mobile')) {
                                    color = 'bg-orange-100 text-orange-700';
                                  } else if (type?.toLowerCase().includes('data')) {
                                    color = 'bg-purple-100 text-purple-700';
                                  } else if (type?.toLowerCase().includes('devops')) {
                                    color = 'bg-red-100 text-red-700';
                                  }
                                  
                                  return (
                                    <span key={`${rule.id}-${idx}`} className={`text-xs px-2 py-1 rounded ${color} font-medium`}>
                                      {path}
                                    </span>
                                  );
                                });
                              } else if (rule.rule_type === 'GROUP_SIZE') {
                                badgeColor = 'bg-indigo-100 text-indigo-700';
                                displayText = `${rule.rule_value} anggota`;
                              } else if (rule.rule_type === 'MAX_SAME_UNIVERSITY') {
                                badgeColor = 'bg-pink-100 text-pink-700';
                                displayText = `Max ${rule.rule_value} dari univ sama`;
                              }

                              return (
                                <span key={rule.id} className={`text-xs px-2 py-1 rounded ${badgeColor} font-medium`}>
                                  {displayText}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Team Count */}
                      <div className="flex items-center text-xs text-gray-500 mb-4">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{useCase.team_count || 0} tim terdaftar</span>
                      </div>

                      {/* Button */}
                      <button
                        onClick={() => handleViewDetail(useCase)}
                        className="w-full py-2 border-2 border-blue-500 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                      >
                        Lihat Detail
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedUseCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedUseCase.name}
                </h2>
                {selectedUseCase.company && (
                  <p className="text-gray-600 flex items-center mt-1">
                    <Building className="w-4 h-4 mr-1" />
                    {selectedUseCase.company}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Team Use Case Badge */}
            {hasGroup && teamUseCaseId === selectedUseCase.id && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-900">
                    Ini adalah Use Case yang dipilih oleh tim Anda
                  </p>
                </div>
              </div>
            )}

            {/* Read-only notice */}
            {hasGroup && teamUseCaseId !== selectedUseCase.id && (
              <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-900">
                    Anda hanya dapat melihat detail. Tim Anda sudah memilih use case lain.
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Deskripsi Project
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedUseCase.description || 'Tidak ada deskripsi'}
                </p>
              </div>
            </div>

            {/* Rules */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Syarat Tim
              </h3>
              {selectedUseCase.rules && selectedUseCase.rules.length > 0 ? (
                <div className="space-y-3">
                  {selectedUseCase.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-start p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getRuleIcon(rule.rule_type)}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-gray-900">
                          {formatRuleDisplay(rule)}
                        </p>
                        {rule.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {rule.description}
                          </p>
                        )}
                      </div>
                      {rule.is_required && (
                        <span className="badge bg-red-100 text-red-800 text-xs ml-2">
                          Wajib
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Belum ada rules untuk use case ini
                </p>
              )}
            </div>

            {/* Team Count */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center text-blue-800">
                <Users className="w-5 h-5 mr-2" />
                <span className="font-medium">
                  {selectedUseCase.team_count || 0} tim sudah memilih use case ini
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 btn btn-secondary"
              >
                Tutup
              </button>
              {hasGroup ? (
                isGroupLocked ? (
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 btn bg-gray-400 text-white cursor-not-allowed"
                    disabled
                  >
                    View Details Only
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectUseCase(selectedUseCase)}
                    className="flex-1 btn btn-primary"
                  >
                    Ganti ke Use Case Ini
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleSelectUseCase(selectedUseCase)}
                  className="flex-1 btn btn-primary"
                >
                  Pilih Use Case Ini
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && selectedUseCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Konfirmasi Pilihan
            </h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Use Case:</p>
              <p className="font-semibold text-gray-900">{selectedUseCase.name}</p>
              {selectedUseCase.company && (
                <p className="text-sm text-gray-600 mt-1">{selectedUseCase.company}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Tim *
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="input"
                placeholder="Masukkan nama tim"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Kamu bisa mengubah nama tim nanti
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Catatan:</strong> Setelah memilih, kamu akan menjadi leader tim. 
                Kamu bisa mengundang anggota dan mengubah use case selama status masih draft.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 btn btn-secondary"
                disabled={submitting}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmSelection}
                className="flex-1 btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UseCaseSelection;