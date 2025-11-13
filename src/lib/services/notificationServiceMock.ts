import { ApiResponse, PaginatedResponse } from '@/lib/api';
import { Notification } from '@/contexts/NotificationContext';

// Mock notification data
const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'settlement',
    title: 'Payment Received',
    message: 'You received ₹500 from John Doe',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    priority: 'high',
    data: {
      amount: 500,
      currency: 'INR',
      fromUser: 'John Doe'
    }
  },
  {
    id: 'notif-2',
    type: 'expense',
    title: 'New Expense Added',
    message: 'Lunch expense of ₹250 was added to "Weekend Trip" group',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    priority: 'medium',
    data: {
      amount: 250,
      groupName: 'Weekend Trip',
      expenseName: 'Lunch'
    }
  },
  {
    id: 'notif-3',
    type: 'group',
    title: 'Group Invitation',
    message: 'You have been invited to join "Office Team" group',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    priority: 'medium',
    data: {
      groupName: 'Office Team',
      invitedBy: 'Sarah Smith'
    }
  },
  {
    id: 'notif-4',
    type: 'reminder',
    title: 'Payment Reminder',
    message: 'You owe ₹1,200 to Mike for "Dinner Party"',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    priority: 'high',
    data: {
      amount: 1200,
      toUser: 'Mike',
      eventName: 'Dinner Party'
    }
  },
  {
    id: 'notif-5',
    type: 'system',
    title: 'Security Update',
    message: 'Your PIN was successfully changed',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    priority: 'low',
    data: {
      action: 'pin_changed'
    }
  }
];

class NotificationServiceMock {
  private notifications: Notification[] = [...mockNotifications];
  private basePath: string;

  constructor() {
    this.basePath = '/notifications';
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    const stored = localStorage.getItem('mock-notifications');
    if (stored) {
      try {
        this.notifications = JSON.parse(stored);
      } catch (error) {
        console.error('Failed to load mock notifications from localStorage');
      }
    }
  }

  private saveToLocalStorage() {
    localStorage.setItem('mock-notifications', JSON.stringify(this.notifications));
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
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Filter notifications
    let filtered = [...this.notifications];
    
    if (type) {
      filtered = filtered.filter(n => n.type === type);
    }
    
    if (isRead !== undefined) {
      filtered = filtered.filter(n => n.isRead === isRead);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = filtered.slice(startIndex, endIndex);

    return {
      data: {
        items,
        pagination: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit)
        }
      }
    };
  }

  /**
   * Get a specific notification by ID
   */
  async getNotificationById(id: string): Promise<{ data: Notification }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const notification = this.notifications.find(n => n.id === id);
    
    if (!notification) {
      throw new Error(`Notification ${id} not found`);
    }

    return { data: notification };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string): Promise<{ data: { updated: number } }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const notification = this.notifications.find(n => n.id === id);
    let updated = 0;
    
    if (notification && !notification.isRead) {
      notification.isRead = true;
      updated = 1;
      this.saveToLocalStorage();
    }

    return { data: { updated } };
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(type?: string): Promise<{ data: { updated: number } }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    let updated = 0;
    
    this.notifications.forEach(notification => {
      if (!notification.isRead && (!type || notification.type === type)) {
        notification.isRead = true;
        updated++;
      }
    });

    if (updated > 0) {
      this.saveToLocalStorage();
    }

    return { data: { updated } };
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<{ data: { count: number } }> {
    await new Promise(resolve => setTimeout(resolve, 100));

    const count = this.notifications.filter(n => !n.isRead).length;
    return { data: { count } };
  }

  /**
   * Add a new notification (for testing)
   */
  async addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<{ data: Notification }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    this.notifications.unshift(newNotification);
    this.saveToLocalStorage();

    return { data: newNotification };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<{ data: { deleted: boolean } }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const index = this.notifications.findIndex(n => n.id === id);
    
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.saveToLocalStorage();
      return { data: { deleted: true } };
    }

    return { data: { deleted: false } };
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<{ data: { deleted: number } }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const count = this.notifications.length;
    this.notifications = [];
    this.saveToLocalStorage();

    return { data: { deleted: count } };
  }

  /**
   * Simulate real-time notification
   */
  simulateNewNotification() {
    const types: Notification['type'][] = ['expense', 'settlement', 'group', 'reminder', 'system'];
    const priorities: Notification['priority'][] = ['low', 'medium', 'high', 'urgent'];
    
    const templates = [
      { title: 'Payment Received', message: 'You received ₹{amount} from {user}' },
      { title: 'New Expense', message: '{user} added ₹{amount} expense in "{group}"' },
      { title: 'Settlement Request', message: '{user} requested ₹{amount} for "{reason}"' },
      { title: 'Group Update', message: 'New activity in "{group}" group' },
      { title: 'Payment Due', message: 'Reminder: You owe ₹{amount} to {user}' }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    const amount = Math.floor(Math.random() * 5000) + 100;
    const users = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
    const groups = ['Weekend Trip', 'Office Lunch', 'Movie Night', 'Shopping'];
    
    const notification: Omit<Notification, 'id' | 'createdAt'> = {
      type: types[Math.floor(Math.random() * types.length)],
      title: template.title,
      message: template.message
        .replace('{amount}', amount.toString())
        .replace('{user}', users[Math.floor(Math.random() * users.length)])
        .replace('{group}', groups[Math.floor(Math.random() * groups.length)])
        .replace('{reason}', 'Shared expenses'),
      isRead: false,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      data: {
        amount,
        timestamp: Date.now()
      }
    };

    return this.addNotification(notification);
  }

  /**
   * Subscribe to push notifications (mock)
   */
  async subscribeToPush(subscription: any): Promise<{ data: { success: boolean } }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Store subscription in localStorage for mock
    localStorage.setItem('mock-push-subscription', JSON.stringify(subscription));
    
    return { data: { success: true } };
  }

  /**
   * Unsubscribe from push notifications (mock)
   */
  async unsubscribeFromPush(endpoint: string): Promise<{ data: { success: boolean } }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    localStorage.removeItem('mock-push-subscription');
    
    return { data: { success: true } };
  }
}

// Create and export singleton instance
const notificationServiceMock = new NotificationServiceMock();

// Simulate occasional new notifications in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const random = Math.random();
    if (random > 0.95) { // 5% chance every 30 seconds
      notificationServiceMock.simulateNewNotification()
        .then(result => {
          console.log('📬 New mock notification:', result.data);
        });
    }
  }, 30000);
}

export default notificationServiceMock;