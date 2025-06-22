import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import PreInterns from './pages/admin/PreInterns';
import Interviews from './pages/admin/Interviews';
import Interns from './pages/admin/Interns';
import Supervisors from './pages/admin/Supervisors';
import SupervisorAssignment from './pages/admin/SupervisorAssignment';
import Groups from './pages/admin/Groups';
import AllGroups from './pages/admin/AllGroups';
import Assignments from './pages/admin/Assignments';
import Documents from './pages/admin/Documents';
import Reports from './pages/admin/Reports';
import Leaderboard from './pages/admin/Leaderboard';
import PreInternDashboard from './pages/pre-intern/Dashboard';
import InternDashboard from './pages/intern/Dashboard';
import InternAssignments from './pages/intern/Assignments';
import InternProjects from './pages/intern/Projects';
import InternReports from './pages/intern/Reports';
import InternDocuments from './pages/intern/Documents';
import InternMeetings from './pages/intern/Meetings';
import InternGroup from './pages/intern/Group';
import GroupChatPage from './pages/intern/GroupChat';
import InternProgress from './pages/intern/Progress';
import InternFeedback from './pages/intern/Feedback';
import InternProfile from './pages/intern/Profile';
import InternLeaderboard from './pages/intern/Leaderboard';
import SupervisorDashboard from './pages/supervisor/Dashboard';
import SupervisorInterns from './pages/supervisor/Interns';
import GroupManagement from './pages/supervisor/GroupManagement';
import ProjectAssignment from './pages/supervisor/ProjectAssignment';
import InternGrading from './pages/supervisor/InternGrading';
import SupervisorAssignments from './pages/supervisor/Assignments';
import DocumentReview from './pages/supervisor/DocumentReview';
import DocumentUpload from './pages/supervisor/DocumentUpload';
import SupervisorMeetings from './pages/supervisor/Meetings';
import SupervisorReports from './pages/supervisor/Reports';
import SupervisorProfile from './pages/supervisor/Profile';
import LoadingSpinner from './components/UI/LoadingSpinner';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-teal-500 to-green-500">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing Page */}
      <Route 
        path="/" 
        element={
          currentUser ? (
            <Navigate 
              to={
                currentUser.role === 'admin' ? '/admin' :
                currentUser.role === 'pre-interview' ? '/pre-intern' :
                currentUser.role === 'intern' ? '/intern' :
                currentUser.role === 'supervisor' ? '/supervisor' :
                '/'
              } 
              replace 
            />
          ) : (
            <Landing />
          )
        } 
      />

      {/* Login Route */}
      <Route 
        path="/login" 
        element={
          currentUser ? (
            <Navigate 
              to={
                currentUser.role === 'admin' ? '/admin' :
                currentUser.role === 'pre-interview' ? '/pre-intern' :
                currentUser.role === 'intern' ? '/intern' :
                currentUser.role === 'supervisor' ? '/supervisor' :
                '/login'
              } 
              replace 
            />
          ) : (
            <Login />
          )
        } 
      />

      {/* Protected Routes */}
      {currentUser ? (
        <Route path="/*" element={
          <Layout>
            <Routes>
              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/pre-interns"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PreInterns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/interviews"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Interviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/interns"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Interns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/supervisors"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Supervisors />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/supervisor-assignment"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SupervisorAssignment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/groups"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Groups />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/all-groups"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AllGroups />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/assignments"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Assignments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/documents"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Documents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/leaderboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Leaderboard />
                  </ProtectedRoute>
                }
              />

              {/* Pre-Intern Routes */}
              <Route
                path="/pre-intern"
                element={
                  <ProtectedRoute allowedRoles={['pre-interview']}>
                    <PreInternDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Intern Routes */}
              <Route
                path="/intern"
                element={
                  <ProtectedRoute allowedRoles={['intern']}>
                    <InternDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/intern/assignments"
                element={
                  <ProtectedRoute allowedRoles={['intern']}>
                    <InternAssignments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/intern/projects"
                element={
                  <ProtectedRoute allowedRoles={['intern']}>
                    <InternProjects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/intern/reports"
                element={
                  <ProtectedRoute allowedRoles={['intern']}>
                    <InternReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/intern/documents"
                element={
                  <ProtectedRoute allowedRoles={['intern']}>
                    <InternDocuments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/intern/meetings"
                element={
                  <ProtectedRoute allowedRoles={['intern']}>
                    <InternMeetings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/intern/group"
                element={
                  <ProtectedRoute allowedRoles={['intern']}>
                    <InternGroup />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/intern/group-chat"
                element={
                  <ProtectedRoute allowedRoles={['intern']}>
                    <GroupChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/intern/progress"
                element={
                  <ProtectedRoute allowedRoles={['intern']}>
                    <InternProgress />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/intern/feedback"
                element={
                  <ProtectedRoute allowedRoles={['intern']}>
                    <InternFeedback />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/intern/profile"
                element={
                  <ProtectedRoute allowedRoles={['intern']}>
                    <InternProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/intern/leaderboard"
                element={
                  <ProtectedRoute allowedRoles={['intern']}>
                    <InternLeaderboard />
                  </ProtectedRoute>
                }
              />

              {/* Supervisor Routes */}
              <Route
                path="/supervisor"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <SupervisorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supervisor/interns"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <SupervisorInterns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supervisor/group-management"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <GroupManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supervisor/project-assignment"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <ProjectAssignment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supervisor/intern-grading"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <InternGrading />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supervisor/assignments"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <SupervisorAssignments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supervisor/document-review"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <DocumentReview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supervisor/document-upload"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <DocumentUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supervisor/meetings"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <SupervisorMeetings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supervisor/reports"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <SupervisorReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supervisor/profile"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <SupervisorProfile />
                  </ProtectedRoute>
                }
              />

              {/* Unauthorized */}
              <Route
                path="/unauthorized"
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized</h1>
                      <p className="text-gray-600">You don't have permission to access this page.</p>
                    </div>
                  </div>
                }
              />
            </Routes>
          </Layout>
        } />
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;