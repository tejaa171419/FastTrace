import { apiClient } from './api';
import type { User, CreateUserRequest } from '@/lib/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
    refreshExpiresIn: string;
    sessionId: string;
  };
  error?: string;
}

export interface SignupRequest extends CreateUserRequest {
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export const authService = {
  // Login user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('🔐 Attempting login with:', { email: credentials.email });
    
    // Temporarily clear x-user-id header for login to avoid conflicts
    const originalHeaders = { ...apiClient['defaultHeaders'] };
    const { 'x-user-id': removedUserId, ...headersWithoutUserId } = originalHeaders as any;
    apiClient['defaultHeaders'] = headersWithoutUserId;
    
    try {
      const result = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
      console.log('🔐 Login successful:', result);
      return result;
    } catch (error) {
      console.error('🔐 Login failed:', error);
      throw error;
    } finally {
      // Restore original headers
      apiClient['defaultHeaders'] = originalHeaders;
    }
  },

  // Signup new user
  async signup(userData: SignupRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/api/auth/signup', userData);
  },

  // Logout user
  async logout(): Promise<void> {
    return apiClient.post<void>('/api/auth/logout');
  },

  // Get current user profile
  async getMe(): Promise<{ data: { user: User } }> {
    return apiClient.get<{ data: { user: User } }>('/api/auth/me');
  },

  // Verify email address
  async verifyEmail(data: VerifyEmailRequest): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/api/auth/verify-email', data);
  },

  // Request password reset
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/api/auth/forgot-password', data);
  },

  // Reset password with token
  async resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/api/auth/reset-password', data);
  },

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{ success: boolean; data?: { accessToken: string; expiresIn: string } }> {
    return apiClient.post<{ success: boolean; data?: { accessToken: string; expiresIn: string } }>('/api/auth/refresh-token', { refreshToken });
  }
};