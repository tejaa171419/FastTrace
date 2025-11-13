import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus, 
  UserMinus, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useRealTimeBalanceUpdates } from '@/hooks/useRealTimeBalanceUpdates';
import { useExpenseNotifications } from '@/hooks/useExpenseNotifications';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'expense_created' | 'expense_updated' | 'expense_deleted' | 'settlement_completed' | 'member_joined' | 'member_left' | 'balance_updated';
  title: string;
  description: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  amount?: number;
  currency?: string;
  metadata?: any;
}

interface LiveGroupActivityFeedProps {
  groupId: string;
  maxItems?: number;
  showConnectionStatus?: boolean;
  className?: string;
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'expense_created':
      return <Plus className=\"w-4 h-4 text-green-400\" />;
    case 'expense_updated':
      return <Edit className=\"w-4 h-4 text-blue-400\" />;
    case 'expense_deleted':
      return <Trash2 className=\"w-4 h-4 text-red-400\" />;
    case 'settlement_completed':
      return <CreditCard className=\"w-4 h-4 text-purple-400\" />;
    case 'member_joined':
      return <UserPlus className=\"w-4 h-4 text-green-400\" />;
    case 'member_left':
      return <UserMinus className=\"w-4 h-4 text-orange-400\" />;
    case 'balance_updated':
      return <RefreshCw className=\"w-4 h-4 text-cyan-400\" />;
    default:
      return <Activity className=\"w-4 h-4 text-gray-400\" />;
  }
};

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'expense_created':
      return 'border-green-500/20 bg-green-500/5';
    case 'expense_updated':
      return 'border-blue-500/20 bg-blue-500/5';
    case 'expense_deleted':
      return 'border-red-500/20 bg-red-500/5';
    case 'settlement_completed':
      return 'border-purple-500/20 bg-purple-500/5';
    case 'member_joined':
      return 'border-green-500/20 bg-green-500/5';
    case 'member_left':
      return 'border-orange-500/20 bg-orange-500/5';
    case 'balance_updated':
      return 'border-cyan-500/20 bg-cyan-500/5';
    default:
      return 'border-gray-500/20 bg-gray-500/5';
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

export const LiveGroupActivityFeed: React.FC<LiveGroupActivityFeedProps> = ({
  groupId,
  maxItems = 20,
  showConnectionStatus = true,
  className
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Initialize real-time connections
  const { isConnected, lastUpdate, requestBalanceUpdate } = useRealTimeBalanceUpdates(groupId);
  
  useExpenseNotifications({
    groupId,
    showToasts: false, // We'll show in feed instead
    onExpenseUpdate: (notification) => {
      const newActivity: ActivityItem = {
        id: `${notification.expenseId}-${notification.timestamp}`,
        type: `expense_${notification.action}` as ActivityItem['type'],
        title: notification.expense.title,
        description: `${notification.action === 'created' ? 'Added' : notification.action === 'updated' ? 'Updated' : 'Deleted'} expense`,
        user: {
          id: notification.addedBy.id,
          name: notification.addedBy.name
        },
        timestamp: notification.timestamp,
        amount: notification.expense.amount,
        currency: notification.expense.currency,
        metadata: notification.expense
      };
      
      setActivities(prev => [newActivity, ...prev.slice(0, maxItems - 1)]);
    }
  });

  // Load initial activity history (mock data for now)
  useEffect(() => {
    const loadActivityHistory = async () => {
      setIsLoadingHistory(true);
      try {
        // This would normally be an API call
        // For now, we'll create some mock recent activities
        const mockActivities: ActivityItem[] = [
          {
            id: '1',
            type: 'expense_created',
            title: 'Dinner at Restaurant',
            description: 'Added expense',
            user: { id: '1', name: 'John Doe' },
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
            amount: 1250,
            currency: 'INR'
          },
          {
            id: '2',
            type: 'settlement_completed',
            title: 'Settlement Payment',
            description: 'Paid via Razorpay',
            user: { id: '2', name: 'Jane Smith' },
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
            amount: 625,
            currency: 'INR'
          },
          {
            id: '3',
            type: 'member_joined',
            title: 'New Member',
            description: 'Joined the group',
            user: { id: '3', name: 'Alice Johnson' },
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          }
        ];
        
        setActivities(mockActivities);
      } catch (error) {
        console.error('Failed to load activity history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadActivityHistory();
  }, [groupId]);

  const handleRefreshActivity = () => {
    requestBalanceUpdate();
    // Could also refresh activity history here
  };

  return (
    <Card className={cn('glass-card', className)}>
      <CardHeader>
        <div className=\"flex items-center justify-between\">
          <CardTitle className=\"text-white flex items-center gap-2\">
            <Activity className=\"w-5 h-5 text-primary\" />
            Live Activity
            {showConnectionStatus && (
              <div className=\"flex items-center gap-1 ml-2\">
                {isConnected ? (
                  <>
                    <Wifi className=\"w-4 h-4 text-green-400\" />
                    <span className=\"text-xs text-green-400\">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className=\"w-4 h-4 text-gray-400\" />
                    <span className=\"text-xs text-gray-400\">Offline</span>
                  </>
                )}
              </div>
            )}
          </CardTitle>
          <Button
            size=\"sm\"
            variant=\"ghost\"
            onClick={handleRefreshActivity}
            disabled={!isConnected || isLoadingHistory}
            className=\"text-white/70 hover:text-white hover:bg-white/10\"
            title=\"Refresh activity\"
          >
            <RefreshCw className={cn('w-4 h-4', isLoadingHistory && 'animate-spin')} />
          </Button>
        </div>
        {lastUpdate && (
          <p className=\"text-xs text-white/50\">
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className=\"h-96\">
          {activities.length === 0 ? (
            <div className=\"text-center py-8\">
              <Activity className=\"w-12 h-12 text-white/20 mx-auto mb-2\" />
              <p className=\"text-white/60 text-sm\">
                {isLoadingHistory ? 'Loading activity...' : 'No recent activity'}
              </p>
            </div>
          ) : (
            <div className=\"space-y-3\">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                    getActivityColor(activity.type)
                  )}
                >
                  <div className=\"flex-shrink-0 mt-0.5\">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className=\"flex-1 min-w-0\">
                    <div className=\"flex items-center justify-between\">
                      <div className=\"flex items-center gap-2\">
                        <Avatar className=\"w-6 h-6\">
                          <AvatarImage src={activity.user.avatar} />
                          <AvatarFallback className=\"bg-gradient-primary text-white text-xs\">
                            {activity.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className=\"text-white text-sm font-medium truncate\">
                          {activity.user.name}
                        </span>
                      </div>
                      <div className=\"flex items-center gap-2 flex-shrink-0\">
                        {activity.amount && (
                          <Badge variant=\"outline\" className=\"text-xs border-white/20 text-white/70\">
                            ₹{activity.amount.toFixed(2)}
                          </Badge>
                        )}
                        <span className=\"text-xs text-white/50 flex items-center gap-1\">
                          <Clock className=\"w-3 h-3\" />
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div className=\"mt-1\">
                      <p className=\"text-white/80 text-sm\">
                        <span className=\"font-medium\">{activity.description}</span>
                        {activity.title && (
                          <span className=\"text-white/60\"> • {activity.title}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LiveGroupActivityFeed;