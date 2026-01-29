import { useState, useEffect } from 'react';
import { Mail, Check, X, Clock } from 'lucide-react';
import { invitationAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/common/Sidebar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const Invitations = () => {
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState([]);
  const [notification, setNotification] = useState(null);
  // removed registrationOpen state — settingsAPI was unused / not imported
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const invitationsRes = await invitationAPI.getMyInvitations();
      setInvitations(invitationsRes.data.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId, action) => {
    // removed registrationOpen check — invitations can be responded to directly
    
    try {
      await invitationAPI.respondToInvitation(invitationId, action);
      setNotification({
        type: 'success',
        message: `Invitation ${action === 'accept' ? 'accepted' : 'rejected'} successfully!`,
      });
      loadData();
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || `Failed to ${action} invitation`,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading invitations..." />
        </div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(i => i.state === 'pending');
  const historyInvitations = invitations.filter(i => i.state !== 'pending');

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
          <div className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Undangan Grup
            </h1>

            {/* Pending Invitations */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Undangan Tertunda ({pendingInvitations.length})
              </h2>
              
              {pendingInvitations.length === 0 ? (
                <div className="card text-center py-12">
                  <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Tidak ada undangan tertunda</p>
                </div>
              ) : (
                <>
                  {/* registration check removed — warnings not needed here */}
                  <div className="space-y-4">
                    {pendingInvitations.map((invitation) => (
                      <div key={invitation.id} className="card border-l-4 border-l-primary-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {invitation.group_name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Invited by: <span className="font-medium">{invitation.inviter_name}</span>
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              Current members: {invitation.member_count}
                            </p>
                            <p className="text-xs text-gray-500">
                              Received: {new Date(invitation.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleRespond(invitation.id, 'accept')}
                              className="btn btn-success flex items-center space-x-2"
                            >
                              <Check className="w-5 h-5" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => handleRespond(invitation.id, 'reject')}
                              className="btn btn-danger flex items-center space-x-2"
                            >
                              <X className="w-5 h-5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* History */}
            {historyInvitations.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  History
                </h2>
                <div className="space-y-3">
                  {historyInvitations.map((invitation) => (
                    <div key={invitation.id} className="card bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {invitation.group_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            From: {invitation.inviter_name}
                          </p>
                        </div>
                        <span className={`badge badge-${invitation.state}`}>
                          {invitation.state}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Invitations;