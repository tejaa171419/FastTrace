import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle, Clock, X, AlertCircle, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import settlementService from '@/lib/services/settlementServiceMock';

interface SettlementNotification {
  id: string;
  type: 'settlement_initiated' | 'settlement_completed' | 'settlement_failed' | 'settlement_cancelled';
  settlementId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  metadata: {
    fromUser: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: { url?: string };
    };
    toUser: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: { url?: string };
    };
    amount: number;
    currency: string;
    paymentMethod?: string;
    transactionId?: string;
  };
}

interface SettlementNotificationsProps {
  className?: string;
  showOnlyUnread?: boolean;
  maxNotifications?: number;
}

export const SettlementNotifications: React.FC<SettlementNotificationsProps> = ({
  className = '',
  showOnlyUnread = false,
  maxNotifications = 10
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<SettlementNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?._id) {
      fetchNotifications();
      // Set up polling for real-time updates
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user?._id, showOnlyUnread]);

  const fetchNotifications = async () => {
    try {
      if (!user?._id) return;

      const response = await settlementService.getSettlementNotifications(
        user._id,
        showOnlyUnread
      );
      
      const fetchedNotifications = response.data;
      setNotifications(fetchedNotifications.slice(0, maxNotifications));
      setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch settlement notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      if (!user?._id) return;

      await settlementService.markNotificationsRead(user._id, notificationIds);
      
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'settlement_completed':
        return CheckCircle;
      case 'settlement_failed':
        return X;
      case 'settlement_cancelled':
        return X;
      case 'settlement_initiated':
      default:
        return Clock;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'settlement_completed':
        return 'text-green-400 bg-green-500/10';
      case 'settlement_failed':
        return 'text-red-400 bg-red-500/10';
      case 'settlement_cancelled':
        return 'text-gray-400 bg-gray-500/10';
      case 'settlement_initiated':
      default:
        return 'text-blue-400 bg-blue-500/10';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    const symbol = currency === 'USD' ? '$' : '₹';
    return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className={`glass-card ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <Clock className="w-6 h-6 text-primary animate-spin mr-3" />
            <span className="text-white/60">Loading notifications...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card ${className}`}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <span className="font-medium text-white">Settlement Updates</span>
            {unreadCount > 0 && (
              <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => markAsRead(notifications.filter(n => !n.isRead).map(n => n.id))}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No settlement notifications</p>
              <p className="text-white/40 text-sm">
                You'll see updates about your payments here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type);
                const isCurrentUserSender = notification.metadata.fromUser._id === user?._id;
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-white/3 border-l-4 border-l-primary' : ''
                    }`}
                    onClick={() => !notification.isRead && markAsRead([notification.id])}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${colorClass} flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage 
                              src={isCurrentUserSender 
                                ? notification.metadata.toUser.avatar?.url 
                                : notification.metadata.fromUser.avatar?.url
                              } 
                            />
                            <AvatarFallback className="bg-white/10 text-white text-xs">
                              {isCurrentUserSender 
                                ? `${notification.metadata.toUser.firstName[0]}${notification.metadata.toUser.lastName[0]}`
                                : `${notification.metadata.fromUser.firstName[0]}${notification.metadata.fromUser.lastName[0]}`
                              }
                            </AvatarFallback>
                          </Avatar>
                          
                          <span className="text-white text-sm font-medium">
                            {formatCurrency(notification.metadata.amount, notification.metadata.currency)}
                          </span>
                          
                          <span className="text-white/60 text-xs">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                          
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-white/80 text-sm mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          {notification.metadata.paymentMethod && (
                            <span className="capitalize">
                              via {notification.metadata.paymentMethod}
                            </span>
                          )}
                          {notification.metadata.transactionId && (
                            <span>
                              • ID: {notification.metadata.transactionId.slice(-8)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Hook for settlement notification toasts
export const useSettlementNotifications = () => {
  const { toast } = useToast();
  
  const showSettlementToast = (
    type: 'initiated' | 'completed' | 'failed' | 'cancelled',
    fromUser: string,
    toUser: string,
    amount: number,
    currency: string = 'INR',
    paymentMethod?: string
  ) => {
    const formatCurrency = (amount: number, currency: string = 'INR') => {
      const symbol = currency === 'USD' ? '$' : '₹';
      return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const toastConfig = {
      initiated: {
        title: "Settlement Initiated",
        description: `Payment of ${formatCurrency(amount, currency)} to ${toUser}${paymentMethod ? ` via ${paymentMethod}` : ''}`,
        className: "border-blue-500/50 bg-blue-500/10",
      },
      completed: {
        title: "Settlement Completed ✅",
        description: `${formatCurrency(amount, currency)} payment to ${toUser} was successful`,
        className: "border-green-500/50 bg-green-500/10",
      },
      failed: {
        title: "Settlement Failed ❌",
        description: `Payment of ${formatCurrency(amount, currency)} to ${toUser} failed. Please try again.`,
        className: "border-red-500/50 bg-red-500/10",
      },
      cancelled: {
        title: "Settlement Cancelled",
        description: `Payment of ${formatCurrency(amount, currency)} to ${toUser} was cancelled`,
        className: "border-gray-500/50 bg-gray-500/10",
      }
    };

    const config = toastConfig[type];
    toast({
      title: config.title,
      description: config.description,
      className: config.className,
      duration: type === 'completed' ? 5000 : 7000,
    });
  };

  return { showSettlementToast };
};

// Context provider for real-time settlement notifications
interface SettlementNotificationContextType {
  unreadCount: number;
  notifications: SettlementNotification[];
  markAsRead: (ids: string[]) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const SettlementNotificationContext = React.createContext<SettlementNotificationContextType | null>(null);

export const SettlementNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SettlementNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = async () => {
    if (!user?._id) return;

    try {
      const response = await settlementService.getSettlementNotifications(user._id, false);
      const fetchedNotifications = response.data;
      
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to refresh settlement notifications:', error);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    if (!user?._id) return;

    try {
      await settlementService.markNotificationsRead(user._id, notificationIds);
      
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  useEffect(() => {
    if (user?._id) {
      refreshNotifications();
      // Set up real-time polling
      const interval = setInterval(refreshNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?._id]);

  return (
    <SettlementNotificationContext.Provider 
      value={{ 
        unreadCount, 
        notifications, 
        markAsRead, 
        refreshNotifications 
      }}
    >
      {children}
    </SettlementNotificationContext.Provider>
  );
};

export const useSettlementNotificationContext = () => {
  const context = React.useContext(SettlementNotificationContext);
  if (!context) {
    throw new Error('useSettlementNotificationContext must be used within SettlementNotificationProvider');
  }
  return context;
};

export default SettlementNotifications;