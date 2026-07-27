import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import type { RootState } from './store';

export function ProtectedRoute({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const auth = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  if (!auth.accessToken || !auth.user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (admin && auth.user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}
