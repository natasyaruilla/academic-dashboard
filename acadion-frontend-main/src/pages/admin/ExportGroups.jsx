import { useState, useEffect } from 'react';
import { Download, FileText, Users, Filter } from 'lucide-react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const ExportGroups = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState('all');
  const [notification, setNotification] = useState(null);

  const handleExport = async (format) => {
    setLoading(true);
    try {
      const params = {
        batch_id: user.batch_id,
        status: filter === 'all' ? undefined : filter
      };

      const response = await userAPI.exportGroups(params);
      const groupsData = response.data.data;

      if (format === 'csv') {
        exportToCSV(groupsData);
      } else if (format === 'json') {
        exportToJSON(groupsData);
      }

      setNotification({
        type: 'success',
        message: `Groups exported successfully as ${format.toUpperCase()}`
      });
    } catch (error) {
      console.error('Export error:', error);
      setNotification({
        type: 'error',
        message: 'Failed to export groups'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (groupsData) => {
    // Create CSV header
    const headers = [
      'Group ID',
      'Group Name',
      'Status',
      'Created At',
      'Locked At',
      'Member ID',
      'Member Name',
      'Member Email',
      'Member Role',
      'Learning Path',
      'University',
      'Learning Group'
    ];

    // Create CSV rows
    const rows = [];
    groupsData.forEach(group => {
      if (group.members.length === 0) {
        // Group without members
        rows.push([
          group.group_id,
          group.group_name,
          group.status,
          formatDate(group.created_at),
          group.locked_at ? formatDate(group.locked_at) : '',
          '',
          '',
          '',
          '',
          '',
          '',
          ''
        ]);
      } else {
        // Group with members
        group.members.forEach(member => {
          rows.push([
            group.group_id,
            group.group_name,
            group.status,
            formatDate(group.created_at),
            group.locked_at ? formatDate(group.locked_at) : '',
            member.member_id,
            member.member_name,
            member.member_email,
            member.role,
            member.learning_path || '',
            member.university || '',
            member.learning_group || ''
          ]);
        });
      }
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download file
    downloadFile(csvContent, `groups_export_${Date.now()}.csv`, 'text/csv');
  };

  const exportToJSON = (groupsData) => {
    const jsonContent = JSON.stringify(groupsData, null, 2);
    downloadFile(jsonContent, `groups_export_${Date.now()}.json`, 'application/json');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('id-ID');
  };

  const loadPreview = async () => {
    setLoading(true);
    try {
      const params = {
        batch_id: user.batch_id,
        status: filter === 'all' ? undefined : filter
      };

      const response = await userAPI.exportGroups(params);
      setGroups(response.data.data);
    } catch (error) {
      console.error('Load preview error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [filter]);

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
              <h1 className="text-3xl font-bold text-gray-900">
                Export Groups Data
              </h1>
              <p className="text-gray-600 mt-2">
                Export capstone groups data in CSV or JSON format
              </p>
            </div>

            {/* Filter & Export Actions */}
            <div className="card mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                {/* Filter */}
                <div className="flex items-center space-x-3">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <label className="text-sm font-medium text-gray-700">
                    Filter by Status:
                  </label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Groups</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready (Waiting Approval)</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Export Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={loading || groups.length === 0}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    disabled={loading || groups.length === 0}
                    className="btn btn-secondary flex items-center space-x-2"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
                    <p className="text-sm text-gray-600">Total Groups</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {groups.reduce((sum, g) => sum + g.members.length, 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total Members</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {groups.filter(g => g.status === 'approved').length}
                    </p>
                    <p className="text-sm text-gray-600">Approved</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {groups.filter(g => g.status === 'ready').length}
                    </p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Preview Data
              </h2>

              {loading ? (
                <LoadingSpinner size="md" text="Loading preview..." />
              ) : groups.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No groups to export</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {groups.slice(0, 5).map((group) => (
                    <div key={group.group_id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {group.group_name || `Group #${group.group_id}`}
                        </h3>
                        <span className={`badge badge-${group.status}`}>
                          {group.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Members: {group.members.length}
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        {group.members.slice(0, 3).map((member) => (
                          <div key={member.member_id}>
                            • {member.member_name} ({member.role}) - {member.learning_path}
                          </div>
                        ))}
                        {group.members.length > 3 && (
                          <div>... and {group.members.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {groups.length > 5 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      Showing 5 of {groups.length} groups. Export to see all data.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default ExportGroups;