import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Get API base URL from environment variable or use relative path for development
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  plan: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<string>('START');
  const [loading, setLoading] = useState(true);

  // Check session on mount and after page refresh
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // No need to check localStorage - cookies are sent automatically
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        credentials: 'include', // CRITICAL: Send cookies with request
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
          setPlan(data.plan);
        } else {
          // Session invalid
          setUser(null);
          setPlan('START');
        }
      } else {
        // Session expired or invalid
        setUser(null);
        setPlan('START');
      }
    } catch (error) {
      console.error('[Auth] Session check failed:', error);
      setUser(null);
      setPlan('START');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // CRITICAL: Send cookies with request
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    
    // Tokens are now in HttpOnly cookies - no localStorage needed
    // Just set user data from response
    setUser(data.user);
    
    // Get user's plan
    await refreshSession();
  };

  const logout = async () => {
    try {
      // Cookies are sent automatically
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // CRITICAL: Send cookies with request
      });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      // Clear local state
      setUser(null);
      setPlan('START');
      
      // Redirect to login
      window.location.href = '/login';
    }
  };

  const refreshSession = async () => {
    try {
      // Try to refresh the access token using refresh token cookie
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Send refresh token cookie
      });

      if (response.ok) {
        // New access token is now in cookie, re-check session
        await checkSession();
      } else {
        // Refresh failed, clear session
        setUser(null);
        setPlan('START');
      }
    } catch (error) {
      console.error('[Auth] Refresh session failed:', error);
      setUser(null);
      setPlan('START');
    }
  };

  return (
    <AuthContext.Provider value={{ user, plan, loading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

