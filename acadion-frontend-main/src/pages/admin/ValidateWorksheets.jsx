import { useState, useEffect } from 'react';
import { FileCheck, Eye, Users, CheckCircle, XCircle, AlertCircle, Clock, Mail } from 'lucide-react';
import { worksheetAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const ValidateWorksheets = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [worksheets, setWorksheets] = useState([]);
  const [groupedWorksheets, setGroupedWorksheets] = useState([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [validationData, setValidationData] = useState({
    validation_status: 'pending',
    admin_notes: '',
  });
  const [notification, setNotification] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [periods, setPeriods] = useState([]);

  useEffect(() => {
    loadWorksheets();
    loadPeriods();
  }, [filter, selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const response = await worksheetAPI.getCheckinPeriods();
      setPeriods(response.data.data);
    } catch (error) {
      console.error('Failed to load periods:', error);
    }
  };

  const loadWorksheets = async () => {
    try {
      const response = await worksheetAPI.getAllWorksheets({
        batch_id: user.batch_id,
        status: filter === 'all' ? undefined : filter,
      });
      setWorksheets(response.data.data);
      
      // Group worksheets by group and period
      const grouped = groupWorksheetsByGroupAndPeriod(response.data.data);
      setGroupedWorksheets(grouped);
    } catch (error) {
      console.error('Failed to load worksheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupWorksheetsByGroupAndPeriod = (worksheets) => {
    const grouped = {};
    
    worksheets.forEach(ws => {
      const key = `${ws.group_id}_${ws.checkin_period_id}`;
      if (!grouped[key]) {
        grouped[key] = {
          group_id: ws.group_id,
          group_name: ws.group_name,
          period_id: ws.checkin_period_id,
          period_name: ws.period_name,
          worksheets: [],
          stats: {
            total: 0,
            completed: 0,
            pending: 0,
            not_submitted: 0
          }
        };
      }
      
      grouped[key].worksheets.push(ws);
      grouped[key].stats.total++;
      
      if (ws.validation_status === 'completed' || ws.validation_status === 'completed_late') {
        grouped[key].stats.completed++;
      } else if (ws.validation_status === 'pending') {
        grouped[key].stats.pending++;
      }
    });
    
    return Object.values(grouped).filter(group => {
      if (selectedPeriod === 'all') return true;
      return group.period_id === parseInt(selectedPeriod);
    });
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    try {
      await worksheetAPI.validateWorksheet(selectedWorksheet.id, validationData);
      setNotification({ type: 'success', message: 'Worksheet validated successfully!' });
      setSelectedWorksheet(null);
      loadWorksheets();
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to validate worksheet',
      });
    }
  };

  const handleViewGroupSubmissions = (group) => {
    setSelectedGroup(group);
    setShowGroupModal(true);
  };

  const handleBatchApproveGroup = async (groupWorksheets) => {
    const pendingWorksheets = groupWorksheets.filter(ws => ws.validation_status === 'pending');
    
    if (!window.confirm(`Approve ${pendingWorksheets.length} pending submissions in this group?`)) return;

    try {
      await Promise.all(
        pendingWorksheets.map(ws => 
          worksheetAPI.validateWorksheet(ws.id, { 
            validation_status: 'completed',
            admin_notes: 'Batch approved'
          })
        )
      );
      
      setNotification({
        type: 'success',
        message: `Successfully approved ${pendingWorksheets.length} submissions!`,
      });
      setShowGroupModal(false);
      loadWorksheets();
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to approve some submissions',
      });
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Worksheet Validation</h1>
              <p className="text-gray-600 mt-2">Review and validate group submissions</p>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="period-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Period
                </label>
                <select
                  id="period-filter"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-700 cursor-pointer"
                >
                  <option value="all">All Periods</option>
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.period_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Status
                </label>
                <select
                  id="status-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-700 cursor-pointer"
                >
                  {['pending', 'completed', 'completed_late', 'not_completed', 'all'].map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {groupedWorksheets.length === 0 ? (
              <div className="card text-center py-16">
                <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No worksheets to validate</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedWorksheets.map((group) => (
                  <div key={`${group.group_id}_${group.period_id}`} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {group.group_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {group.period_name}
                        </p>
                        
                        {/* Submission Stats */}
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1 text-gray-500" />
                            <span className="font-medium text-gray-700">
                              {group.worksheets.length} submissions
                            </span>
                          </div>
                          
                          {group.stats.completed > 0 && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              <span>{group.stats.completed} Completed</span>
                            </div>
                          )}
                          
                          {group.stats.pending > 0 && (
                            <div className="flex items-center text-yellow-600">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{group.stats.pending} Pending</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Overall Status Badge */}
                      <div>
                        {group.stats.completed === group.stats.total ? (
                          <span className="badge bg-green-100 text-green-800">
                            All Validated
                          </span>
                        ) : group.stats.pending > 0 ? (
                          <span className="badge bg-yellow-100 text-yellow-800">
                            {group.stats.pending} Pending
                          </span>
                        ) : (
                          <span className="badge bg-gray-100 text-gray-800">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewGroupSubmissions(group)}
                      className="w-full btn btn-primary flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-5 h-5" />
                      <span>View All Submissions</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Group Submissions Modal */}
      {showGroupModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-5xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedGroup.group_name} - Submissions
                </h2>
                <p className="text-gray-600 mt-1">{selectedGroup.period_name}</p>
              </div>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setSelectedGroup(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Stats Summary */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Total Submissions</span>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-2">
                  {selectedGroup.worksheets.length}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">Completed</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-900 mt-2">
                  {selectedGroup.stats.completed}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-700">Pending Review</span>
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-yellow-900 mt-2">
                  {selectedGroup.stats.pending}
                </p>
              </div>
            </div>

            {/* Individual Submissions */}
            <div className="space-y-4 mb-6">
              {selectedGroup.worksheets.map((worksheet, index) => (
                <div key={worksheet.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{worksheet.user_name}</h3>
                          <p className="text-sm text-gray-600">{worksheet.email}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="mb-1">
                          <span className="font-medium">Submitted:</span>{' '}
                          {new Date(worksheet.submission_date).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {worksheet.admin_notes && (
                          <p className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded">
                            <span className="font-medium">Admin Notes:</span> {worksheet.admin_notes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`badge badge-${worksheet.validation_status} text-sm`}>
                        {worksheet.validation_status === 'completed' ? (
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                        ) : worksheet.validation_status === 'pending' ? (
                          <Clock className="w-3 h-3 inline mr-1" />
                        ) : (
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                        )}
                        {worksheet.validation_status.replace('_', ' ').toUpperCase()}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedWorksheet(worksheet);
                          setValidationData({
                            validation_status: worksheet.validation_status,
                            admin_notes: worksheet.admin_notes || '',
                          });
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Batch Actions */}
            {selectedGroup.stats.pending > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-blue-800">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">
                    {selectedGroup.stats.pending} submission{selectedGroup.stats.pending > 1 ? 's' : ''} pending review
                  </span>
                </div>
                <button
                  onClick={() => handleBatchApproveGroup(selectedGroup.worksheets)}
                  className="btn btn-success flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve All Pending
                </button>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setSelectedGroup(null);
                }}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {selectedWorksheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Review Worksheet
            </h2>

            {/* Worksheet Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Student</p>
                  <p className="font-medium text-gray-900">{selectedWorksheet.user_name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Period</p>
                  <p className="font-medium text-gray-900">{selectedWorksheet.period_name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Group</p>
                  <p className="font-medium text-gray-900">{selectedWorksheet.group_name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Submitted</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedWorksheet.submission_date).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Activity Description
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedWorksheet.activity_description}
                </p>
              </div>
            </div>

            {/* Proof File */}
            {selectedWorksheet.proof_file && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Proof File
                </h3>
                <a
                  href={selectedWorksheet.proof_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  View Proof Document
                </a>
              </div>
            )}

            {/* Validation Form */}
            <form onSubmit={handleValidate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Validation Status *
                </label>
                <select
                  value={validationData.validation_status}
                  onChange={(e) => setValidationData({ ...validationData, validation_status: e.target.value })}
                  className="input"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="completed_late">Completed Late</option>
                  <option value="not_completed">Not Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={validationData.admin_notes}
                  onChange={(e) => setValidationData({ ...validationData, admin_notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="4"
                  placeholder="Add feedback or notes for the student..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedWorksheet(null)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  Submit Validation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidateWorksheets;