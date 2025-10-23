import { useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallbackPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { refreshSession } = useAuth();

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(search);
    const error = params.get('error');

    if (error) {
      // Redirect to login with error
      setLocation(`/login?error=${error}`);
      return;
    }

    // Google OAuth now sets cookies directly and redirects to /dashboard
    // This page is only used for error handling
    // If we reach here without error, refresh session and redirect to dashboard
    refreshSession().then(() => {
      setLocation('/dashboard');
    }).catch(() => {
      setLocation('/login?error=auth_failed');
    });
  }, [search, setLocation, refreshSession]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Autenticando...</p>
      </div>
    </div>
  );
}

