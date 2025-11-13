import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, AlertCircle, Info, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Notification Types
 */
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Notification Interface
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata?: Record<string, any>;
}

/**
 * Notification Center Props
 */
interface NotificationCenterProps {
  className?: string;
  maxNotifications?: number;
  autoCloseDelay?: number;
}

/**
 * Notification Center Component
 * Displays real-time notifications from webhooks and system events
 */
export function NotificationCenter({
  className,
  maxNotifications = 50,
  autoCloseDelay = 5000,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      setNotifications(
        parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }))
      );
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
    
    // Update unread count
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  /**
   * Add notification
   */
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limit to maxNotifications
      return updated.slice(0, maxNotifications);
    });

    // Auto-close toast after delay (only for success/info)
    if (
      (notification.type === NotificationType.SUCCESS ||
        notification.type === NotificationType.INFO) &&
      autoCloseDelay > 0
    ) {
      setTimeout(() => {
        markAsRead(newNotification.id);
      }, autoCloseDelay);
    }
  }, [maxNotifications, autoCloseDelay]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  /**
   * Mark all as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  /**
   * Remove notification
   */
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  }, []);

  /**
   * Handle notification click
   */
  const handleNotificationClick = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    if (notification.action) {
      notification.action.onClick();
    }
  }, [markAsRead]);

  /**
   * Get notification icon
   */
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case NotificationType.ERROR:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case NotificationType.WARNING:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case NotificationType.INFO:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  /**
   * Format timestamp
   */
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Expose addNotification globally for webhook events
  useEffect(() => {
    (window as any).addNotification = addNotification;
    
    return () => {
      delete (window as any).addNotification;
    };
  }, [addNotification]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-accent cursor-pointer transition-colors',
                    !notification.read && 'bg-accent/50'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </span>

                        {notification.action && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              notification.action!.onClick();
                              markAsRead(notification.id);
                            }}
                          >
                            {notification.action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Notification Helper Functions
 */
export const notifications = {
  /**
   * Show success notification
   */
  success(title: string, message: string, action?: Notification['action']) {
    if ((window as any).addNotification) {
      (window as any).addNotification({
        type: NotificationType.SUCCESS,
        title,
        message,
        action,
      });
    }
  },

  /**
   * Show error notification
   */
  error(title: string, message: string, action?: Notification['action']) {
    if ((window as any).addNotification) {
      (window as any).addNotification({
        type: NotificationType.ERROR,
        title,
        message,
        action,
      });
    }
  },

  /**
   * Show warning notification
   */
  warning(title: string, message: string, action?: Notification['action']) {
    if ((window as any).addNotification) {
      (window as any).addNotification({
        type: NotificationType.WARNING,
        title,
        message,
        action,
      });
    }
  },

  /**
   * Show info notification
   */
  info(title: string, message: string, action?: Notification['action']) {
    if ((window as any).addNotification) {
      (window as any).addNotification({
        type: NotificationType.INFO,
        title,
        message,
        action,
      });
    }
  },

  /**
   * Upload completed notification
   */
  uploadCompleted(fileName: string, reportId: string) {
    this.success(
      'Upload Completed',
      `${fileName} was uploaded successfully`,
      {
        label: 'View Report',
        onClick: () => {
          window.location.href = `/reports/${reportId}`;
        },
      }
    );
  },

  /**
   * Batch upload completed notification
   */
  batchCompleted(successCount: number, totalCount: number) {
    this.success(
      'Batch Upload Completed',
      `${successCount} of ${totalCount} files uploaded successfully`
    );
  },

  /**
   * Export completed notification
   */
  exportCompleted(format: string, fileUrl: string) {
    this.success(
      'Export Completed',
      `Your ${format.toUpperCase()} export is ready`,
      {
        label: 'Download',
        onClick: () => {
          window.location.href = fileUrl;
        },
      }
    );
  },

  /**
   * OCR completed notification
   */
  ocrCompleted(confidence: number) {
    this.success(
      'OCR Completed',
      `Text extraction completed with ${confidence}% confidence`
    );
  },

  /**
   * Processing failed notification
   */
  processingFailed(fileName: string, error: string) {
    this.error(
      'Processing Failed',
      `Failed to process ${fileName}: ${error}`,
      {
        label: 'Retry',
        onClick: () => {
          // Trigger retry
        },
      }
    );
  },
};
