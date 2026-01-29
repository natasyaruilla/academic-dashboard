import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Users, FileText,
  LogOut, Menu, X, Bell, BookOpen, ChevronDown, ChevronRight,
  Calendar, FileCheck, Briefcase, UserCheck, MessageSquare, HelpCircle, FileBarChart,
  Building, GraduationCap, Mail
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [masterDataOpen, setMasterDataOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Keep Master Data dropdown open when a submenu item is active
  useEffect(() => {
    const masterDataSubmenu = [
      '/admin/use-cases',
      '/admin/content',
      '/admin/checkin-periods',
      '/admin/students'
    ];
    
    if (masterDataSubmenu.includes(location.pathname)) {
      setMasterDataOpen(true);
    }
  }, [location.pathname]);

  // ADMIN Menu Items dengan Sections
  const adminSections = [
    {
      title: 'ADMIN',
      items: [
        { icon: Home, label: 'Dashboard', path: '/admin' },
        {
          icon: FileBarChart,
          label: 'Master Data',
          isDropdown: true,
          submenu: [
            { icon: Briefcase, label: 'Manage Use Case', path: '/admin/use-cases' },
            { icon: BookOpen, label: 'Manage Konten', path: '/admin/content' },
            { icon: Calendar, label: 'Manage Worksheet', path: '/admin/checkin-periods' },
            { icon: UserCheck, label: 'Manage Student', path: '/admin/students' },
          ]
        },
        { icon: Users, label: 'Validasi Grup', path: '/admin/groups' },
        { icon: FileCheck, label: 'Validasi Worksheet', path: '/admin/worksheets' },
        { icon: Calendar, label: 'Periode Pendaftaran', path: '/admin/registration-periods' },
        { icon: MessageSquare, label: '360 Feedback', path: '/admin/feedback360' },
      ]
    },
    {
      title: 'UMUM',
      items: [
        { icon: HelpCircle, label: 'Pusat Bantuan', path: '/admin/help' },
      ]
    }
  ];

  // STUDENT Menu Items dengan Sections
  const studentSections = [
    {
      title: 'STUDENT',
      items: [
        { icon: Home, label: 'Dashboard', path: '/student' },
        { icon: Briefcase, label: 'Use Cases', path: '/student/use-cases' },
        { icon: Users, label: 'My Group', path: '/student/group' },
        { icon: Bell, label: 'Invitations', path: '/student/invitations' },
        { icon: FileText, label: 'Worksheets', path: '/student/worksheets' },
        { icon: MessageSquare, label: '360 Feedback', path: '/student/feedback360' },
      ]
    },
    {
      title: 'UMUM',
      items: [
        { icon: HelpCircle, label: 'Pusat Bantuan', path: '/student/help' },
      ]
    }
  ];

  const sections = isAdmin ? adminSections : studentSections;

  const handleLogout = () => {
    // Open confirmation modal instead of logging out immediately
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  const cancelLogout = () => setShowLogoutConfirm(false);

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const isPathActive = (path) => {
    return location.pathname === path;
  };

  const isSubmenuActive = (submenu) => {
    return submenu.some(item => location.pathname === item.path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 
          transition-all duration-300 z-40 w-64
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-blue-600">
              Acadion Team
            </h1>
          </div>

          {/* Scrollable Content: Profile Card + Navigation */}
          <div className="flex-1 overflow-y-auto">
            {/* Profile Card */}
            <div className="p-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                {/* Profile Photo */}
                <div className="flex justify-center mb-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                    {initials}
                  </div>
                </div>
                
                {/* Name */}
                <h3 className="text-center font-semibold mb-1" style={{ color: '#46525c' }}>
                  {user?.name}
                </h3>
                
                {/* Email/NIM */}
                <div className="flex items-center justify-center text-xs mb-3" style={{ color: '#46525c' }}>
                  <Mail className="w-3 h-3 mr-1" />
                  <span className="truncate">{user?.email}</span>
                </div>
                
                {/* Additional Info - Only show for students */}
                {!isAdmin && (
                  <div className="space-y-2 pt-3 border-t border-gray-200">
                    {/* University */}
                    {user?.university && (
                      <div className="flex items-start text-xs">
                        <Building className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-500">University</p>
                          <p className="font-medium" style={{ color: '#46525c' }}>{user.university}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Learning Path */}
                    {user?.learning_path && (
                      <div className="flex items-start text-xs">
                        <GraduationCap className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-500">Learning Path</p>
                          <p className="font-medium" style={{ color: '#46525c' }}>{user.learning_path}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation with Sections */}
            <nav className="p-4 space-y-6">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                {/* Section Title */}
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
                
                {/* Section Items */}
                <div className="space-y-1">
                  {section.items.map((item, itemIdx) => {
                    // Dropdown Item
                    if (item.isDropdown) {
                      const isActive = isSubmenuActive(item.submenu);
                      const Icon = item.icon;
                      
                      return (
                        <div key={itemIdx}>
                          <button
                            onClick={() => setMasterDataOpen(!masterDataOpen)}
                            className={`
                              w-full flex items-center justify-between px-3 py-3 rounded-lg
                              transition-all duration-200
                              ${isActive 
                                ? 'bg-blue-50 text-blue-700 font-medium' 
                                : 'text-gray-700 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon size={20} />
                              <span>{item.label}</span>
                            </div>
                            {masterDataOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          
                          {/* Submenu */}
                          {masterDataOpen && (
                            <div className="mt-1 ml-4 space-y-1 border-l-2 border-blue-300 pl-4">
                              {item.submenu.map((subItem, subIdx) => {
                                const isSubActive = isPathActive(subItem.path);
                                
                                return (
                                  <Link
                                    key={subIdx}
                                    to={subItem.path}
                                    className={`
                                      block px-3 py-2 rounded-lg
                                      transition-all duration-200 text-sm
                                      ${isSubActive 
                                        ? 'bg-blue-50 text-blue-700 font-medium' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                      }
                                    `}
                                  >
                                    <span>{subItem.label}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    // Regular Item
                    const isActive = isPathActive(item.path);
                    const Icon = item.icon;
                    
                    return (
                      <Link
                        key={itemIdx}
                        to={item.path}
                        onClick={() => setIsMobileOpen(false)}
                        className={`
                          flex items-center space-x-3 px-3 py-3 rounded-lg
                          transition-all duration-200
                          ${isActive 
                            ? 'bg-blue-50 text-blue-700 font-medium' 
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Icon size={20} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 space-y-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={cancelLogout}
          />

          <div className="bg-white rounded-lg shadow-lg z-50 w-11/12 max-w-md p-6">
            <h2 className="text-lg font-semibold mb-2">Konfirmasi Logout</h2>
            <p className="text-sm text-gray-600 mb-4">Anda yakin ingin logout?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;