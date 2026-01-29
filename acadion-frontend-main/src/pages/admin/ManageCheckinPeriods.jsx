// ==========================================
// src/pages/admin/ManageCheckinPeriods.jsx
// ==========================================
import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { worksheetAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const ManageCheckinPeriods = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [formData, setFormData] = useState({
    period_name: '',
    start_date: '',
    end_date: '',
    description: '',
    is_active: true,
  });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      const response = await worksheetAPI.getCheckinPeriods();
      setPeriods(response.data.data);
    } catch (error) {
      console.error('Failed to load check-in periods:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingPeriod(null);
    setFormData({
      period_name: '',
      start_date: '',
      end_date: '',
      description: '',
      is_active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        batch_id: user.batch_id,
        // Dikirim sebagai string form (YYYY-MM-DDTHH:mm), backend memproses sbg Local
        start_date: formData.start_date,
        end_date: formData.end_date,
      };

      if (editingPeriod) {
        await worksheetAPI.updateCheckinPeriod(editingPeriod.id, data);
        setNotification({ 
          type: 'success', 
          message: 'Check-in period updated successfully!' 
        });
      } else {
        await worksheetAPI.createCheckinPeriod(data);
        setNotification({ 
          type: 'success', 
          message: 'Check-in period created successfully!' 
        });
      }

      setShowModal(false);
      resetForm();
      loadPeriods();
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Operation failed',
      });
    }
  };

  const handleDelete = async (periodId) => {
    if (!window.confirm('Are you sure you want to delete this check-in period? All related worksheets will also be deleted.')) {
      return;
    }

    try {
      await worksheetAPI.deleteCheckinPeriod(periodId);
      setNotification({
        type: 'success',
        message: 'Check-in period deleted successfully!',
      });
      loadPeriods();
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete period',
      });
    }
  };

  const handleEdit = (period) => {
    setEditingPeriod(period);
    
    // FIX: Format datetime untuk input datetime-local (YYYY-MM-DDTHH:mm) secara manual
    // menggunakan Local Time components
    const formatForInput = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const pad = (n) => String(n).padStart(2, '0');
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      period_name: period.period_name,
      start_date: formatForInput(period.start_date),
      end_date: formatForInput(period.end_date),
      description: period.description || '',
      is_active: period.is_active,
    });
    setShowModal(true);
  };

  const isActivePeriod = (period) => {
    const now = new Date();
    const start = new Date(period.start_date);
    const end = new Date(period.end_date);
    return now >= start && now <= end && period.is_active;
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading check-in periods..." />
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Check-in Periods Management
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage worksheet submission periods for students
                </p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Period</span>
              </button>
            </div>

            {periods.length === 0 ? (
              <div className="card text-center py-16">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Check-in Periods Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first check-in period to allow students to submit worksheets
                </p>
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="btn btn-primary inline-flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create First Period</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {periods.map((period) => {
                  const isActive = isActivePeriod(period);
                  return (
                    <div
                      key={period.id}
                      className={`card ${
                        isActive ? 'border-l-4 border-l-green-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {period.period_name}
                            </h3>
                            {isActive && (
                              <span className="badge bg-green-100 text-green-800 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Active Now</span>
                              </span>
                            )}
                            {!period.is_active && (
                              <span className="badge bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {period.description}
                          </p>
                          <div className="space-y-1 text-xs text-gray-600">
                            <p>
                              <span className="font-medium">Start:</span>{' '}
                              {new Date(period.start_date).toLocaleString('id-ID', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </p>
                            <p>
                              <span className="font-medium">End:</span>{' '}
                              {new Date(period.end_date).toLocaleString('id-ID', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-4 border-t">
                        <button
                          onClick={() => handleEdit(period)}
                          className="flex-1 btn btn-secondary flex items-center justify-center space-x-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(period.id)}
                          className="flex-1 btn btn-danger flex items-center justify-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingPeriod ? 'Edit Check-in Period' : 'Create Check-in Period'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period Name *
                </label>
                <input
                  type="text"
                  value={formData.period_name}
                  onChange={(e) =>
                    setFormData({ ...formData, period_name: e.target.value })
                  }
                  className="input"
                  placeholder="e.g., Check-in Week 1-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder="Describe what students should submit during this period..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active (Students can submit worksheets)
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  {editingPeriod ? 'Update Period' : 'Create Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCheckinPeriods;