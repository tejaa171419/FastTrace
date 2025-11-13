import { apiClient } from '../api';
import type { User, CreateUserRequest } from '../types';

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  occupation?: string;
  bio?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  preferences?: {
    currency?: string;
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    privacy?: {
      profileVisibility?: 'public' | 'friends' | 'private';
      allowGroupInvites?: boolean;
    };
  };
}

export interface UpiRequest {
  upiId: string;
  displayName?: string;
  provider?: 'paytm' | 'phonepe' | 'googlepay' | 'bhim' | 'amazonpay' | 'other';
  isPrimary?: boolean;
}

export interface BankAccountRequest {
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
  accountType?: 'savings' | 'current' | 'salary';
  isPrimary?: boolean;
}

export interface AvatarUploadRequest {
  avatarUrl: string;
  publicId?: string;
}

export const userService = {
  // Get current user profile
  async getProfile() {
    const response = await apiClient.get<{ data: { user: User } }>('/api/users/profile');
    return response.data;
  },

  // Update user profile
  async updateProfile(updates: ProfileUpdateRequest) {
    const response = await apiClient.put<{ data: { user: User } }>('/api/users/profile', updates);
    return response.data;
  },

  // Upload avatar
  async uploadAvatar(avatarData: AvatarUploadRequest) {
    const response = await apiClient.post<{ 
      data: { 
        user: { 
          id: string; 
          avatar: { url: string; publicId?: string }; 
          profileCompletion: any;
        } 
      } 
    }>('/api/users/avatar', avatarData);
    return response.data;
  },

  // UPI Management
  async addUpiId(upiData: UpiRequest) {
    const response = await apiClient.post<{ 
      data: { 
        upiIds: any[]; 
        profileCompletion: any;
      } 
    }>('/api/users/upi', upiData);
    return response.data;
  },

  async updateUpiId(upiId: string, upiData: Partial<UpiRequest>) {
    const response = await apiClient.put<{ data: { upiIds: any[] } }>(`/api/users/upi/${encodeURIComponent(upiId)}`, upiData);
    return response.data;
  },

  async deleteUpiId(upiId: string) {
    const response = await apiClient.delete<{ 
      data: { 
        upiIds: any[]; 
        profileCompletion: any;
      } 
    }>(`/api/users/upi/${encodeURIComponent(upiId)}`);
    return response.data;
  },

  // Bank Account Management
  async addBankAccount(bankData: BankAccountRequest) {
    const response = await apiClient.post<{ 
      data: { 
        bankAccounts: any[]; 
        profileCompletion: any;
      } 
    }>('/api/users/bank-account', bankData);
    return response.data;
  },

  async deleteBankAccount(accountId: string) {
    const response = await apiClient.delete<{ 
      data: { 
        bankAccounts: any[]; 
        profileCompletion: any;
      } 
    }>(`/api/users/bank-account/${accountId}`);
    return response.data;
  },

  // Preferences Management
  async updatePreferences(preferences: ProfileUpdateRequest['preferences']) {
    const response = await apiClient.put<{ data: { preferences: any } }>('/api/users/preferences', preferences);
    return response.data;
  },

  // Get available users for invitations
  async getAvailableUsers() {
    const response = await apiClient.get<{ data: { users: User[] } }>('/api/users/available');
    return response.data;
  },

  // Create new user (registration)
  async createUser(userData: CreateUserRequest) {
    const response = await apiClient.post<{ data: { user: User } }>('/api/users', userData);
    return response.data;
  },

  // Delete user account
  async deleteUser() {
    const response = await apiClient.delete<void>('/api/users/profile');
    return response;
  },

  // Get all users
  async getUsers(params?: { page?: number; limit?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<{ 
      data: { 
        users: User[]; 
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        }
      } 
    }>(`/api/users?${queryParams}`);
    return response.data;
  },

  // Get user by ID
  async getUserById(id: string) {
    const response = await apiClient.get<{ data: { user: User } }>(`/api/users/${id}`);
    return response.data;
  },

  // Search users
  async searchUsers(query: string) {
    const response = await apiClient.get<{ data: { users: User[] } }>(`/api/users/search/${encodeURIComponent(query)}`);
    return response.data;
  }
};