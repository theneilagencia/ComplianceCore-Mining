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
      // Check if we have a token in localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        // No token, user is not authenticated
        setUser(null);
        setPlan('START');
        setLoading(false);
        return;
      }

      // Try to get user info with the token
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
          setPlan(data.plan);
        } else {
          // Session invalid, try to refresh
          await refreshSession();
        }
      } else if (response.status === 401) {
        // Token expired, try to refresh
        await refreshSession();
      } else {
        // Other error, clear session
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setPlan('START');
      }
    } catch (error) {
      console.error('[Auth] Session check failed:', error);
      // On error, try to refresh
      await refreshSession();
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
      credentials: 'include', // Send cookies as fallback
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    
    // Save tokens to localStorage for cross-origin scenarios
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    
    // Set user data from response
    setUser(data.user);
    
    // Get user's plan
    await refreshSession();
  };

  const logout = async () => {
    try {
      // Send logout request
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      // Clear tokens from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Clear local state
      setUser(null);
      setPlan('START');
      
      // Redirect to login
      window.location.href = '/login';
    }
  };

  const refreshSession = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      // Try to refresh the access token
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Save new access token
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
        
        // Re-check session
        await checkSession();
      } else {
        // Refresh failed, clear session
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setPlan('START');
      }
    } catch (error) {
      console.error('[Auth] Refresh session failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
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

