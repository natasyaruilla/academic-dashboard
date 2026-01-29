// ==========================================
// src/pages/student/Feedback360.jsx
// ==========================================
import { useState, useEffect } from 'react';
import { MessageSquare, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Feedback360 = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedbackPeriod, setFeedbackPeriod] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [progress, setProgress] = useState({ submitted: 0, total: 0, feedbacks: [] });
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    is_active: 'Aktif',
    contribution_level: '',
    reason: '',
  });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [periodRes, membersRes, progressRes] = await Promise.all([
        axios.get(`${API_URL}/feedback360/active-period`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/feedback360/team-members`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/feedback360/my-progress`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (periodRes.data.data) {
        setFeedbackPeriod(periodRes.data.data);
      }
      setTeamMembers(membersRes.data.data);
      setProgress(progressRes.data.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (member) => {
    setSelectedMember(member);
    
    // Check if already submitted for this member
    const existingFeedback = progress.feedbacks.find(f => f.reviewee_id === member.id);
    if (existingFeedback) {
      setFormData({
        is_active: existingFeedback.is_active,
        contribution_level: existingFeedback.contribution_level,
        reason: existingFeedback.reason,
      });
    } else {
      setFormData({
        is_active: 'Aktif',
        contribution_level: '',
        reason: '',
      });
    }
    
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/feedback360/submit`, {
        reviewee_id: selectedMember.id,
        ...formData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotification({ 
        type: 'success', 
        message: `Feedback for ${selectedMember.name} submitted successfully!` 
      });
      setShowModal(false);
      loadData();
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to submit feedback'
      });
    }
  };

  const getCompletionPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.submitted / progress.total) * 100);
  };

  const isMemberEvaluated = (memberId) => {
    return progress.feedbacks.some(f => f.reviewee_id === memberId);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading 360 Feedback..." />
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">360 Feedback</h1>
              <p className="text-gray-600 mt-2">
                Evaluate your team members' performance
              </p>
            </div>

            {/* Feedback Period Status */}
            {feedbackPeriod ? (
              <div className={`card mb-8 border-l-4 ${
                feedbackPeriod.is_open 
                  ? 'border-l-green-500 bg-green-50' 
                  : 'border-l-red-500 bg-red-50'
              }`}>
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-full ${
                    feedbackPeriod.is_open ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <MessageSquare className={`w-6 h-6 ${
                      feedbackPeriod.is_open ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${
                      feedbackPeriod.is_open ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {feedbackPeriod.period_name}
                    </h3>
                    <div className={`mt-2 space-y-1 text-sm ${
                      feedbackPeriod.is_open ? 'text-green-800' : 'text-red-800'
                    }`}>
                      <p>
                        <span className="font-medium">Status:</span>{' '}
                        {feedbackPeriod.is_open ? '✅ Open for Submission' : '⛔ Closed'}
                      </p>
                      <p>
                        <span className="font-medium">Deadline:</span>{' '}
                        {new Date(feedbackPeriod.end_date).toLocaleString('id-ID', {
                          dateStyle: 'full',
                          timeStyle: 'short'
                        })} WIB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card mb-8 border-l-4 border-l-gray-500 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Clock className="w-6 h-6 text-gray-600" />
                  <p className="text-gray-700">
                    Tidak ada Feedback 360 yang aktif saat ini. Periksa kembali nanti.
                  </p>
                </div>
              </div>
            )}

            {/* Progress Card */}
            {teamMembers.length > 0 && (
              <div className="card mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Your Progress
                  </h3>
                  <span className="text-2xl font-bold text-primary-600">
                    {progress.submitted}/{progress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div
                    className="bg-primary-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${getCompletionPercentage()}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {getCompletionPercentage()}% Complete - 
                  {progress.submitted === progress.total 
                    ? ' ✅ All team members evaluated!' 
                    : ` ${progress.total - progress.submitted} member(s) remaining`
                  }
                </p>
              </div>
            )}

            {/* Team Members List */}
            {teamMembers.length === 0 ? (
              <div className="card text-center py-16">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Team Members to Evaluate
                </h3>
                <p className="text-gray-600">
                  You need to be in a team to submit 360 feedback.
                </p>
              </div>
            ) : (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Team Members ({teamMembers.length})
                </h3>
                <div className="space-y-4">
                  {teamMembers.map((member) => {
                    const evaluated = isMemberEvaluated(member.id);
                    return (
                      <div
                        key={member.id}
                        className={`p-4 rounded-lg border-2 ${
                          evaluated 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
                              {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {member.name}
                              </h4>
                              <p className="text-sm text-gray-600">{member.email}</p>
                              {member.learning_path && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {member.learning_path}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {evaluated && (
                              <span className="badge bg-green-100 text-green-800 flex items-center space-x-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>Evaluated</span>
                              </span>
                            )}
                            {!evaluated && (
                              <button
                                onClick={() => handleOpenModal(member)}
                                disabled={!feedbackPeriod || !feedbackPeriod.is_open}
                                className={`btn btn-primary ${
                                  (!feedbackPeriod || !feedbackPeriod.is_open) 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : ''
                                }`}
                              >
                                Give Feedback
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Feedback Modal */}
      {showModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              360 Feedback for {selectedMember.name}
            </h2>
            <p className="text-gray-600 mb-6">
              Please provide honest and constructive feedback
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question 1: ID Anggota */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Selected Member:</strong> {selectedMember.name} ({selectedMember.email})
                </p>
              </div>

              {/* Question 2: Status Keaktifan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  2. Status keaktifan anggota *
                </label>
                <div className="space-y-2">
                  {['Aktif', 'Tidak Aktif'].map((status) => (
                    <label key={status} className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="is_active"
                        value={status}
                        checked={formData.is_active === status}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}
                        className="w-4 h-4 text-primary-600"
                        required
                      />
                      <span className="text-gray-900">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 3: Penilaian Kontribusi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  3. Penilaian untuk anggota tersebut *
                </label>
                <div className="space-y-2">
                  {[
                    'Memberikan kontribusi signifikan',
                    'Memberikan kontribusi, tetapi sedang sakit/dalam keadaan darurat',
                    'Memberikan kontribusi, tetapi tidak signifikan',
                    'Tidak memberikan kontribusi sama sekali'
                  ].map((level) => (
                    <label key={level} className="flex items-start space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="contribution_level"
                        value={level}
                        checked={formData.contribution_level === level}
                        onChange={(e) => setFormData({ ...formData, contribution_level: e.target.value })}
                        className="w-4 h-4 text-primary-600 mt-0.5"
                        required
                      />
                      <span className="text-gray-900 text-sm">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 4: Alasan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  4. Alasan dari penilaian tersebut *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="6"
                  placeholder="Jelaskan alasan penilaian Anda secara detail dan konstruktif..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 50 karakter
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Catatan:</strong> Feedback ini bersifat rahasia dan hanya akan dilihat oleh admin untuk keperluan evaluasi.
                  Berikan penilaian yang jujur dan objektif.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 btn btn-primary"
                  disabled={formData.reason.length < 50}
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback360;