import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService, Group, CreateGroupRequest, UpdateGroupRequest, InviteMemberRequest, JoinGroupRequest, SubmitJoinRequestData, DiscoverGroupsParams } from '@/lib/services';
import { useToast } from './use-toast';
import { balanceKeys } from './useBalances';

// Query keys
export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (filters?: any) => [...groupKeys.lists(), filters] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
  members: (id: string) => [...groupKeys.detail(id), 'members'] as const,
};

// Get user's groups
export const useGroups = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: groupKeys.list(params),
    queryFn: () => groupService.getGroups(params),
    select: (data) => ({
      groups: data.data?.groups || [],
      pagination: data.data?.pagination,
    }),
    // Add configuration to prevent continuous re-fetching
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get single group
export const useGroup = (id: string) => {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: () => groupService.getGroup(id),
    select: (data) => ({
      group: data.data?.group,
      balances: data.data?.balances,
    }),
    enabled: !!id,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get group members
export const useGroupMembers = (id: string) => {
  return useQuery({
    queryKey: groupKeys.members(id),
    queryFn: () => groupService.getGroupMembers(id),
    select: (data) => data.data?.members || [],
    enabled: !!id,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create group mutation
export const useCreateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupData: CreateGroupRequest) => {
      console.log('🚀 Creating group via API:', groupData);
      return groupService.createGroup(groupData);
    },
    onSuccess: (data) => {
      console.log('✅ Group created successfully, invalidating queries:', data);
      
      // Invalidate groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      
      // Invalidate balances to refresh on groups page
      queryClient.invalidateQueries({ queryKey: balanceKeys.all });
      
      // Add new group to cache
      if (data.data?.group) {
        queryClient.setQueryData(
          groupKeys.detail(data.data.group._id),
          { data: { group: data.data.group } }
        );
      }
    },
    onError: (error) => {
      console.error('❌ Failed to create group in hook:', error);
    }
  });
};

// Update group mutation
export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateGroupRequest }) => 
      groupService.updateGroup(id, updates),
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

// Delete group mutation
export const useDeleteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => groupService.deleteGroup(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: groupKeys.detail(id) });
      queryClient.removeQueries({ queryKey: groupKeys.members(id) });
      
      // Invalidate groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

// Join group mutation (enhanced)
export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: JoinGroupRequest) => groupService.joinGroup(data),
    onSuccess: (response) => {
      const { group, requestPending } = response.data;
      
      if (requestPending) {
        toast({
          title: "Request Sent",
          description: `Your request to join "${group.name}" has been sent to the admin for approval.`
        });
      } else {
        // Invalidate groups list to show new group
        queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
        
        if (group) {
          // Add group to cache
          queryClient.setQueryData(
            groupKeys.detail(group._id),
            { data: { group } }
          );
        }
        
        toast({
          title: "Success!",
          description: `Welcome to "${group.name}"!`
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to join group",
        variant: "destructive"
      });
    }
  });
};

// Discover public groups query
export const useDiscoverGroups = (params?: DiscoverGroupsParams) => {
  return useQuery({
    queryKey: ['groups', 'discover', params],
    queryFn: () => groupService.discoverGroups(params),
    select: (data) => data.data,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Submit join request mutation
export const useSubmitJoinRequest = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: SubmitJoinRequestData }) => 
      groupService.submitJoinRequest(groupId, data),
    onSuccess: (response) => {
      const groupName = response.data.group.name;
      toast({
        title: "Request Sent",
        description: `Your request to join "${groupName}" has been sent to the admin.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send join request",
        variant: "destructive"
      });
    }
  });
};

// Get join requests query
export const useJoinRequests = (groupId: string, status?: 'pending' | 'approved' | 'rejected' | 'all') => {
  return useQuery({
    queryKey: ['groups', groupId, 'joinRequests', status],
    queryFn: () => groupService.getJoinRequests(groupId, status),
    select: (data) => data.data,
    enabled: !!groupId,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Approve join request mutation
export const useApproveJoinRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ groupId, requestId }: { groupId: string; requestId: string }) => 
      groupService.approveJoinRequest(groupId, requestId),
    onSuccess: (_, { groupId }) => {
      // Invalidate join requests and group data
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'joinRequests'] });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      
      toast({
        title: "Request Approved",
        description: "The user has been added to the group."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to approve request",
        variant: "destructive"
      });
    }
  });
};

// Reject join request mutation
export const useRejectJoinRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ groupId, requestId, reason }: { groupId: string; requestId: string; reason?: string }) => 
      groupService.rejectJoinRequest(groupId, requestId, reason),
    onSuccess: (_, { groupId }) => {
      // Invalidate join requests
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'joinRequests'] });
      
      toast({
        title: "Request Rejected",
        description: "The join request has been rejected."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reject request",
        variant: "destructive"
      });
    }
  });
};

// Get group invite code query
export const useGetInviteCode = (groupId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['groups', groupId, 'inviteCode'],
    queryFn: () => groupService.getInviteCode(groupId),
    enabled: !!groupId && enabled,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Regenerate invite code mutation
export const useRegenerateInviteCode = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ groupId, expiryDays }: { groupId: string; expiryDays?: number }) => 
      groupService.regenerateInviteCode(groupId, expiryDays),
    onSuccess: (response, { groupId }) => {
      // Invalidate group data to refresh invite code
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      
      toast({
        title: "Invite Code Regenerated",
        description: `New invite code: ${response.data.inviteCode}`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to regenerate invite code",
        variant: "destructive"
      });
    }
  });
};

// Leave group mutation
export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => groupService.leaveGroup(id),
    onSuccess: (_, id) => {
      // Remove group from cache and lists
      queryClient.removeQueries({ queryKey: groupKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      
      // Success handled by the component for better UX control
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to leave group';
      
      // Handle specific error types
      if (errorMessage.includes('owner cannot leave')) {
        toast({
          title: "Cannot Leave Group",
          description: "As the group owner, you must transfer ownership to another member before leaving.",
          variant: "destructive"
        });
      } else if (errorMessage.includes('unsettled debts')) {
        toast({
          title: "Unsettled Balances",
          description: "Please settle all your debts before leaving the group.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    },
  });
};

// Invite member mutation
export const useInviteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InviteMemberRequest }) => 
      groupService.inviteMember(id, data),
    onSuccess: (_, variables) => {
      // Invalidate group details and members
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.members(variables.id) });
    },
  });
};

// Remove member mutation
export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) => 
      groupService.removeMember(groupId, memberId),
    onSuccess: (_, variables) => {
      // Invalidate group details and members
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.members(variables.groupId) });
    },
  });
};