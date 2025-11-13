import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, type ProfileUpdateRequest, type UpiRequest, type BankAccountRequest, type AvatarUploadRequest } from '@/lib/services/userService';
import { toast } from 'sonner';
import type { User } from '@/lib/types';

export const useProfile = () => {
  const queryClient = useQueryClient();

  // Fetch user profile
  const {
    data: profileData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const user = profileData?.user;

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    }
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: userService.uploadAvatar,
    onSuccess: (data) => {
      // Update the cached profile data
      queryClient.setQueryData(['profile'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            user: {
              ...oldData.data.user,
              avatar: data.user.avatar,
              profileCompletion: data.user.profileCompletion
            }
          }
        };
      });
      toast.success('Profile picture updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to upload avatar');
    }
  });

  // Add UPI ID mutation
  const addUpiMutation = useMutation({
    mutationFn: userService.addUpiId,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            user: {
              ...oldData.data.user,
              upiIds: data.upiIds,
              profileCompletion: data.profileCompletion
            }
          }
        };
      });
      toast.success('UPI ID added successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add UPI ID');
    }
  });

  // Update UPI ID mutation
  const updateUpiMutation = useMutation({
    mutationFn: ({ upiId, data }: { upiId: string; data: Partial<UpiRequest> }) =>
      userService.updateUpiId(upiId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            user: {
              ...oldData.data.user,
              upiIds: data.upiIds
            }
          }
        };
      });
      toast.success('UPI ID updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update UPI ID');
    }
  });

  // Delete UPI ID mutation
  const deleteUpiMutation = useMutation({
    mutationFn: userService.deleteUpiId,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            user: {
              ...oldData.data.user,
              upiIds: data.upiIds,
              profileCompletion: data.profileCompletion
            }
          }
        };
      });
      toast.success('UPI ID deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete UPI ID');
    }
  });

  // Add bank account mutation
  const addBankAccountMutation = useMutation({
    mutationFn: userService.addBankAccount,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            user: {
              ...oldData.data.user,
              bankAccounts: data.bankAccounts,
              profileCompletion: data.profileCompletion
            }
          }
        };
      });
      toast.success('Bank account added successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add bank account');
    }
  });

  // Delete bank account mutation
  const deleteBankAccountMutation = useMutation({
    mutationFn: userService.deleteBankAccount,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            user: {
              ...oldData.data.user,
              bankAccounts: data.bankAccounts,
              profileCompletion: data.profileCompletion
            }
          }
        };
      });
      toast.success('Bank account deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete bank account');
    }
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: userService.updatePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            user: {
              ...oldData.data.user,
              preferences: data.preferences
            }
          }
        };
      });
      toast.success('Preferences updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update preferences');
    }
  });

  // Helper functions
  const updateProfile = (data: ProfileUpdateRequest) => {
    updateProfileMutation.mutate(data);
  };

  const uploadAvatar = (data: AvatarUploadRequest) => {
    uploadAvatarMutation.mutate(data);
  };

  const addUpiId = (data: UpiRequest) => {
    addUpiMutation.mutate(data);
  };

  const updateUpiId = (upiId: string, data: Partial<UpiRequest>) => {
    updateUpiMutation.mutate({ upiId, data });
  };

  const deleteUpiId = (upiId: string) => {
    deleteUpiMutation.mutate(upiId);
  };

  const addBankAccount = (data: BankAccountRequest) => {
    addBankAccountMutation.mutate(data);
  };

  const deleteBankAccount = (accountId: string) => {
    deleteBankAccountMutation.mutate(accountId);
  };

  const updatePreferences = (preferences: ProfileUpdateRequest['preferences']) => {
    updatePreferencesMutation.mutate(preferences);
  };

  const isProfileComplete = user?.profileCompletion?.isComplete ?? false;
  const completionPercentage = user?.profileCompletion?.completionPercentage ?? 0;

  return {
    // Data
    user,
    isLoading,
    error,
    isProfileComplete,
    completionPercentage,
    
    // Actions
    updateProfile,
    uploadAvatar,
    addUpiId,
    updateUpiId,
    deleteUpiId,
    addBankAccount,
    deleteBankAccount,
    updatePreferences,
    refetch,
    
    // Loading states
    isUpdatingProfile: updateProfileMutation.isPending,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    isAddingUpi: addUpiMutation.isPending,
    isUpdatingUpi: updateUpiMutation.isPending,
    isDeletingUpi: deleteUpiMutation.isPending,
    isAddingBankAccount: addBankAccountMutation.isPending,
    isDeletingBankAccount: deleteBankAccountMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending
  };
};