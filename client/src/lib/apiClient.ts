/**
 * API Client with automatic token refresh
 * Intercepts 401 errors and automatically refreshes the access token
 */

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Send refresh token cookie
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      // New access token is now in cookie
      onTokenRefreshed(data.accessToken || 'refreshed');
      return true;
    }

    // Refresh token expired or invalid
    return false;
  } catch (error) {
    console.error('[API] Token refresh failed:', error);
    return false;
  }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Add credentials to send cookies
  const requestOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Make initial request
  let response = await fetch(url, requestOptions);

  // If 401 (Unauthorized), try to refresh token
  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshed = await refreshAccessToken();
      isRefreshing = false;

      if (refreshed) {
        // Retry original request with new token
        response = await fetch(url, requestOptions);
      } else {
        // Refresh failed - redirect to login
        console.log('[API] Session expired, redirecting to login');
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    } else {
      // Already refreshing, wait for it to complete
      await new Promise<void>((resolve) => {
        subscribeTokenRefresh(() => resolve());
      });

      // Retry original request
      response = await fetch(url, requestOptions);
    }
  }

  return response;
}

export async function apiGet<T = any>(url: string): Promise<T> {
  const response = await apiFetch(url, { method: 'GET' });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function apiPost<T = any>(url: string, data?: any): Promise<T> {
  const response = await apiFetch(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function apiPut<T = any>(url: string, data?: any): Promise<T> {
  const response = await apiFetch(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const response = await apiFetch(url, { method: 'DELETE' });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

