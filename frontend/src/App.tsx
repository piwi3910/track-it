import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { KanbanPage } from '@/pages/KanbanPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { BacklogPage } from '@/pages/BacklogPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TemplatesPage } from '@/pages/TemplatesPage';
import { AdminPage } from '@/pages/AdminPage';
import LoginPage from '@/pages/LoginPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import AuthErrorHandler from '@/components/AuthErrorHandler';
import { useStore } from '@/hooks/useStore';

function App() {
  const { auth } = useStore();

  // While checking authentication status, show nothing
  if (auth.isLoading) {
    return null;
  }

  return (
    <>
      {/* Global auth error handler - works across all routes */}
      <AuthErrorHandler />
      
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={auth.isAuthenticated}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="backlog" element={<BacklogPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Catch all for unknown routes */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
