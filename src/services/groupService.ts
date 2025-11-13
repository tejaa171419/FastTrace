import { apiClient } from './api';
import type {
  Group,
  CreateGroupRequest,
  UpdateGroupRequest,
  InviteMemberRequest,
  JoinGroupRequest,
  SubmitJoinRequestData,
  DiscoverGroupsParams,
  JoinRequest,
  GetGroupsResponse,
  GetDiscoveryGroupsResponse,
  GetJoinRequestsResponse,
  GroupMember,
  User
} from '@/lib/types';

export const groupService = {
  // Get user's groups
  async getGroups(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }) {
    return apiClient.get<{ data: GetGroupsResponse }>('/api/groups', params);
  },

  // Get single group
  async getGroup(id: string) {
    return apiClient.get<{ data: { group: Group; balances?: any[] } }>('/api/groups/' + id);
  },

  // Create new group
  async createGroup(groupData: CreateGroupRequest) {
    return apiClient.post<{ data: { group: Group } }>('/api/groups', groupData);
  },

  // Update group
  async updateGroup(id: string, updates: UpdateGroupRequest) {
    return apiClient.put<{ data: { group: Group } }>('/api/groups/' + id, updates);
  },

  // Delete group
  async deleteGroup(id: string) {
    return apiClient.delete<void>('/api/groups/' + id);
  },

  // Join group by invite code (enhanced)
  async joinGroup(data: JoinGroupRequest) {
    return apiClient.post<{ data: { group: Group; requestPending?: boolean } }>('/api/groups/join', data);
  },

  // Discover public groups
  async discoverGroups(params?: DiscoverGroupsParams) {
    return apiClient.get<{ data: GetDiscoveryGroupsResponse }>('/api/groups/discover', params);
  },

  // Submit join request for private group
  async submitJoinRequest(groupId: string, data: SubmitJoinRequestData) {
    return apiClient.post<{ data: { group: Partial<Group> } }>(`/api/groups/${groupId}/join-request`, data);
  },

  // Get join requests for a group (Admin only)
  async getJoinRequests(groupId: string, status?: 'pending' | 'approved' | 'rejected' | 'all') {
    const params = status ? { status } : undefined;
    return apiClient.get<{ data: GetJoinRequestsResponse }>(`/api/groups/${groupId}/join-requests`, params);
  },

  // Approve join request
  async approveJoinRequest(groupId: string, requestId: string) {
    return apiClient.post<{ data: { request: JoinRequest; newMember: GroupMember } }>(
      `/api/groups/${groupId}/join-requests/${requestId}/approve`
    );
  },

  // Reject join request
  async rejectJoinRequest(groupId: string, requestId: string, reason?: string) {
    return apiClient.post<{ data: { request: JoinRequest } }>(
      `/api/groups/${groupId}/join-requests/${requestId}/reject`,
      { reason }
    );
  },

  // Leave group
  async leaveGroup(id: string) {
    return apiClient.post<void>('/api/groups/' + id + '/leave');
  },

  // Get group members
  async getGroupMembers(id: string) {
    return apiClient.get<{ data: { members: GroupMember[] } }>('/api/groups/' + id + '/members');
  },

  // Invite member to group
  async inviteMember(id: string, data: InviteMemberRequest) {
    return apiClient.post<{ data: { group: Partial<Group> } }>('/api/groups/' + id + '/invite', data);
  },

  // Remove member from group
  async removeMember(groupId: string, memberId: string) {
    return apiClient.delete<void>('/api/groups/' + groupId + '/members/' + memberId);
  },

  // Get group invite code
  async getInviteCode(id: string) {
    return apiClient.get<{ data: { inviteCode: string; expiresAt: string; isValid: boolean } }>(
      `/api/groups/${id}/invite-code`
    );
  },

  // Generate new invite code
  async regenerateInviteCode(id: string, expiryDays?: number) {
    return apiClient.post<{ data: { inviteCode: string; expiresAt?: string } }>(
      `/api/groups/${id}/regenerate-invite`, 
      { expiryDays }
    );
  },

  // Update member role (placeholder)
  async updateMemberRole(groupId: string, memberId: string, role: 'admin' | 'member') {
    return apiClient.patch<void>('/api/groups/' + groupId + '/members/' + memberId, { role });
  }
};