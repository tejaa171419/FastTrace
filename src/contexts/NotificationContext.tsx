import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import notificationService from '@/lib/services/notificationService';

export interface Notification {
  id: string;
  type: 'expense_added' | 'expense_updated' | 'payment_request' | 'payment_received' | 'payment_completed' | 'group_invite' | 'group_joined' | 'group_left' | 'balance_reminder' | 'settlement_reminder' | 'budget_alert' | 'goal_achieved' | 'account_security';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actions?: NotificationAction[];
  readAt?: string;
  status?: string;
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  handler: (notification: Notification) => void;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
  // Notification preferences
  preferences: NotificationPreferences;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
}

interface NotificationPreferences {
  showToasts: boolean;
  showBrowserNotifications: boolean;
  expenseNotifications: boolean;
  settlementNotifications: boolean;
  groupActivityNotifications: boolean;
  settlementReminders: boolean;
  emailNotifications: boolean;
  sound: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

const defaultPreferences: NotificationPreferences = {
  showToasts: true,
  showBrowserNotifications: true,
  expenseNotifications: true,
  settlementNotifications: true,
  groupActivityNotifications: true,
  settlementReminders: true,
  emailNotifications: false,
  sound: false,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  }
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { socket, isConnected, on, off } = useWebSocketContext();

  // Load notifications from backend and preferences from localStorage on mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Load preferences from localStorage
      const savedPreferences = localStorage.getItem('notification-preferences');
      if (savedPreferences) {
        try {
          const parsed = JSON.parse(savedPreferences);
          setPreferences({ ...defaultPreferences, ...parsed });
        } catch (error) {
          console.error('Failed to parse notification preferences:', error);
        }
      }

      // Load notifications from backend if user is authenticated
      if (user?._id) {
        try {
          const response = await notificationService.getNotifications(1, 50, undefined, false);
          if (response.data && response.data.items) {
            setNotifications(response.data.items);
          }
        } catch (error) {
          console.error('Failed to load notifications from backend:', error);
          // Continue with empty notifications if backend fails
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [user?._id]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notification-preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Request browser notification permission
  useEffect(() => {
    if (preferences.showBrowserNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [preferences.showBrowserNotifications]);

  // Check if currently in quiet hours
  const isQuietHours = useCallback(() => {
    if (!preferences.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { start, end } = preferences.quietHours;
    
    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Spans midnight
      return currentTime >= start || currentTime <= end;
    }
  }, [preferences.quietHours]);

  // Generate unique notification ID
  const generateId = () => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const notification: Notification = {
      ...notificationData,
      id: generateId(),
      isRead: false,
      createdAt: new Date().toISOString()
    };

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep max 50 notifications

    const shouldShowNotification = !isQuietHours();

    // Show toast notification
    if (preferences.showToasts && shouldShowNotification) {
      const toastOptions = {
        duration: notification.priority === 'urgent' ? 8000 : notification.priority === 'high' ? 6000 : 4000,
        position: 'top-right' as const,
        style: {
          background: notification.priority === 'urgent' ? 'rgba(239, 68, 68, 0.1)' : 
                     notification.priority === 'high' ? 'rgba(245, 158, 11, 0.1)' : 
                     'rgba(34, 197, 94, 0.1)',
          border: notification.priority === 'urgent' ? '1px solid rgba(239, 68, 68, 0.2)' : 
                  notification.priority === 'high' ? '1px solid rgba(245, 158, 11, 0.2)' : 
                  '1px solid rgba(34, 197, 94, 0.2)',
          color: '#ffffff',
        },
      };

      toast.success(`${notification.title}: ${notification.message}`, toastOptions);
    }

    // Show browser notification
    if (preferences.showBrowserNotifications && shouldShowNotification && 'Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/logo1.png',
        tag: notification.id
      });

      browserNotification.onclick = () => {
        window.focus();
        markAsRead(notification.id);
        browserNotification.close();
      };

      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }

    // Play sound if enabled
    if (preferences.sound && shouldShowNotification) {
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.3;
        audio.play().catch(console.error);
      } catch (error) {
        console.error('Failed to play notification sound:', error);
      }
    }
  }, [preferences, isQuietHours]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Update local state immediately for better UX
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );

    // Sync with backend
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read on backend:', error);
      // Revert local state if backend sync fails
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: false }
            : notification
        )
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    
    // Update local state immediately
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );

    // Sync with backend
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read on backend:', error);
      // Revert local state if backend sync fails
      setNotifications(prev => 
        prev.map(notification => 
          unreadIds.includes(notification.id)
            ? { ...notification, isRead: false }
            : notification
        )
      );
    }
  }, [notifications]);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const notificationReceivedHandler = (data: any) => {
      console.log('WebSocket received notification:', data);
      
      // Handle real-time notifications from server
      if (data.notification && data.message) {
        addNotification({
          type: data.notification.type as Notification['type'],
          title: data.notification.title,
          message: data.notification.message,
          data: data.notification.data,
          priority: data.notification.priority as Notification['priority']
        });
      }
    };

    // Register event listener for real-time notifications
    on('notification_received', notificationReceivedHandler);

    return () => {
      // Cleanup
      off('notification_received', notificationReceivedHandler);
    };
  }, [socket, isConnected, on, off, preferences, addNotification]);

  // Clean up expired notifications
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      setNotifications(prev => 
        prev.filter(notification => {
          if (!notification.expiresAt) return true;
          return new Date(notification.expiresAt) > now;
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    preferences,
    updatePreferences
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;