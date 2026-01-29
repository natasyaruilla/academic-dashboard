import { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit2, Trash2, Eye, Settings } from 'lucide-react';
import { useCaseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const ManageUseCases = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('usecases'); // 'usecases' or 'rules'
  const [useCases, setUseCases] = useState([]);
  const [rules, setRules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'usecase', 'rule', 'assign'
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [notification, setNotification] = useState(null);
  const [selectedUseCaseForRules, setSelectedUseCaseForRules] = useState(null);
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Load specific data when tab changes
    if (activeTab === 'rules' && rules.length === 0) {
      loadRules();
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      // Always load use cases first
      const useCasesResponse = await useCaseAPI.getAllUseCases({ batch_id: user.batch_id });
      setUseCases(useCasesResponse.data.data);
      
      // Also load rules count
      const rulesResponse = await useCaseAPI.getAllRules({ batch_id: user.batch_id });
      setRules(rulesResponse.data.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      const response = await useCaseAPI.getAllRules({ batch_id: user.batch_id });
      setRules(response.data.data);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({});
    setSelectedRuleIds([]);
  };

  // ==========================================
  // USE CASE CRUD
  // ==========================================
  const handleCreateUseCase = () => {
    resetForm();
    setFormData({
      name: '',
      company: '',
      description: '',
      is_active: true,
      display_order: 0
    });
    setModalType('usecase');
    setShowModal(true);
  };

  const handleEditUseCase = (useCase) => {
    setEditingItem(useCase);
    setFormData({
      name: useCase.name,
      company: useCase.company,
      description: useCase.description,
      is_active: useCase.is_active,
      display_order: useCase.display_order
    });
    setModalType('usecase');
    setShowModal(true);
  };

  const handleSubmitUseCase = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await useCaseAPI.updateUseCase(editingItem.id, formData);
        setNotification({ type: 'success', message: 'Use case updated successfully!' });
      } else {
        await useCaseAPI.createUseCase({ ...formData, batch_id: user.batch_id });
        setNotification({ type: 'success', message: 'Use case created successfully!' });
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      setNotification({ type: 'error', message: error.response?.data?.message || 'Operation failed' });
    }
  };

  const handleDeleteUseCase = async (useCaseId) => {
    if (!window.confirm('Delete this use case? Teams using this use case will not be affected.')) return;
    
    try {
      await useCaseAPI.deleteUseCase(useCaseId);
      setNotification({ type: 'success', message: 'Use case deleted successfully!' });
      loadData();
    } catch (error) {
      setNotification({ type: 'error', message: error.response?.data?.message || 'Failed to delete' });
    }
  };

  // ==========================================
  // RULES CRUD
  // ==========================================
  const handleCreateRule = () => {
    resetForm();
    setFormData({
      rule_type: 'GROUP_SIZE',
      rule_value: '',
      description: ''
    });
    setModalType('rule');
    setShowModal(true);
  };

  const handleEditRule = (rule) => {
    setEditingItem(rule);
    setFormData({
      rule_type: rule.rule_type,
      rule_value: rule.rule_value,
      description: rule.description
    });
    setModalType('rule');
    setShowModal(true);
  };

  const handleSubmitRule = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await useCaseAPI.updateRule(editingItem.id, formData);
        setNotification({ type: 'success', message: 'Rule updated successfully!' });
      } else {
        await useCaseAPI.createRule({ ...formData, batch_id: user.batch_id });
        setNotification({ type: 'success', message: 'Rule created successfully!' });
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      setNotification({ type: 'error', message: error.response?.data?.message || 'Operation failed' });
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Delete this rule?')) return;
    
    try {
      await useCaseAPI.deleteRule(ruleId);
      setNotification({ type: 'success', message: 'Rule deleted successfully!' });
      loadData();
    } catch (error) {
      setNotification({ type: 'error', message: error.response?.data?.message || 'Failed to delete' });
    }
  };

  // ==========================================
  // ASSIGN RULES TO USE CASE
  // ==========================================
  const handleAssignRules = async (useCase) => {
    try {
      // Load current rules for this use case
      const response = await useCaseAPI.getUseCaseRules(useCase.id);
      const currentRules = response.data.data.map(r => r.id);
      
      // Load all available rules
      const allRulesResponse = await useCaseAPI.getAllRules({ batch_id: user.batch_id });
      setRules(allRulesResponse.data.data);
      
      setSelectedUseCaseForRules(useCase);
      setSelectedRuleIds(currentRules);
      setModalType('assign');
      setShowModal(true);
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to load rules' });
    }
  };

  const handleSubmitAssignRules = async (e) => {
    e.preventDefault();
    try {
      await useCaseAPI.assignRules(selectedUseCaseForRules.id, selectedRuleIds);
      setNotification({ type: 'success', message: 'Rules assigned successfully!' });
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      setNotification({ type: 'error', message: error.response?.data?.message || 'Operation failed' });
    }
  };

  const toggleRuleSelection = (ruleId) => {
    setSelectedRuleIds(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Use Case Management</h1>
              <p className="text-gray-600 mt-2">Manage capstone use cases and validation rules</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('usecases')}
                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === 'usecases'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-5 h-5" />
                  <span>Use Cases</span>
                  <span className="badge bg-gray-200 text-gray-700">{useCases.length}</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === 'rules'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Rules</span>
                  <span className="badge bg-gray-200 text-gray-700">{rules.length}</span>
                </div>
              </button>
            </div>

            {/* Add Button */}
            <div className="mb-6">
              <button
                onClick={activeTab === 'usecases' ? handleCreateUseCase : handleCreateRule}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add {activeTab === 'usecases' ? 'Use Case' : 'Rule'}</span>
              </button>
            </div>

            {/* Content */}
            {activeTab === 'usecases' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {useCases.map((useCase) => (
                  <div key={useCase.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {useCase.name}
                          </h3>
                          {useCase.is_active ? (
                            <span className="badge bg-green-100 text-green-800">Active</span>
                          ) : (
                            <span className="badge bg-gray-100 text-gray-800">Inactive</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{useCase.company}</p>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {useCase.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>{useCase.team_count} teams</span>
                      <span>{useCase.rules_count} rules</span>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAssignRules(useCase)}
                        className="flex-1 btn btn-secondary flex items-center justify-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Rules</span>
                      </button>
                      <button
                        onClick={() => handleEditUseCase(useCase)}
                        className="flex-1 btn btn-secondary flex items-center justify-center space-x-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUseCase(useCase.id)}
                        className="btn btn-danger px-3"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="badge bg-blue-100 text-blue-800">
                            {rule.rule_type.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono text-sm text-gray-700">
                            {rule.rule_value}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {rule.description}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="btn btn-secondary px-3"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="btn btn-danger px-3"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Modals */}
      {showModal && modalType === 'usecase' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingItem ? 'Edit Use Case' : 'Create Use Case'}
            </h2>
            
            <form onSubmit={handleSubmitUseCase} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company/Client
                </label>
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="6"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order || 0}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    className="input"
                  />
                </div>
                <div className="flex items-center pt-8">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active (visible to students)
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && modalType === 'rule' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingItem ? 'Edit Rule' : 'Create Rule'}
            </h2>
            
            <form onSubmit={handleSubmitRule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Type *
                </label>
                <select
                  value={formData.rule_type || 'GROUP_SIZE'}
                  onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
                  className="input"
                  required
                >
                  <option value="GROUP_SIZE">Group Size</option>
                  <option value="MAX_SAME_UNIVERSITY">Max Same University</option>
                  <option value="REQUIRED_LEARNING_PATHS">Required Learning Paths</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Value *
                </label>
                {formData.rule_type === 'REQUIRED_LEARNING_PATHS' ? (
                  <input
                    type="text"
                    value={formData.rule_value || ''}
                    onChange={(e) => setFormData({ ...formData, rule_value: e.target.value })}
                    className="input"
                    placeholder="Machine Learning, Cloud Computing, Mobile Development"
                    required
                  />
                ) : (
                  <input
                    type="number"
                    value={formData.rule_value || ''}
                    onChange={(e) => setFormData({ ...formData, rule_value: e.target.value })}
                    className="input"
                    min="1"
                    required
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formData.rule_type === 'GROUP_SIZE' && 'Number of team members required'}
                  {formData.rule_type === 'MAX_SAME_UNIVERSITY' && 'Maximum members from same university'}
                  {formData.rule_type === 'REQUIRED_LEARNING_PATHS' && 'Comma-separated learning paths (e.g., "ML, Cloud, Mobile")'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (shown to students)
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && modalType === 'assign' && selectedUseCaseForRules && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Assign Rules to Use Case
            </h2>
            <p className="text-gray-600 mb-6">
              {selectedUseCaseForRules.name}
            </p>
            
            <form onSubmit={handleSubmitAssignRules}>
              <div className="space-y-3 mb-6">
                {rules.map((rule) => (
                  <label
                    key={rule.id}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedRuleIds.includes(rule.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRuleIds.includes(rule.id)}
                      onChange={() => toggleRuleSelection(rule.id)}
                      className="w-5 h-5 text-blue-600 rounded mt-0.5"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="badge bg-blue-100 text-blue-800 text-xs">
                          {rule.rule_type.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono text-sm text-gray-700">
                          {rule.rule_value}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {rule.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  Save Rules ({selectedRuleIds.length} selected)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUseCases;