import { useAuth } from '../contexts/AuthContext';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export function useApi() {
  const { logout } = useAuth();

  const apiFetch = async (url: string, options: FetchOptions = {}) => {
    const { requireAuth = true, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    // No need to add Authorization header - cookies are sent automatically

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include', // Important: send cookies
      });

      // Handle 401 Unauthorized - logout user
      if (response.status === 401) {
        logout();
        window.location.href = '/login';
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error: any) {
      // Network errors or other issues
      if (error.message === 'Failed to fetch') {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }
      throw error;
    }
  };

  return { apiFetch };
}

