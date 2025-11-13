import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Bell, 
  Check, 
  X, 
  Users, 
  CreditCard, 
  MessageSquare, 
  UserPlus,
  TrendingUp,
  Calendar,
  Settings,
  Filter,
  MoreHorizontal,
  Loader2,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Send,
  Shield,
  Gift,
  AlertCircle as AlertCircleIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import withLayout from "@/components/withLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";


const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  
  // Use the new wallet notifications hook
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      // Wallet-specific notifications
      case 'wallet_transfer_sent':
        return <Send className={iconClass} />;
      case 'wallet_transfer_received':
        return <ArrowDownRight className={iconClass} />;
      case 'wallet_topup':
      case 'wallet_topup_success':
        return <Plus className={iconClass} />;
      case 'wallet_topup_failed':
        return <AlertCircleIcon className={iconClass} />;
      case 'low_balance_alert':
        return <AlertCircleIcon className={iconClass} />;
      case 'high_transaction_alert':
      case 'daily_limit_alert':
      case 'monthly_limit_alert':
        return <TrendingUp className={iconClass} />;
      case 'wallet_security_alert':
      case 'pin_changed':
        return <Shield className={iconClass} />;
      case 'cashback_received':
      case 'reward_earned':
        return <Gift className={iconClass} />;
      // Original notifications
      case 'expense_added':
      case 'expense_updated':
        return <TrendingUp className={iconClass} />;
      case 'payment_request':
      case 'payment_received':
      case 'payment_completed':
        return <CreditCard className={iconClass} />;
      case 'group_invite':
      case 'group_joined':
      case 'group_left':
        return <Users className={iconClass} />;
      case 'account_security':
        return <Settings className={iconClass} />;
      case 'balance_reminder':
      case 'settlement_reminder':
      case 'budget_alert':
      case 'goal_achieved':
        return <Calendar className={iconClass} />;
      default: 
        return <Bell className={iconClass} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      // Wallet-specific notifications
      case 'wallet_transfer_sent':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'wallet_transfer_received':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'wallet_topup':
      case 'wallet_topup_success':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'wallet_topup_failed':
        return 'bg-red-500/10 text-red-600 border-red-200';
      case 'low_balance_alert':
        return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'high_transaction_alert':
      case 'daily_limit_alert':
      case 'monthly_limit_alert':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'wallet_security_alert':
      case 'pin_changed':
        return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'cashback_received':
      case 'reward_earned':
        return 'bg-pink-500/10 text-pink-600 border-pink-200';
      // Original notifications
      case 'expense_added':
      case 'expense_updated':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'payment_request':
      case 'payment_received':
      case 'payment_completed':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'group_invite':
      case 'group_joined':
      case 'group_left':
        return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'account_security':
        return 'bg-gray-500/10 text-gray-600 border-gray-200';
      case 'balance_reminder':
      case 'settlement_reminder':
      case 'budget_alert':
      case 'goal_achieved':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      default: 
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const formatTimestamp = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification._id);
    
    // Navigate based on notification type and data
    if (notification.data?.groupId) {
      navigate(`/group/${notification.data.groupId}`);
    } else if (notification.type === 'expense_added' || notification.type === 'expense_updated' || 
               notification.type.startsWith('payment') || notification.type.includes('settlement')) {
      navigate('/wallet');
    }
  };

  const filterNotifications = (notifications: any[], filter: string) => {
    switch (filter) {
      case 'unread': return notifications.filter(n => !n.isRead);
      case 'actions': return notifications.filter(n => n.priority === 'high' || n.priority === 'urgent');
      case 'payments': return notifications.filter(n => 
        n.type.includes('payment') || 
        n.type.includes('settlement') || 
        n.type === 'expense_added' || 
        n.type === 'expense_updated'
      );
      case 'groups': return notifications.filter(n => 
        n.type.includes('group') || 
        n.type === 'group_invite' || 
        n.type === 'group_joined' || 
        n.type === 'group_left'
      );
      default: return notifications;
    }
  };

  const actionCount = notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <Bell className="w-12 h-12 mx-auto opacity-50" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Notifications</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="hover:bg-accent/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveTab('all')}>
                  All Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('unread')}>
                  Unread Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('actions')}>
                  Action Required
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('payments')}>
                  Payments
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('groups')}>
                  Groups
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" size="sm">
                <Check className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="text-xs">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">
              Actions ({actionCount})
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs">
              Payments
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-xs">
              Groups
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Notifications List */}
      <main className="p-4 max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {['all', 'unread', 'actions', 'payments', 'groups'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-3">
                  {filterNotifications(notifications, tab).length === 0 ? (
                    <Card className="p-8 text-center">
                      <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No notifications</h3>
                      <p className="text-muted-foreground">
                        {tab === 'unread' ? "All caught up! You don't have any unread notifications." :
                         tab === 'actions' ? "No actions required at the moment." :
                         "You'll see notifications here when there's activity."}
                      </p>
                    </Card>
                  ) : (
                    filterNotifications(notifications, tab).map((notification) => (
                      <Card
                        key={notification._id}
                        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          !notification.isRead ? 'border-l-4 border-l-primary bg-primary/5' : 'hover:bg-accent/50'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`p-2 rounded-lg border ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-foreground/80'}`}>
                                {notification.title}
                              </h3>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {(notification.priority === 'high' || notification.priority === 'urgent') && (
                                  <Badge variant="destructive" className="text-xs">
                                    Action Required
                                  </Badge>
                                )}
                                {!notification.isRead && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {!notification.isRead && (
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); markAsRead(notification._id); }}>
                                        <Check className="w-4 h-4 mr-2" />
                                        Mark as read
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }}
                                      className="text-destructive"
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>

                            {/* User info and amount */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {notification.data?.userName && (
                                  <div className="flex items-center gap-1">
                                    <Avatar className="w-4 h-4">
                                      <AvatarImage src={notification.data?.avatar} />
                                      <AvatarFallback className="text-xs bg-gradient-success text-white">
                                        {notification.data.userName.split(' ').map((n: string) => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{notification.data.userName}</span>
                                  </div>
                                )}
                                {notification.data?.groupName && (
                                  <Badge variant="outline" className="text-xs">
                                    {notification.data.groupName}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {notification.data?.amount && (
                                  <span className="font-medium text-foreground">
                                    ${notification.data.amount.toFixed(2)}
                                  </span>
                                )}
                                <span>{formatTimestamp(notification.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default withLayout(Notifications, { defaultMode: 'group', defaultSubNav: 'home' });