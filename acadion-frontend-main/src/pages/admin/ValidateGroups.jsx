import { useState, useEffect } from 'react';
import { 
  Users, CheckCircle, XCircle, Eye, Building, 
  GraduationCap, Briefcase, AlertCircle, Download, Edit2, UserPlus, UserMinus
} from 'lucide-react';
import { adminGroupAPI, groupAPI, exportAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const ValidateGroups = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [validation, setValidation] = useState(null);
  const [notification, setNotification] = useState(null);
  const [filter, setFilter] = useState('ready');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [showEditMembersModal, setShowEditMembersModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    loadGroups();
  }, [filter]);

  const loadGroups = async () => {
    try {
      const response = await adminGroupAPI.getGroupsForValidation({
        batch_id: user.batch_id,
        status: filter === 'all' ? undefined : filter,
      });
      setGroups(response.data.data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetails = async (groupId) => {
    try {
      const [detailsRes, validationRes] = await Promise.all([
        groupAPI.getGroupDetails(groupId),
        groupAPI.getValidation(groupId),
      ]);
      const groupData = detailsRes.data.data;
      // Ensure creator_id is available
      if (groupData && groupData.group) {
        groupData.creator_id = groupData.group.creator_user_id;
      }
      setGroupDetails(groupData);
      setValidation(validationRes.data.data);
      setSelectedGroup(groupId);
    } catch (error) {
      console.error('Failed to load group details:', error);
    }
  };

  const handleExportGroups = async () => {
    try {
      const res = await exportAPI.exportGroups(user.batch_id);

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;

      link.setAttribute(
        "download",
        `Groups_${user.batch_id}_${Date.now()}.xlsx`
      );

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "Failed to export groups",
      });
    }
  };


  const handleApprove = async (groupId) => {
    if (!window.confirm('Approve this group?')) return;

    try {
      await adminGroupAPI.validateGroup(groupId, { status: 'approved' });
      setNotification({
        type: 'success',
        message: 'Group approved successfully!',
      });
      setSelectedGroup(null);
      loadGroups();
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to approve group',
      });
    }
  };

  const handleRejectClick = () => {
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    try {
      await adminGroupAPI.validateGroup(selectedGroup, { 
        status: 'rejected',
        rejection_reason: rejectionReason 
      });
      setNotification({
        type: 'success',
        message: 'Group rejected. The team can now select a different use case.',
      });
      setShowRejectModal(false);
      setSelectedGroup(null);
      loadGroups();
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to reject group',
      });
    }
  };

  const handleSelectGroup = (groupId) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await adminGroupAPI.searchAvailableUsers(query);
      console.log('Search response:', response.data);
      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error('Search error:', error);
      setNotification({
        type: 'error',
        message: 'Failed to search users'
      });
      setSearchResults([]);
    }
  };

  const handleSelectAll = () => {
    const readyGroups = groups.filter(g => g.status === 'ready');
    if (selectedGroups.length === readyGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(readyGroups.map(g => g.id));
    }
  };

  const handleBatchApprove = async () => {
    if (!window.confirm(`Approve ${selectedGroups.length} selected groups?`)) return;

    try {
      await adminGroupAPI.batchValidateGroups({
        group_ids: selectedGroups,
        status: 'approved'
      });
      
      setNotification({
        type: 'success',
        message: `Successfully approved ${selectedGroups.length} groups!`,
      });
      setSelectedGroups([]);
      loadGroups();
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to approve some groups',
      });
    }
  };

  const handleEditMembers = async (group) => {
    setEditingGroup(group);
    // Load group details without setting selectedGroup to avoid opening view modal
    try {
      const [detailsRes, validationRes] = await Promise.all([
        groupAPI.getGroupDetails(group.id),
        groupAPI.getValidation(group.id),
      ]);
      const groupData = detailsRes.data.data;
      if (groupData && groupData.group) {
        groupData.creator_id = groupData.group.creator_user_id;
      }
      setGroupDetails(groupData);
      setValidation(validationRes.data.data);
    } catch (error) {
      console.error('Failed to load group details:', error);
    }
    setShowEditMembersModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading groups..." />
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
                <h1 className="text-3xl font-bold text-gray-900">Group Validation</h1>
                <p className="text-gray-600 mt-2">Review and approve team formations</p>
              </div>

              <button
                onClick={handleExportGroups}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Download className="w-8 h-5" />
                Export Groups
              </button>
            </div>


            {/* Filter and Select All */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Status
                </label>
                <select
                  id="status-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="block w-full sm:w-48 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 cursor-pointer"
                >
                  {['ready', 'approved', 'rejected', 'all'].map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {filter === 'ready' && groups.filter(g => g.status === 'ready').length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGroups.length === groups.filter(g => g.status === 'ready').length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Select All</span>
                  </label>
                </div>
              )}
            </div>

            {groups.length === 0 ? (
              <div className="card text-center py-16">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No groups to validate</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {groups.map((group) => (
                  <div key={group.id} className={`card ${selectedGroups.includes(group.id) ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="flex items-start gap-3 mb-4">
                      {/* Checkbox for ready groups */}
                      {group.status === 'ready' && (
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(group.id)}
                          onChange={() => handleSelectGroup(group.id)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {group.group_name || `Group #${group.id}`}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Leader: {group.creator_name}
                            </p>
                            {/* Use Case Info */}
                            {group.use_case_name && (
                              <div className="flex items-center text-sm text-blue-600 mt-2">
                                <Briefcase className="w-4 h-4 mr-1 flex-shrink-0" />
                                <span>{group.use_case_name}</span>
                                {group.use_case_company && (
                                  <span className="text-gray-400 ml-1">• {group.use_case_company}</span>
                                )}
                              </div>
                            )}
                            <p className="text-sm text-gray-600 mt-1">
                              Members: {group.member_count}
                            </p>
                            {group.locked_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                Locked: {new Date(group.locked_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <span className={`badge badge-${group.status} text-sm px-3 py-1`}>
                            {group.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => loadGroupDetails(group.id)}
                        className="flex-1 btn btn-secondary flex items-center justify-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      
                      <button
                        onClick={() => handleEditMembers(group)}
                        className="btn bg-purple-600 hover:bg-purple-700 text-white px-4"
                        title="Edit Members"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {group.status === 'ready' && !selectedGroups.includes(group.id) && (
                        <>
                          <button
                            onClick={() => handleApprove(group.id)}
                            className="btn btn-success px-3"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGroup(group.id);
                              handleRejectClick();
                            }}
                            className="btn btn-danger px-3"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Group Details Modal */}
      {selectedGroup && groupDetails && !showRejectModal && !showEditMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {groupDetails.group.group_name}
                </h2>
                {validation?.useCase && (
                  <p className="text-gray-600 flex items-center mt-1">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {validation.useCase.name}
                    {validation.useCase.company && ` • ${validation.useCase.company}`}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Members List */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Team Members ({groupDetails.members.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupDetails.members.map((member) => (
                  <div key={member.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{member.name}</p>
                          {member.role === 'leader' && (
                            <span className="badge bg-blue-100 text-blue-800 text-xs">
                              Leader
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
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
                  </div>
                ))}
              </div>
            </div>

            {/* Validation Checklist */}
            {validation && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Validation Status
                </h3>
                <div className="space-y-3">
                  {validation.validations?.map((rule) => (
                    <div
                      key={rule.ruleId}
                      className={`p-4 rounded-lg border-2 ${
                        rule.passed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {rule.passed ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{rule.message}</p>
                          {rule.isRequired && (
                            <span className="badge bg-red-100 text-red-800 text-xs mt-1">
                              Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {groupDetails.group.status === 'ready' && (
              <div className="flex space-x-3">
                <button
                  onClick={handleRejectClick}
                  className="flex-1 btn btn-danger"
                >
                  Reject Group
                </button>
                <button
                  onClick={() => handleApprove(selectedGroup)}
                  className="flex-1 btn btn-success"
                >
                  Approve Group
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Action Bar */}
      {selectedGroups.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-500 px-6 py-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">
                {selectedGroups.length} group{selectedGroups.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <button
              onClick={handleBatchApprove}
              className="btn btn-success flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Approve Selected
            </button>
            <button
              onClick={() => setSelectedGroups([])}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Members Modal */}
      {showEditMembersModal && groupDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Edit Members - {editingGroup?.group_name}
              </h2>
              <button
                onClick={() => {
                  setShowEditMembersModal(false);
                  setEditingGroup(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Use Case Info */}
            {editingGroup?.use_case_name && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center text-blue-800">
                  <Briefcase className="w-5 h-5 mr-2" />
                  <span className="font-medium">{editingGroup.use_case_name}</span>
                  {editingGroup.use_case_company && (
                    <span className="text-blue-600 ml-2">• {editingGroup.use_case_company}</span>
                  )}
                </div>
              </div>
            )}

            {/* Current Members */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Current Members ({groupDetails.members?.length || 0})
              </h3>
              <div className="space-y-3">
                {groupDetails.members?.sort((a, b) => {
                  // Sort: leader first, then others
                  if (a.id === groupDetails.creator_id) return -1;
                  if (b.id === groupDetails.creator_id) return 1;
                  return 0;
                }).map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        {member.id === groupDetails.creator_id && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Leader</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          {member.learning_path || 'N/A'}
                        </span>
                        <span className="flex items-center">
                          <Building className="w-3 h-3 mr-1" />
                          {member.university || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (member.id === groupDetails.creator_id) {
                          setNotification({
                            type: 'error',
                            message: 'Cannot remove the group creator'
                          });
                          return;
                        }
                        
                        if (window.confirm(`Remove ${member.name} from this group? The group will be re-validated.`)) {
                          try {
                            console.log('Removing member:', { groupId: editingGroup.id, userId: member.id });
                            const response = await adminGroupAPI.removeMemberFromGroup(editingGroup.id, member.id);
                            console.log('Remove response:', response.data);
                            
                            setNotification({
                              type: 'success',
                              message: `${member.name} removed successfully. Group has been re-validated.`
                            });
                            
                            // Reload group details for edit modal
                            const detailsRes = await groupAPI.getGroupDetails(editingGroup.id);
                            const groupData = detailsRes.data.data;
                            if (groupData && groupData.group) {
                              groupData.creator_id = groupData.group.creator_user_id;
                            }
                            setGroupDetails(groupData);
                            
                            // Reload groups list
                            loadGroups();
                          } catch (error) {
                            console.error('Remove member error:', error);
                            setNotification({
                              type: 'error',
                              message: error.response?.data?.message || 'Failed to remove member'
                            });
                          }
                        }
                      }}
                      disabled={member.id === groupDetails.creator_id}
                      className={`btn px-3 ${
                        member.id === groupDetails.creator_id 
                          ? 'btn-secondary opacity-50 cursor-not-allowed' 
                          : 'btn-danger'
                      }`}
                      title={member.id === groupDetails.creator_id ? 'Cannot remove group leader' : 'Remove member'}
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation Rules Info */}
            {validation && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Validation Status</h4>
                {validation.violations && validation.violations.length > 0 ? (
                  <div className="space-y-2">
                    {validation.violations.map((violation, idx) => (
                      <div key={idx} className="flex items-start text-sm">
                        <AlertCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-red-700">{violation}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    All validation rules passed
                  </div>
                )}
              </div>
            )}

            {/* Add Member Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Member</h3>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                {user.learning_path || 'N/A'}
                              </span>
                              <span className="flex items-center">
                                <Building className="w-3 h-3 mr-1" />
                                {user.university || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Add ${user.name} to this group? The group will be re-validated.`)) {
                                try {
                                  const response = await adminGroupAPI.addMemberToGroup(editingGroup.id, { user_id: user.id });
                                  console.log('Add member response:', response.data);
                                  
                                  setNotification({
                                    type: 'success',
                                    message: `${user.name} added successfully. Group auto-approved by admin.`
                                  });
                                  setSearchQuery('');
                                  setSearchResults([]);
                                  
                                  // Reload group details
                                  const detailsRes = await groupAPI.getGroupDetails(editingGroup.id);
                                  const groupData = detailsRes.data.data;
                                  if (groupData && groupData.group) {
                                    groupData.creator_id = groupData.group.creator_user_id;
                                  }
                                  setGroupDetails(groupData);
                                  
                                  // Reload groups list
                                  loadGroups();
                                } catch (error) {
                                  console.error('Add member error:', error);
                                  setNotification({
                                    type: 'error',
                                    message: error.response?.data?.message || 'Failed to add member'
                                  });
                                }
                              }
                            }}
                            className="btn btn-success btn-sm flex items-center gap-1"
                          >
                            <UserPlus className="w-4 h-4" />
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery.length > 0 && searchQuery.length < 2 && (
                  <p className="text-sm text-gray-500">Type at least 2 characters to search...</p>
                )}
                {searchQuery.length >= 2 && searchResults.length === 0 && (
                  <p className="text-sm text-gray-500">No available users found. All users may already be in groups.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditMembersModal(false);
                  setEditingGroup(null);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Reject Group
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              The team will be able to select a different use case after rejection.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Enter reason for rejection..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="flex-1 btn btn-danger"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidateGroups;