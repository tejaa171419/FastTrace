import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  BellOff,
  CheckCircle,
  Trash2,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Send,
  Shield,
  TrendingUp,
  Gift,
  X,
  Check,
} from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export const WalletNotificationCard = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "wallet_transfer_sent":
        return { icon: Send, color: "text-blue-500" };
      case "wallet_transfer_received":
        return { icon: ArrowDownRight, color: "text-green-500" };
      case "wallet_topup":
      case "wallet_topup_success":
        return { icon: Plus, color: "text-green-500" };
      case "wallet_topup_failed":
        return { icon: AlertCircle, color: "text-red-500" };
      case "low_balance_alert":
        return { icon: AlertCircle, color: "text-orange-500" };
      case "high_transaction_alert":
      case "daily_limit_alert":
      case "monthly_limit_alert":
        return { icon: TrendingUp, color: "text-yellow-500" };
      case "wallet_security_alert":
      case "pin_changed":
        return { icon: Shield, color: "text-purple-500" };
      case "cashback_received":
      case "reward_earned":
        return { icon: Gift, color: "text-pink-500" };
      default:
        return { icon: Bell, color: "text-muted-foreground" };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "medium":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "low":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id);
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }
    setExpandedId(expandedId === notification._id ? null : notification._id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Wallet Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Stay updated with your wallet activity
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Mark all read</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshNotifications}
              disabled={loading}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <RefreshCw
                className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 md:p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {loading && notifications.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg glass-card">
                <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <BellOff className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">
              No Notifications
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] sm:h-[500px] pr-3">
            <div className="space-y-2 sm:space-y-3">
              {notifications.map((notification) => {
                const { icon: Icon, color } = getNotificationIcon(notification.type);
                const isExpanded = expandedId === notification._id;

                return (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "relative p-3 rounded-lg glass-card border transition-all duration-300 cursor-pointer hover:bg-white/5",
                      notification.isRead
                        ? "border-white/10 opacity-75"
                        : "border-primary/30 bg-primary/5"
                    )}
                  >
                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                    )}

                    <div className="flex items-start gap-3 ml-2">
                      {/* Icon */}
                      <div
                        className={cn(
                          "p-2 sm:p-2.5 rounded-lg bg-white/5 border border-white/10 flex-shrink-0",
                          color
                        )}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-xs sm:text-sm md:text-base truncate">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[8px] sm:text-xs px-1.5 sm:px-2 py-0.5",
                                getPriorityColor(notification.priority)
                              )}
                            >
                              {notification.priority}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDelete(e, notification._id)}
                              className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mb-2">
                          {notification.message}
                        </p>

                        {/* Expanded content */}
                        {isExpanded && notification.data && (
                          <div className="mt-3 p-2 sm:p-3 rounded-lg bg-white/5 border border-white/10">
                            <pre className="text-[10px] sm:text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(notification.data, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </span>

                          {notification.action && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-[10px] sm:text-xs text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle action click
                                console.log("Action clicked:", notification.action);
                              }}
                            >
                              {notification.action.text}
                              <ArrowUpRight className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </div>

                        {/* Read status */}
                        {notification.isRead && (
                          <div className="flex items-center gap-1 mt-2">
                            <Check className="w-3 h-3 text-success" />
                            <span className="text-[10px] text-success">Read</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
