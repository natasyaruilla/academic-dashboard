import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Lock, Unlock, Info } from 'lucide-react';
import { settingsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const SystemSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [notification, setNotification] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getSettings(user.batch_id);
      setSettings(response.data.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRegistration = async () => {
    setSaving(true);
    try {
      const newValue = !settings.group_registration_open;
      
      await settingsAPI.toggleGroupRegistration({
        batch_id: user.batch_id,
        is_open: newValue
      });

      setSettings({
        ...settings,
        group_registration_open: newValue
      });

      setNotification({
        type: 'success',
        message: `Group registration ${newValue ? 'opened' : 'closed'} successfully`
      });
    } catch (error) {
      console.error('Toggle error:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update setting'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading settings..." />
        </div>
      </div>
    );
  }

  const isRegistrationOpen = settings.group_registration_open === true || 
                              settings.group_registration_open === 'true';

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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                System Settings
              </h1>
              <p className="text-gray-600 mt-2">
                Configure system settings for batch {user.batch_id}
              </p>
            </div>

            {/* Group Registration Setting */}
            <div className="card">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  isRegistrationOpen ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {isRegistrationOpen ? (
                    <Unlock className="w-6 h-6 text-green-600" />
                  ) : (
                    <Lock className="w-6 h-6 text-red-600" />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Registration Group
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Kontrol Student apakah bisa membuat dan bergabung ke grup capstone.
                    setelah ditutup, student tidak dapat membuat grup baru atau mengirim/menerima undangan.
                  </p>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      isRegistrationOpen 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {isRegistrationOpen ? '🟢 Registration Open' : '🔴 Registration Closed'}
                    </span>
                  </div>

                  {/* Info Box */}
                  <div className={`p-4 rounded-lg border-l-4 mb-4 ${
                    isRegistrationOpen 
                      ? 'bg-green-50 border-green-500' 
                      : 'bg-yellow-50 border-yellow-500'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        {isRegistrationOpen ? (
                          <>
                            <p className="font-medium text-gray-900 mb-1">Registration is currently open</p>
                            <p className="text-gray-700">
                              Students can create groups, invite members, accept invitations, and lock teams.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-gray-900 mb-1">Pendaftaran saat ini ditutup</p>
                            <p className="text-gray-700">
                              Siswa tidak dapat membuat grup baru atau membuat perubahan pada grup yang ada.
                              Grup yang ada tetap terlihat tetapi terkunci.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={handleToggleRegistration}
                    disabled={saving}
                    className={`btn flex items-center space-x-2 ${
                      isRegistrationOpen ? 'btn-danger' : 'btn-success'
                    }`}
                  >
                    {isRegistrationOpen ? (
                      <>
                        <Lock className="w-5 h-5" />
                        <span>{saving ? 'Closing...' : 'Close Registration'}</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-5 h-5" />
                        <span>{saving ? 'Opening...' : 'Open Registration'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Future Settings Placeholder */}
            <div className="card mt-6 bg-gray-50 border-dashed">
              <div className="text-center py-8">
                <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Update Coming Soon
                </h3>
                <p className="text-gray-600">
                  Pengaturan sistem tambahan akan tersedia di sini pada pembaruan mendatang.
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default SystemSettings;