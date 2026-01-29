import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import HelpCenter from './components/common/HelpCenter';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import UseCaseSelection from './pages/student/UseCaseSelection';
import MyGroup from './pages/student/MyGroup';
import Invitations from './pages/student/Invitations';
import Worksheets from './pages/student/Worksheets';
import Feedback360 from './pages/student/Feedback360';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUseCases from './pages/admin/ManageUseCases';
import ManageContent from './pages/admin/ManageContent';
import ManageStudents from './pages/admin/ManageStudents';
import ValidateGroups from './pages/admin/ValidateGroups';
import ValidateWorksheets from './pages/admin/ValidateWorksheets';
import ManageCheckinPeriods from './pages/admin/ManageCheckinPeriods';
import ManageFeedback360 from './pages/admin/ManageFeedback360';
import ManageRegistrationPeriods from './pages/admin/ManageRegistrationPeriods';


// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/student" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* ==========================================
          Public Routes
          ========================================== */}
      <Route
        path="/login"
        element={isAuthenticated ? (
          <Navigate to={isAdmin ? '/admin' : '/student'} replace />
        ) : (
          <Login />
        )}
      />
      <Route
        path="/register"
        element={isAuthenticated ? (
          <Navigate to={isAdmin ? '/admin' : '/student'} replace />
        ) : (
          <Register />
        )}
      />

      {/* ==========================================
          Student Routes
          ========================================== */}
      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/use-cases"
        element={
          <ProtectedRoute>
            <UseCaseSelection />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/group"
        element={
          <ProtectedRoute>
            <MyGroup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/feedback360"
        element={
          <ProtectedRoute>
            <Feedback360 />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/invitations"
        element={
          <ProtectedRoute>
            <Invitations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/help"
        element={
          <ProtectedRoute>
            <HelpCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/worksheets"
        element={
          <ProtectedRoute>
            <Worksheets />
          </ProtectedRoute>
        }
      />

      {/* ==========================================
          Admin Routes
          ========================================== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/registration-periods"
        element={
          <ProtectedRoute adminOnly>
            <ManageRegistrationPeriods />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/feedback360"
        element={
          <ProtectedRoute adminOnly>
            <ManageFeedback360 />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/use-cases"
        element={
          <ProtectedRoute adminOnly>
            <ManageUseCases />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/content"
        element={
          <ProtectedRoute adminOnly>
            <ManageContent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/checkin-periods"
        element={
          <ProtectedRoute adminOnly>
            <ManageCheckinPeriods />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/help"
        element={
          <ProtectedRoute adminOnly>
            <HelpCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute adminOnly>
            <ManageStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/groups"
        element={
          <ProtectedRoute adminOnly>
            <ValidateGroups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/worksheets"
        element={
          <ProtectedRoute adminOnly>
            <ValidateWorksheets />
          </ProtectedRoute>
        }
      />

      {/* ==========================================
          Default Routes
          ========================================== */}
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? (isAdmin ? '/admin' : '/student') : '/login'} replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;