import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  isRead: boolean;
  readAt?: string;
  action?: {
    type: string;
    url: string;
    text: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

interface NotificationPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  pagination: NotificationPagination | null;
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useNotifications = (): UseNotificationsResult => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<NotificationPagination | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Calculate unread count
  useEffect(() => {
    const count = notifications.filter(n => !n.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  // Setup WebSocket connection for real-time notifications
  useEffect(() => {
    if (!user || !token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('📡 Notifications WebSocket connected');
    });

    newSocket.on('notification_received', (data: { notification: Notification }) => {
      console.log('🔔 New notification received:', data.notification);
      setNotifications(prev => [data.notification, ...prev]);
    });

    newSocket.on('notification_updated', (data: { notification: Notification }) => {
      console.log('🔄 Notification updated:', data.notification);
      setNotifications(prev =>
        prev.map(n => (n._id === data.notification._id ? data.notification : n))
      );
    });

    newSocket.on('notifications_marked_read', (data: { count: number }) => {
      console.log('✅ Notifications marked as read:', data.count);
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
    });

    newSocket.on('disconnect', () => {
      console.log('📡 Notifications WebSocket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, token]);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (page: number = 1, limit: number = 20) => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get<{
          success: boolean;
          data: Notification[];
          pagination: NotificationPagination;
        }>('/api/notifications', {
          page,
          limit,
        });

        if (response.success) {
          setNotifications(response.data);
          setPagination(response.pagination);
        }
      } catch (err: any) {
        console.error('Failed to fetch notifications:', err);
        setError(err.message || 'Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: Notification;
      }>(`/api/notifications/${id}/read`);

      if (response.success) {
        setNotifications(prev =>
          prev.map(n => (n._id === id ? response.data : n))
        );
      }
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: { updated: number };
      }>('/api/notifications/read/all');

      if (response.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
      }
    } catch (err: any) {
      console.error('Failed to mark all notifications as read:', err);
      throw err;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/api/notifications/${id}`);

      if (response.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications(1, pagination?.itemsPerPage || 20);
  }, [fetchNotifications, pagination]);

  // Fetch notifications on mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };
};
