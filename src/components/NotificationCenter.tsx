import React, { useState } from 'react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  X, 
  Settings,
  Clock,
  CreditCard,
  Users,
  DollarSign,
  AlertCircle,
  Info
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: string, priority: string) => {
  const iconClass = cn(
    'w-4 h-4',
    priority === 'urgent' ? 'text-red-400' :
    priority === 'high' ? 'text-orange-400' :
    priority === 'medium' ? 'text-blue-400' :
    'text-gray-400'
  );
  
  switch (type) {
    case 'expense':
      return <DollarSign className={iconClass} />;
    case 'settlement':
      return <CreditCard className={iconClass} />;
    case 'group':
      return <Users className={iconClass} />;
    case 'reminder':
      return <Clock className={iconClass} />;
    case 'system':
      return priority === 'urgent' ? <AlertCircle className={iconClass} /> : <Info className={iconClass} />;
    default:
      return <Bell className={iconClass} />;
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(notificationId);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearAll();
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant=\"ghost\"
          size=\"sm\"
          className={cn(
            'relative text-white hover:bg-white/10',
            className
          )}
        >
          {unreadCount > 0 ? (
            <BellRing className=\"w-5 h-5\" />
          ) : (
            <Bell className=\"w-5 h-5\" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant=\"destructive\" 
              className=\"absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs\"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className=\"w-96 p-0 bg-gray-900/95 border-gray-700\" align=\"end\">
        <div className=\"p-4\">
          <div className=\"flex items-center justify-between mb-4\">
            <h3 className=\"text-lg font-semibold text-white\">Notifications</h3>
            <div className=\"flex items-center gap-2\">
              {unreadCount > 0 && (
                <Button
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={handleMarkAllRead}
                  className=\"text-white/70 hover:text-white hover:bg-white/10\"
                >
                  <CheckCheck className=\"w-4 h-4\" />
                </Button>
              )}
              <Button
                variant=\"ghost\"
                size=\"sm\"
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                className=\"text-white/70 hover:text-white hover:bg-white/10\"
              >
                <Settings className=\"w-4 h-4\" />
              </Button>
            </div>
          </div>
          
          {showSettingsPanel ? (
            <NotificationSettings onClose={() => setShowSettingsPanel(false)} />
          ) : (
            <>
              {notifications.length === 0 ? (
                <div className=\"text-center py-8\">
                  <Bell className=\"w-12 h-12 text-white/20 mx-auto mb-2\" />
                  <p className=\"text-white/60 text-sm\">No notifications</p>
                </div>
              ) : (
                <>
                  <ScrollArea className=\"h-96\">
                    <div className=\"space-y-2\">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            'p-3 rounded-lg border cursor-pointer transition-colors',
                            notification.isRead 
                              ? 'bg-gray-800/30 border-gray-700/50' 
                              : 'bg-blue-900/20 border-blue-500/30 hover:bg-blue-900/30',
                            notification.priority === 'urgent' && !notification.isRead && 'bg-red-900/20 border-red-500/30'
                          )}
                          onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                        >
                          <div className=\"flex items-start gap-3\">
                            <div className=\"flex-shrink-0 mt-0.5\">
                              {getNotificationIcon(notification.type, notification.priority)}
                            </div>
                            <div className=\"flex-1 min-w-0\">
                              <div className=\"flex items-start justify-between\">
                                <div className=\"flex-1\">
                                  <p className=\"text-white text-sm font-medium\">
                                    {notification.title}
                                  </p>
                                  <p className=\"text-white/70 text-xs mt-1 line-clamp-2\">
                                    {notification.message}
                                  </p>
                                </div>
                                <div className=\"flex items-center gap-2 flex-shrink-0 ml-2\">
                                  {!notification.isRead && (
                                    <div className=\"w-2 h-2 bg-blue-400 rounded-full\" />
                                  )}
                                  <Button
                                    variant=\"ghost\"
                                    size=\"sm\"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeNotification(notification.id);
                                    }}
                                    className=\"w-6 h-6 p-0 text-white/50 hover:text-white hover:bg-white/10\"
                                  >
                                    <X className=\"w-3 h-3\" />
                                  </Button>
                                </div>
                              </div>
                              <div className=\"flex items-center justify-between mt-2\">
                                <span className=\"text-xs text-white/50\">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                                {notification.priority === 'urgent' && (
                                  <Badge variant=\"destructive\" className=\"text-xs\">
                                    Urgent
                                  </Badge>
                                )}
                                {notification.priority === 'high' && (
                                  <Badge variant=\"outline\" className=\"text-xs border-orange-500 text-orange-400\">
                                    High
                                  </Badge>
                                )}
                              </div>
                              {notification.actions && notification.actions.length > 0 && (
                                <div className=\"flex gap-2 mt-2\">
                                  {notification.actions.map((action) => (
                                    <Button
                                      key={action.id}
                                      variant={action.type === 'primary' ? 'default' : action.type === 'danger' ? 'destructive' : 'outline'}
                                      size=\"sm\"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        action.handler(notification);
                                      }}
                                      className=\"text-xs h-7\"
                                    >
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Separator className=\"my-4 bg-gray-700\" />
                  <div className=\"flex justify-between\">
                    <span className=\"text-xs text-white/50\">
                      {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                    </span>
                    <Button
                      variant=\"ghost\"
                      size=\"sm\"
                      onClick={handleClearAll}
                      className=\"text-xs text-white/70 hover:text-white hover:bg-white/10\"
                    >
                      Clear all
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface NotificationSettingsProps {
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const { preferences, updatePreferences } = useNotifications();

  const handleToggle = (key: keyof typeof preferences) => {
    updatePreferences({ [key]: !preferences[key] });
  };

  return (
    <div className=\"space-y-4\">
      <div className=\"flex items-center justify-between mb-4\">
        <h4 className=\"text-md font-semibold text-white\">Settings</h4>
        <Button
          variant=\"ghost\"
          size=\"sm\"
          onClick={onClose}
          className=\"text-white/70 hover:text-white hover:bg-white/10\"
        >
          <X className=\"w-4 h-4\" />
        </Button>
      </div>
      
      <div className=\"space-y-3\">
        <div className=\"flex items-center justify-between\">
          <span className=\"text-white/80 text-sm\">Show toast notifications</span>
          <button
            onClick={() => handleToggle('showToasts')}
            className={cn(
              'w-10 h-6 rounded-full transition-colors',
              preferences.showToasts ? 'bg-blue-500' : 'bg-gray-600'
            )}
          >
            <div className={cn(
              'w-4 h-4 bg-white rounded-full transition-transform',
              preferences.showToasts ? 'translate-x-5' : 'translate-x-1'
            )} />
          </button>
        </div>
        
        <div className=\"flex items-center justify-between\">
          <span className=\"text-white/80 text-sm\">Browser notifications</span>
          <button
            onClick={() => handleToggle('showBrowserNotifications')}
            className={cn(
              'w-10 h-6 rounded-full transition-colors',
              preferences.showBrowserNotifications ? 'bg-blue-500' : 'bg-gray-600'
            )}
          >
            <div className={cn(
              'w-4 h-4 bg-white rounded-full transition-transform',
              preferences.showBrowserNotifications ? 'translate-x-5' : 'translate-x-1'
            )} />
          </button>
        </div>
        
        <div className=\"flex items-center justify-between\">
          <span className=\"text-white/80 text-sm\">Expense notifications</span>
          <button
            onClick={() => handleToggle('expenseNotifications')}
            className={cn(
              'w-10 h-6 rounded-full transition-colors',
              preferences.expenseNotifications ? 'bg-blue-500' : 'bg-gray-600'
            )}
          >
            <div className={cn(
              'w-4 h-4 bg-white rounded-full transition-transform',
              preferences.expenseNotifications ? 'translate-x-5' : 'translate-x-1'
            )} />
          </button>
        </div>
        
        <div className=\"flex items-center justify-between\">
          <span className=\"text-white/80 text-sm\">Settlement notifications</span>
          <button
            onClick={() => handleToggle('settlementNotifications')}
            className={cn(
              'w-10 h-6 rounded-full transition-colors',
              preferences.settlementNotifications ? 'bg-blue-500' : 'bg-gray-600'
            )}
          >
            <div className={cn(
              'w-4 h-4 bg-white rounded-full transition-transform',
              preferences.settlementNotifications ? 'translate-x-5' : 'translate-x-1'
            )} />
          </button>
        </div>
        
        <div className=\"flex items-center justify-between\">
          <span className=\"text-white/80 text-sm\">Group activity</span>
          <button
            onClick={() => handleToggle('groupActivityNotifications')}
            className={cn(
              'w-10 h-6 rounded-full transition-colors',
              preferences.groupActivityNotifications ? 'bg-blue-500' : 'bg-gray-600'
            )}
          >
            <div className={cn(
              'w-4 h-4 bg-white rounded-full transition-transform',
              preferences.groupActivityNotifications ? 'translate-x-5' : 'translate-x-1'
            )} />
          </button>
        </div>
        
        <div className=\"flex items-center justify-between\">
          <span className=\"text-white/80 text-sm\">Sound</span>
          <button
            onClick={() => handleToggle('sound')}
            className={cn(
              'w-10 h-6 rounded-full transition-colors',
              preferences.sound ? 'bg-blue-500' : 'bg-gray-600'
            )}
          >
            <div className={cn(
              'w-4 h-4 bg-white rounded-full transition-transform',
              preferences.sound ? 'translate-x-5' : 'translate-x-1'
            )} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;