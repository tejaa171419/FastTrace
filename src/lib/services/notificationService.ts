import { ApiResponse, PaginatedResponse } from '@/lib/api';
import { Notification } from '@/contexts/NotificationContext';
import { apiClient } from '@/lib/api';

// Base URL for the notification API
class NotificationService {
  private basePath: string;

  constructor() {
    this.basePath = '/api/notifications';
  }

  /**
   * Get all notifications for the current user with pagination and filtering
   */
  async getNotifications(
    page: number = 1,
    limit: number = 10,
    type?: string,
    isRead?: boolean
  ): Promise<PaginatedResponse<Notification>> {
    try {
      const params: Record<string, any> = { page, limit };
      if (type) params.type = type;
      if (isRead !== undefined) params.isRead = isRead;

      const response = await apiClient.get<any>(this.basePath, params);
      
      // Transform backend response to match frontend pagination structure
      return {
        data: {
          items: response.data || [],
          pagination: response.pagination || {
            currentPage: page,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: limit,
            total: 0
          }
        }
      };
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      // Return empty data structure instead of throwing
      return {
        data: {
          items: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
            total: 0
          }
        }
      };
    }
  }

  /**
   * Get a specific notification by ID
   */
  async getNotificationById(id: string): Promise<{ data: Notification }> {
    try {
      return await apiClient.get<{ data: Notification }>(`${this.basePath}/${id}`);
    } catch (error: any) {
      console.error(`Failed to fetch notification ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string): Promise<{ data: { updated: number } }> {
    try {
      return await apiClient.put<{ data: { updated: number } }>(`${this.basePath}/${id}/read`);
    } catch (error: any) {
      console.error(`Failed to mark notification ${id} as read:`, error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(type?: string): Promise<{ data: { updated: number } }> {
    try {
      return await apiClient.put<{ data: { updated: number } }>(`${this.basePath}/read/all`, type ? { type } : undefined);
    } catch (error: any) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<{ data: { count: number } }> {
    try {
      // We'll use the regular getNotifications endpoint with isRead=false filter
      const response = await this.getNotifications(1, 1, undefined, false);
      return { data: { count: response.data.pagination.totalItems || 0 } };
    } catch (error: any) {
      console.error('Failed to get unread count:', error);
      return { data: { count: 0 } };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<{ success: boolean }> {
    try {
      return await apiClient.delete<{ success: boolean }>(`${this.basePath}/${id}`);
    } catch (error: any) {
      console.error(`Failed to delete notification ${id}:`, error);
      throw error;
    }
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
export default notificationService;