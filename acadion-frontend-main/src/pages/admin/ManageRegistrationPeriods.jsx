import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const ManageRegistrationPeriods = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [formData, setFormData] = useState({
    open_date: '',
    close_date: '',
    is_active: true,
  });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/registration`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { batch_id: user.batch_id }
      });
      setPeriods(response.data.data);
    } catch (error) {
      console.error('Failed to load registration periods:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingPeriod(null);
    setFormData({
      open_date: '',
      close_date: '',
      is_active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = {
        ...formData,
        batch_id: user.batch_id,
        // Dikirim sebagai string, backend akan memprosesnya sebagai Local Time
        open_date: formData.open_date, 
        close_date: formData.close_date,
      };

      if (editingPeriod) {
        await axios.put(`${API_URL}/registration/${editingPeriod.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotification({ type: 'success', message: 'Registration period updated!' });
      } else {
        await axios.post(`${API_URL}/registration`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotification({ type: 'success', message: 'Registration period created!' });
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

  const handleEdit = (period) => {
    setEditingPeriod(period);
    
    // FIX: Format manual ke Local Time string untuk input datetime-local (YYYY-MM-DDTHH:mm)
    const toLocalISOString = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const pad = (num) => String(num).padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      open_date: toLocalISOString(period.open_date),
      close_date: toLocalISOString(period.close_date),
      is_active: period.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (periodId) => {
    if (!window.confirm('Delete this registration period?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/registration/${periodId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotification({ type: 'success', message: 'Registration period deleted!' });
      loadPeriods();
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to delete period' });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Open' },
      upcoming: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Upcoming' },
      closed: { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: 'Closed' },
    };
    const badge = badges[status] || badges.closed;
    const Icon = badge.icon;
    return (
      <span className={`badge ${badge.color} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span>{badge.text}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading..." />
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
                  Registration Periods
                </h1>
                <p className="text-gray-600 mt-2">
                  Open and close team registration based on schedule
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
                  No Registration Periods Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create a registration period to allow students to form teams
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
                {periods.map((period) => (
                  <div key={period.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Registration Period #{period.id}
                          </h3>
                          {getStatusBadge(period.status)}
                          {!period.is_active && (
                            <span className="badge bg-red-100 text-red-800">Inactive</span>
                          )}
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Open:</span>{' '}
                            {new Date(period.open_date).toLocaleString('id-ID', {
                              dateStyle: 'full',
                              timeStyle: 'short',
                            })}
                          </p>
                          <p>
                            <span className="font-medium">Close:</span>{' '}
                            {new Date(period.close_date).toLocaleString('id-ID', {
                              dateStyle: 'full',
                              timeStyle: 'short',
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            Created by: {period.creator_name}
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
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingPeriod ? 'Edit Registration Period' : 'Create Registration Period'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Open Date & Time (WIB) *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.open_date}
                    onChange={(e) => setFormData({ ...formData, open_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Close Date & Time (WIB) *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.close_date}
                    onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active (Enable this registration period)
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Students can only create teams during the open period.
                  Make sure to set the correct date and time in WIB (GMT+7).
                </p>
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

export default ManageRegistrationPeriods;