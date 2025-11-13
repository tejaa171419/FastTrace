// Base API configuration and utilities
// Empty string means use relative URLs (proxied by Vite dev server)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request configuration
export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

// Base API class
class ApiClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Set authentication token
  setToken(token: string) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      'Authorization': `Bearer ${token}`
    };
  }

  // Set user ID for development mode
  setUserId(userId: string) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      'x-user-id': userId
    };
  }

  // Clear authentication
  clearAuth() {
    const { 'Authorization': authRemoved, 'x-user-id': userIdRemoved, ...rest } = this.defaultHeaders as any;
    this.defaultHeaders = rest;
  }

  // Build URL with query parameters
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    // If baseURL is empty, use relative URLs (for Vite proxy)
    if (!this.baseURL) {
      const url = new URL(endpoint, window.location.origin);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }
      
      return url.toString();
    }
    
    // Otherwise use absolute URL with baseURL
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  // Main request method
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { params, ...requestConfig } = config;
    const url = this.buildURL(endpoint, params);

    const finalHeaders = {
      ...this.defaultHeaders,
      ...requestConfig.headers,
    };

    // Debug logging for auth-related requests
    if (endpoint.includes('/auth/')) {
      console.log('🌐 API Request:', {
        method: requestConfig.method || 'GET',
        url,
        headers: finalHeaders,
        body: requestConfig.body ? JSON.parse(requestConfig.body as string) : undefined
      });
    }

    let response = await fetch(url, {
      ...requestConfig,
      headers: finalHeaders,
    });

    // If we get a 401 and have a refresh token, try to refresh the access token
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      console.log('🔐 401 Unauthorized detected for:', endpoint);
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        console.log('🔄 Attempting to refresh token...');
        
        try {
          // Attempt to refresh the token
          const refreshResponse = await fetch(`${this.baseURL}/api/auth/refresh-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const newAccessToken = refreshData.data?.accessToken;

            if (newAccessToken) {
              // Update stored token and API client
              localStorage.setItem('authToken', newAccessToken);
              this.setToken(newAccessToken);
              
              console.log('✅ Token refreshed successfully');
              
              // Retry the original request with the new token
              const retryHeaders = {
                ...finalHeaders,
                'Authorization': `Bearer ${newAccessToken}`
              };
              
              response = await fetch(url, {
                ...requestConfig,
                headers: retryHeaders,
              });
            }
          } else {
            // Refresh failed, clear tokens and redirect to login
            console.log('❌ Token refresh failed - response not ok');
            this.handleAuthFailure();
          }
        } catch (refreshError) {
          console.error('Token refresh error:', refreshError);
          this.handleAuthFailure();
        }
      } else {
        // No refresh token available
        console.log('❌ No refresh token available for auth retry');
        this.handleAuthFailure();
      }
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // Handle non-JSON responses
      throw new ApiError(
        'Invalid server response',
        response.status,
        { originalError: parseError }
      );
    }

    if (!response.ok) {
      // Rate limiting - don't treat as auth failure
      if (response.status === 429) {
        console.warn('🚷 Rate limit hit for:', endpoint);
        const errorMessage = data.message || data.error || 'Too many requests';
        throw new ApiError(errorMessage, response.status, data);
      }
      
      // If still 401 after refresh attempt, handle auth failure
      if (response.status === 401) {
        console.warn('🚨 Still 401 after refresh attempt for:', endpoint);
        this.handleAuthFailure();
      }
      
      // Extract error message from different response formats
      const errorMessage = data.message || data.error || data.details || `HTTP ${response.status}`;
      const errorDetails = data.details || data.data || null;
      
      throw new ApiError(
        errorMessage,
        response.status,
        { ...data, details: errorDetails }
      );
    }

    return data;
  }

  // Handle authentication failure
  private handleAuthFailure() {
    console.warn('🚨 Authentication failure detected - clearing auth state');
    console.trace('Auth failure call stack:');
    
    this.clearAuth();
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUserId');
    
    // Dispatch a custom event for auth state change
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { authenticated: false } }));
    
    // Only redirect if not in an authentication-related page
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/login') && !currentPath.includes('/signup') && !currentPath.includes('/')) {
      console.log('🔄 Redirecting to login due to auth failure');
      window.location.href = '/login';
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T = any>(endpoint: string, body?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      params,
    });
  }

  async put<T = any>(endpoint: string, body?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      params,
    });
  }

  async delete<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', params });
  }

  async patch<T = any>(endpoint: string, body?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      params,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Auto-retry wrapper for failed requests
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}