// ==========================================
// src/pages/admin/ManageContent.jsx
// ==========================================
import { useState, useEffect } from 'react';
import { Info, Calendar, FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import { contentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const ManageContent = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('information');
  const [information, setInformation] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [docs, setDocs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadAllContent();
  }, []);

  const loadAllContent = async () => {
    try {
      const [infoRes, timelineRes, docsRes] = await Promise.all([
        contentAPI.getInformation(),
        contentAPI.getTimeline(),
        contentAPI.getDocs(),
      ]);
      setInformation(infoRes.data.data);
      setTimeline(timelineRes.data.data);
      setDocs(docsRes.data.data);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, batch_id: user.batch_id };
      
      if (activeTab === 'information') {
        if (editingItem) {
          await contentAPI.updateInformation(editingItem.id, data);
        } else {
          await contentAPI.createInformation(data);
        }
      } else if (activeTab === 'timeline') {
        if (editingItem) {
          await contentAPI.updateTimeline(editingItem.id, data);
        } else {
          await contentAPI.createTimeline(data);
        }
      } else if (activeTab === 'docs') {
        if (editingItem) {
          await contentAPI.updateDoc(editingItem.id, data);
        } else {
          await contentAPI.createDoc(data);
        }
      }

      setNotification({ 
        type: 'success', 
        message: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} ${editingItem ? 'updated' : 'created'} successfully!` 
      });
      setShowModal(false);
      resetForm();
      loadAllContent();
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.message || 'Operation failed' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      if (activeTab === 'information') {
        await contentAPI.deleteInformation(id);
      } else if (activeTab === 'timeline') {
        await contentAPI.deleteTimeline(id);
      } else if (activeTab === 'docs') {
        await contentAPI.deleteDoc(id);
      }

      setNotification({ type: 'success', message: 'Item deleted successfully!' });
      loadAllContent();
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to delete item' });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    
    // FIX: Format manual YYYY-MM-DD menggunakan Local Time
    const formatDateInput = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const pad = (n) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };

    if (activeTab === 'information') {
      setFormData({
        title: item.title,
        content: item.content,
      });
    } else if (activeTab === 'timeline') {
      setFormData({
        title: item.title,
        start_at: formatDateInput(item.start_at),
        end_at: formatDateInput(item.end_at),
        description: item.description,
        order_idx: item.order_idx,
      });
    } else if (activeTab === 'docs') {
      setFormData({
        title: item.title,
        url: item.url,
        order_idx: item.order_idx,
      });
    }
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    if (activeTab === 'information') {
      setFormData({ title: '', content: '' });
    } else if (activeTab === 'timeline') {
      setFormData({ title: '', start_at: '', end_at: '', description: '', order_idx: 0 });
    } else if (activeTab === 'docs') {
      setFormData({ title: '', url: '', order_idx: 0 });
    }
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading content..." />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'information', label: 'Announcements', icon: Info, data: information },
    { id: 'timeline', label: 'Timeline', icon: Calendar, data: timeline },
    { id: 'docs', label: 'Documents', icon: FileText, data: docs },
  ];

  const currentData = activeTab === 'information' ? information : activeTab === 'timeline' ? timeline : docs;

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
                <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
                <p className="text-gray-600 mt-2">Manage announcements, timeline, and documents</p>
              </div>
              <button
                onClick={openCreateModal}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add {activeTab === 'information' ? 'Announcement' : activeTab === 'timeline' ? 'Event' : 'Document'}</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 border-b border-gray-200">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    <span className="badge bg-gray-200 text-gray-700">{tab.data.length}</span>
                  </button>
                );
              })}
            </div>

            {/* Content List */}
            {currentData.length === 0 ? (
              <div className="card text-center py-16">
                <p className="text-gray-600">No items yet. Click "Add" to create one.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentData.map((item) => (
                  <div key={item.id} className="card">
                    {activeTab === 'information' && (
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.title}
                          </h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{item.content}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {activeTab === 'timeline' && (
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-600">
                              <span>Start: {new Date(item.start_at).toLocaleDateString()}</span>
                              <span>End: {new Date(item.end_at).toLocaleDateString()}</span>
                              <span>Order: {item.order_idx}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'docs' && (
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {item.title}
                            </h3>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-600 hover:text-primary-700 underline mb-2 block"
                            >
                              {item.url}
                            </a>
                            <p className="text-xs text-gray-500">Order: {item.order_idx}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingItem ? 'Edit' : 'Add'} {activeTab === 'information' ? 'Announcement' : activeTab === 'timeline' ? 'Timeline Event' : 'Document'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  required
                />
              </div>

              {/* Information Fields */}
              {activeTab === 'information' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={formData.content || ''}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="6"
                    required
                  />
                </div>
              )}

              {/* Timeline Fields */}
              {activeTab === 'timeline' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={formData.start_at || ''}
                        onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={formData.end_at || ''}
                        onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
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
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows="4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Index
                    </label>
                    <input
                      type="number"
                      value={formData.order_idx || 0}
                      onChange={(e) => setFormData({ ...formData, order_idx: parseInt(e.target.value) })}
                      className="input"
                    />
                  </div>
                </>
              )}

              {/* Docs Fields */}
              {activeTab === 'docs' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL *
                    </label>
                    <input
                      type="url"
                      value={formData.url || ''}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="input"
                      placeholder="https://example.com/document.pdf"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Index
                    </label>
                    <input
                      type="number"
                      value={formData.order_idx || 0}
                      onChange={(e) => setFormData({ ...formData, order_idx: parseInt(e.target.value) })}
                      className="input"
                    />
                  </div>
                </>
              )}

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
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageContent;