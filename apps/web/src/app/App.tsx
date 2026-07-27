import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';
import { AdminAccessPage } from '../pages/AdminAccessPage';
import { AdminAuditPage } from '../pages/AdminAuditPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { ProjectFormPage } from '../pages/ProjectFormPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { ProtectedRoute } from './ProtectedRoute';

export function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/new" element={<ProjectFormPage />} />
      <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
      <Route path="/projects/:projectId/edit" element={<ProjectFormPage />} />
      <Route path="/projects/:projectId/scopes" element={<ProjectDetailPage />} />
      <Route path="/projects/:projectId/expenses" element={<ProjectDetailPage />} />
      <Route path="/projects/:projectId/reports" element={<ProjectDetailPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/admin/projects" element={<ProtectedRoute admin><ProjectsPage all /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute admin><AdminUsersPage /></ProtectedRoute>} />
      <Route path="/admin/users/new" element={<Navigate to="/admin/users" replace />} />
      <Route path="/admin/users/:userId" element={<ProtectedRoute admin><AdminUsersPage /></ProtectedRoute>} />
      <Route path="/admin/project-access" element={<ProtectedRoute admin><AdminAccessPage /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute admin><AdminAuditPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>;
}
