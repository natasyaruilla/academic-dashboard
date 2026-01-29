import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Lock, Edit2, Mail, X, Building, 
  CheckCircle, XCircle, AlertCircle, RefreshCw,
  GraduationCap, Eye, ArrowRight, Plus // Ditambahkan Plus jika diperlukan
} from 'lucide-react';
import { groupAPI, invitationAPI, useCaseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const MyGroup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [validation, setValidation] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [notification, setNotification] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [lockingTeam, setLockingTeam] = useState(false);
  
  // State baru untuk periode pendaftaran
  const [registrationPeriod, setRegistrationPeriod] = useState(null);

  useEffect(() => {
    loadGroupData();
    loadRegistrationPeriod(); // Load data periode pendaftaran
  }, []);

  const loadRegistrationPeriod = async () => {
    try {
      const token = localStorage.getItem('token');
      // Menggunakan environment variable atau default localhost
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      
      const response = await fetch(`${API_URL}/registration/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setRegistrationPeriod(data.data);
      }
    } catch (error) {
      console.error('Failed to load registration period:', error);
    }
  };

  const loadGroupData = async () => {
    try {
      const response = await groupAPI.getMyGroup();
      if (response.data.data) {
        setGroup(response.data.data);
        setValidation(response.data.data.validation);
      }
    } catch (error) {
      console.error('Failed to load group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    try {
      await invitationAPI.sendInvitation({
        groupId: group.id,
        invitee_email: inviteEmail,
      });
      setNotification({ type: 'success', message: 'Undangan berhasil dikirim!' });
      setInviteEmail('');
      loadGroupData();
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.message || 'Gagal mengirim undangan' 
      });
    }
  };

  const handleLockTeam = async () => {
    setLockingTeam(true);
    try {
      await groupAPI.lockTeam(group.id);
      setNotification({ 
        type: 'success', 
        message: 'Tim berhasil dikunci! Menunggu approval admin.' 
      });
      setShowReviewModal(false);
      loadGroupData();
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.message || 'Gagal mengunci tim' 
      });
    } finally {
      setLockingTeam(false);
    }
  };

  const handleChangeUseCase = () => {
    navigate('/student/use-cases');
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading group..." />
        </div>
      </div>
    );
  }

  // No group - Logic updated with Registration Period Check
  if (!group) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="card text-center py-16">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Kamu belum terdaftar dalam tim
                </h2>

                {/* LOGIKA BARU: Cek Periode Pendaftaran */}
                {registrationPeriod && !registrationPeriod.is_open ? (
                  // KONDISI 1: Pendaftaran TUTUP
                  <div className="max-w-md mx-auto mt-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-800 font-medium">
                        ⛔ Pendaftaran tim telah ditutup
                      </p>
                      <p className="text-sm text-red-700 mt-2">
                        Pendaftaran ditutup pada:
                      </p>
                      <p className="text-sm text-red-900 font-semibold">
                        {new Date(registrationPeriod.close_date).toLocaleString('id-ID', {
                          dateStyle: 'full',
                          timeStyle: 'short'
                        })} WIB
                      </p>
                    </div>
                  </div>
                ) : registrationPeriod && registrationPeriod.is_open ? (
                  // KONDISI 2: Pendaftaran BUKA -> Tampilkan Tombol Action Original
                  <>
                    <p className="text-gray-600 mb-6">
                      Pilih use case untuk memulai membentuk tim
                    </p>
                    <button
                      onClick={() => navigate('/student/use-cases')}
                      className="btn btn-primary inline-flex items-center space-x-2"
                    >
                      <span>Pilih Use Case</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  // KONDISI 3: Loading info pendaftaran
                  <p className="text-gray-600 mt-4">
                    Memuat informasi pendaftaran...
                  </p>
                )}
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  const isLeader = group.role === 'leader';
  const canEdit = isLeader && group.status === 'draft';
  const canLock = isLeader && validation?.canLock;

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
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Tim Saya</h1>
            </div>

            {/* Status Banner */}
            {group.status === 'ready' && (
              <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      Tim sedang menunggu approval admin
                    </p>
                    <p className="text-sm text-yellow-700">
                      Kamu akan mendapat notifikasi setelah admin mereview tim kamu.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {group.status === 'approved' && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-800">
                      Tim telah disetujui!
                    </p>
                    <p className="text-sm text-green-700">
                      Selamat! Tim kamu sudah resmi terdaftar untuk capstone project.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Group Info Card */}
              <div className="card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {group.group_name}
                      </h2>
                      <span className={`badge badge-${group.status} text-sm px-3 py-1`}>
                        {group.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      Role: <span className="font-medium capitalize">{group.role}</span>
                    </p>
                  </div>
                </div>

                {/* Use Case Info */}
                {validation?.useCase && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium mb-1">Use Case</p>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {validation.useCase.name}
                        </h3>
                        {validation.useCase.company && (
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <Building className="w-4 h-4 mr-1" />
                            {validation.useCase.company}
                          </p>
                        )}
                      </div>
                      {canEdit && (
                        <button
                          onClick={handleChangeUseCase}
                          className="btn btn-secondary text-sm flex items-center space-x-1"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Ganti</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Members */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Anggota Tim ({group.members?.length || 0} orang)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.members?.map((member) => (
                      <div
                        key={member.id}
                        className="p-4 bg-gray-50 rounded-lg flex items-start space-x-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold flex-shrink-0">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">
                              {member.name}
                            </p>
                            {member.role === 'leader' && (
                              <span className="badge bg-blue-100 text-blue-800 text-xs">
                                Leader
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{member.email}</p>
                          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                            {member.learning_path && (
                              <span className="flex items-center">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                {member.learning_path}
                              </span>
                            )}
                            {member.university && (
                              <span className="flex items-center">
                                <Building className="w-3 h-3 mr-1" />
                                {member.university}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite Section */}
                {canEdit && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Undang Anggota
                    </h3>
                    <form onSubmit={handleSendInvitation} className="flex space-x-3">
                      <div className="flex-1 relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="Masukkan email"
                          className="w-full pl-11 input"
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-primary">
                        Kirim Undangan
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Validation Checklist */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Validasi Tim
                </h3>

                {validation?.validations?.length > 0 ? (
                  <div className="space-y-3">
                    {validation.validations.map((rule) => (
                      <div
                        key={rule.ruleId}
                        className={`p-4 rounded-lg border-2 ${
                          rule.passed
                            ? 'bg-green-50 border-green-200'
                            : rule.isRequired
                            ? 'bg-red-50 border-red-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {rule.passed ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="font-medium text-gray-900">{rule.message}</p>
                              {rule.isRequired && (
                                <span className="badge bg-red-100 text-red-800 text-xs">
                                  Wajib
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Belum ada rules untuk use case ini
                  </p>
                )}

                {canLock && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium mb-3">
                      ✓ Tim kamu sudah memenuhi semua syarat dan siap untuk dikunci!
                    </p>
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="btn btn-success w-full flex items-center justify-center space-x-2"
                    >
                      <Lock className="w-5 h-5" />
                      <span>Review & Lock Tim</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Review Tim Final
            </h2>

            {/* Group Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">{group.group_name}</h3>
              {validation?.useCase && (
                <p className="text-sm text-gray-600">
                  Use Case: <span className="font-medium">{validation.useCase.name}</span>
                  {validation.useCase.company && ` • ${validation.useCase.company}`}
                </p>
              )}
            </div>

            {/* Members Summary */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Anggota ({group.members?.length})</h3>
              <div className="space-y-2">
                {group.members?.map((member, index) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.learning_path} • {member.university}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation Summary */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Status Validasi</h3>
              <div className="space-y-2">
                {validation?.validations?.map((rule) => (
                  <div key={rule.ruleId} className="flex items-center space-x-2 text-sm">
                    {rule.passed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={rule.passed ? 'text-green-700' : 'text-red-700'}>
                      {rule.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Perhatian:</strong> Setelah dikunci, kamu tidak bisa mengubah anggota tim atau use case. 
                Tim akan masuk antrian approval admin.
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 btn btn-secondary"
                disabled={lockingTeam}
              >
                Batal
              </button>
              <button
                onClick={handleLockTeam}
                className="flex-1 btn btn-success flex items-center justify-center space-x-2"
                disabled={!canLock || lockingTeam}
              >
                {lockingTeam ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Konfirmasi & Kunci Tim</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyGroup;