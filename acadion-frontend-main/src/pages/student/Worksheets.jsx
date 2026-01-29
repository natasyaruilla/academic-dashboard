import { useState, useEffect } from 'react';
import { FileText, Upload, Calendar, CheckCircle, Users, AlertCircle, Edit2 } from 'lucide-react';
import { worksheetAPI, groupAPI } from '../../services/api';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';
import { useNavigate } from 'react-router-dom';

const Worksheets = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasGroup, setHasGroup] = useState(false);
  const [periods, setPeriods] = useState([]);
  const [worksheets, setWorksheets] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [editingWorksheet, setEditingWorksheet] = useState(null);
  const [formData, setFormData] = useState({
    activity_description: '',
    proof_file: '',
  });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // First check if user has a group
      const groupRes = await groupAPI.getMyGroup();
      const userHasGroup = groupRes.data.data !== null;
      setHasGroup(userHasGroup);

      // Only load worksheets data if user has a group
      if (userHasGroup) {
        const [periodsRes, worksheetsRes] = await Promise.all([
          worksheetAPI.getCheckinPeriods(),
          worksheetAPI.getMyWorksheets(),
        ]);
        setPeriods(periodsRes.data.data);
        setWorksheets(worksheetsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setHasGroup(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWorksheet) {
        // Update existing worksheet
        await worksheetAPI.updateWorksheet(editingWorksheet.id, formData);
        setNotification({ type: 'success', message: 'Worksheet berhasil diperbarui!' });
      } else {
        // Create new worksheet
        await worksheetAPI.submitWorksheet({
          checkin_period_id: selectedPeriod.id,
          ...formData,
        });
        setNotification({ type: 'success', message: 'Worksheet berhasil dikirim!' });
      }
      setShowSubmitModal(false);
      setEditingWorksheet(null);
      setFormData({ activity_description: '', proof_file: '' });
      loadData();
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.message || 'Gagal mengirim worksheet' 
      });
    }
  };

  const isActivePeriod = (period) => {
    const now = new Date();
    const start = new Date(period.start_date);
    const end = new Date(period.end_date);
    return now >= start && now <= end && period.is_active;
  };

  const hasSubmittedForPeriod = (periodId) => {
    return worksheets.some(ws => ws.checkin_period_id === periodId);
  };

  const getWorksheetForPeriod = (periodId) => {
    return worksheets.find(ws => ws.checkin_period_id === periodId);
  };

  const handleEditWorksheet = (period) => {
    const worksheet = getWorksheetForPeriod(period.id);
    if (worksheet) {
      setEditingWorksheet(worksheet);
      setSelectedPeriod(period);
      setFormData({
        activity_description: worksheet.activity_description,
        proof_file: worksheet.proof_file || '',
      });
      setShowSubmitModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading worksheets..." />
        </div>
      </div>
    );
  }

  // If user doesn't have a group, show empty state
  if (!hasGroup) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Worksheets</h1>
              </div>

              {/* Empty State - Not in a team */}
              <div className="card">
                <div className="text-center py-16">
                  <div className="mb-6 flex justify-center">
                    <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-12 h-12 text-yellow-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Anda Belum Terdaftar dalam Tim
                  </h2>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Untuk dapat mengakses worksheet, Anda harus tergabung dalam sebuah tim terlebih dahulu. 
                    Silakan bergabung atau membuat tim baru.
                  </p>
                  <button
                    onClick={() => navigate('/student/my-group')}
                    className="btn btn-primary inline-flex items-center space-x-2"
                  >
                    <Users className="w-5 h-5" />
                    <span>Kelola Tim Saya</span>
                  </button>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  const activePeriods = periods.filter(isActivePeriod);
  const closedPeriods = periods.filter(period => !isActivePeriod(period));
  const allPeriods = [...activePeriods, ...closedPeriods];

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
              <h1 className="text-3xl font-bold text-gray-900">Worksheets</h1>
            </div>

            {/* Check-in Periods */}
            <div className="card mb-8 border-l-4 border-l-blue-500">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-6 h-6" style={{ color: '#46525c' }} />
                <span>Check-in Periods</span>
              </h2>
              <div className="space-y-3">
                {allPeriods.map((period) => {
                  const hasSubmitted = hasSubmittedForPeriod(period.id);
                  const isClosed = !isActivePeriod(period);
                  return (
                    <div
                      key={period.id}
                      className={`p-4 rounded-lg ${
                        isClosed ? 'bg-gray-50' : 'bg-green-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h3 className={`font-semibold mb-1 ${isClosed ? 'text-gray-700' : 'text-gray-900'}`}>
                            {period.period_name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {period.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(period.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(period.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </p>
                        </div>
                        {isClosed ? (
                          <button
                            disabled
                            className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium cursor-not-allowed"
                          >
                            Closed
                          </button>
                        ) : hasSubmitted ? (
                          <button
                            onClick={() => handleEditWorksheet(period)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                          >
                            <Edit2 className="w-5 h-5" />
                            <span>Edit</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedPeriod(period);
                              setEditingWorksheet(null);
                              setFormData({ activity_description: '', proof_file: '' });
                              setShowSubmitModal(true);
                            }}
                            className="btn btn-success flex items-center space-x-2"
                          >
                            <Upload className="w-5 h-5" />
                            <span>Submit</span>
                          </button>
                        )}
                      </div>
                      
                      {/* Status Indicator */}
                      <div className="pt-3 border-t border-gray-200">
                        {hasSubmitted ? (
                          <p className="text-xs text-green-700 font-medium flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Sudah disubmit
                          </p>
                        ) : (
                          <p className="text-xs text-red-600 font-medium flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Tidak disubmit
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My Submissions */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                My Submissions
              </h2>
              
              {worksheets.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No submissions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {worksheets.map((worksheet) => (
                    <div
                      key={worksheet.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {worksheet.period_name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Submitted: {new Date(worksheet.submission_date).toLocaleString()}
                          </p>
                        </div>
                        <span className={`badge badge-${worksheet.validation_status}`}>
                          {worksheet.validation_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {worksheet.activity_description}
                        </p>
                      </div>
                      {worksheet.admin_notes && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm font-medium text-blue-900 mb-1">
                            Admin Notes:
                          </p>
                          <p className="text-sm text-blue-800">
                            {worksheet.admin_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingWorksheet ? 'Edit Worksheet' : 'Submit Worksheet'}
            </h2>
            <p className="text-gray-600 mb-6">
              Period: <span className="font-medium">{selectedPeriod?.period_name}</span>
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Description *
                </label>
                <textarea
                  value={formData.activity_description}
                  onChange={(e) => setFormData({ ...formData, activity_description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="6"
                  placeholder="Describe your activities during this period..."
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proof File URL
                </label>
                <input
                  type="url"
                  value={formData.proof_file}
                  onChange={(e) => setFormData({ ...formData, proof_file: e.target.value })}
                  className="input"
                  placeholder="https://drive.google.com/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste link to your proof document (Google Drive, Dropbox, etc.)
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  Submit Worksheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Worksheets;

