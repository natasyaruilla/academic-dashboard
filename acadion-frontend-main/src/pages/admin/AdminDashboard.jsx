// ==========================================
// src/pages/admin/AdminDashboard.jsx
// ==========================================
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, worksheetAPI, contentAPI } from '../../services/api';
import { Users, FileCheck, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGroups: 0,
    pendingGroups: 0,
    approvedGroups: 0,
    totalWorksheets: 0,
    pendingWorksheets: 0,
  });
  const [recentGroups, setRecentGroups] = useState([]);
  const [recentWorksheets, setRecentWorksheets] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [groupsRes, worksheetsRes] = await Promise.all([
        userAPI.getGroupsForValidation({ batch_id: user.batch_id }),
        worksheetAPI.getAllWorksheets({ batch_id: user.batch_id }),
      ]);

      const groups = groupsRes.data.data;
      const worksheets = worksheetsRes.data.data;

      setStats({
        totalGroups: groups.length,
        pendingGroups: groups.filter(g => g.status === 'ready').length,
        approvedGroups: groups.filter(g => g.status === 'approved').length,
        totalWorksheets: worksheets.length,
        pendingWorksheets: worksheets.filter(w => w.validation_status === 'pending').length,
      });

      setRecentGroups(groups.slice(0, 5));
      setRecentWorksheets(worksheets.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  const statCards = [
    {
      label: 'Total Groups',
      value: stats.totalGroups,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Pending Approval',
      value: stats.pendingGroups,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      label: 'Approved Groups',
      value: stats.approvedGroups,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      label: 'Pending Worksheets',
      value: stats.pendingWorksheets,
      icon: FileCheck,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.name}! Here's your overview.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          {stat.label}
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`${stat.color} p-4 rounded-xl`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Groups */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Recent Groups
                </h2>
                {recentGroups.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No groups yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentGroups.map((group) => (
                      <div
                        key={group.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {group.group_name || `Group #${group.id}`}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Leader: {group.creator_name} • {group.member_count} members
                            </p>
                          </div>
                          <span className={`badge badge-${group.status}`}>
                            {group.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Worksheets */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Recent Worksheet Submissions
                </h2>
                {recentWorksheets.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No worksheets yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentWorksheets.map((worksheet) => (
                      <div
                        key={worksheet.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {worksheet.user_name}
                          </h3>
                          <span className={`badge badge-${worksheet.validation_status}`}>
                            {worksheet.validation_status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {worksheet.period_name} • {worksheet.group_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted: {new Date(worksheet.submission_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <a
                  href="/admin/rules"
                  className="p-4 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-center"
                >
                  <Users className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium">Manage Rules</p>
                </a>
                <a
                  href="/admin/content"
                  className="p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-center"
                >
                  <FileCheck className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium">Manage Content</p>
                </a>
                <a
                  href="/admin/groups"
                  className="p-4 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-center"
                >
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium">Validate Groups</p>
                </a>
                <a
                  href="/admin/worksheets"
                  className="p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-center"
                >
                  <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium">Review Worksheets</p>
                </a>
                
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AdminDashboard;