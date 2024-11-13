import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_EMAILS = ['karamtabet@gmail.com']; // Add admin emails here

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email || '');
  return isAdmin ? <>{children}</> : <Navigate to="/" />;
}