import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Use Case API
export const useCaseAPI = {
  getAllUseCases: (params) => api.get('/use-cases', { params }),
  getUseCaseDetail: (useCaseId) => api.get(`/use-cases/${useCaseId}`),
  createUseCase: (data) => api.post('/use-cases', data),
  updateUseCase: (useCaseId, data) => api.put(`/use-cases/${useCaseId}`, data),
  deleteUseCase: (useCaseId) => api.delete(`/use-cases/${useCaseId}`),
  
  // Rules
  getAllRules: (params) => api.get('/use-cases/admin/rules', { params }),
  createRule: (data) => api.post('/use-cases/admin/rules', data),
  updateRule: (ruleId, data) => api.put(`/use-cases/admin/rules/${ruleId}`, data),
  deleteRule: (ruleId) => api.delete(`/use-cases/admin/rules/${ruleId}`),
  
  // Assign rules to use case
  assignRules: (useCaseId, ruleIds) => api.post(`/use-cases/${useCaseId}/assign-rules`, { rule_ids: ruleIds }),
  getUseCaseRules: (useCaseId) => api.get(`/use-cases/${useCaseId}/rules`),
};

// Group API
export const groupAPI = {
  // NEW: Use Case flow
  selectUseCaseAndCreateGroup: (data) => api.post('/groups/select-usecase', data),
  changeUseCase: (groupId, useCaseId) => api.put(`/groups/${groupId}/change-usecase`, { use_case_id: useCaseId }),
  
  // Existing
  getMyGroup: () => api.get('/groups/my-group'),
  getGroupDetails: (groupId) => api.get(`/groups/${groupId}`),
  getValidation: (groupId) => api.get(`/groups/${groupId}/validation`),
  updateGroupName: (groupId, name) => api.put(`/groups/${groupId}/name`, { group_name: name }),
  lockTeam: (groupId) => api.post(`/groups/${groupId}/lock`),
};

// Admin Group API
export const adminGroupAPI = {
  getGroupsForValidation: (params) => api.get('/admin/groups/validation', { params }),
  validateGroup: (groupId, data) => api.put(`/admin/groups/${groupId}/validate`, data),
  batchValidateGroups: (data) => api.post('/admin/groups/batch-validate', data),
  removeMemberFromGroup: (groupId, userId) => api.delete(`/admin/groups/${groupId}/members/${userId}`),
  addMemberToGroup: (groupId, data) => api.post(`/admin/groups/${groupId}/members`, data),
  searchAvailableUsers: (search) => api.get('/admin/groups/search-users', { params: { search } }),
};

// Invitation API
export const invitationAPI = {
  sendInvitation: (data) => api.post('/invitations', data),
  getMyInvitations: () => api.get('/invitations/my-invitations'),
  respondToInvitation: (invitationId, action) => 
    api.post(`/invitations/${invitationId}/respond`, { action }),
  cancelInvitation: (invitationId) => api.delete(`/invitations/${invitationId}`),
};

// Rules API
export const rulesAPI = {
  getAllRules: (batchId) => api.get('/rules', { params: { batch_id: batchId } }),
  createRule: (data) => api.post('/rules', data),
  updateRule: (ruleId, data) => api.put(`/rules/${ruleId}`, data),
  deleteRule: (ruleId) => api.delete(`/rules/${ruleId}`),
};

// Content API
export const contentAPI = {
  getInformation: () => api.get('/content/information'),
  createInformation: (data) => api.post('/content/information', data),
  updateInformation: (id, data) => api.put(`/content/information/${id}`, data),
  deleteInformation: (id) => api.delete(`/content/information/${id}`),
  
  getTimeline: () => api.get('/content/timeline'),
  createTimeline: (data) => api.post('/content/timeline', data),
  updateTimeline: (id, data) => api.put(`/content/timeline/${id}`, data),
  deleteTimeline: (id) => api.delete(`/content/timeline/${id}`),
  
  getDocs: () => api.get('/content/docs'),
  createDoc: (data) => api.post('/content/docs', data),
  updateDoc: (id, data) => api.put(`/content/docs/${id}`, data),
  deleteDoc: (id) => api.delete(`/content/docs/${id}`),
};

// Worksheet API
export const worksheetAPI = {
  getCheckinPeriods: () => api.get('/worksheets/periods'),
  createCheckinPeriod: (data) => api.post('/worksheets/periods', data),
  updateCheckinPeriod: (periodId, data) => api.put(`/worksheets/periods/${periodId}`, data),
  deleteCheckinPeriod: (periodId) => api.delete(`/worksheets/periods/${periodId}`),
  submitWorksheet: (data) => api.post('/worksheets', data),
  updateWorksheet: (worksheetId, data) => api.put(`/worksheets/${worksheetId}`, data),
  getMyWorksheets: () => api.get('/worksheets/my-worksheets'),
  getAllWorksheets: (params) => api.get('/worksheets/all', { params }),
  validateWorksheet: (worksheetId, data) => 
    api.put(`/worksheets/${worksheetId}/validate`, data),
};

// User API
export const userAPI = {
  getAllUsers: (params) => api.get('/users', { params }),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
  getGroupsForValidation: (params) => api.get('/users/groups-validation', { params }),
  validateGroup: (groupId, data) => api.put(`/users/groups/${groupId}/validate`, data),
};

// Export Groups API
export const exportAPI = {
  exportGroups: (batchId) =>
    api.get('/users/export-groups', {
      params: { batch_id: batchId },
      responseType: 'blob', // penting untuk download file
    }),
};

export default api;