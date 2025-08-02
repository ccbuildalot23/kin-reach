import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationService } from '@/lib/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { NotificationItem } from './NotificationItem';
import { Loader2, CheckCheck, Bell } from 'lucide-react';

interface NotificationListProps {
  onNotificationRead?: () => void;
  onMarkAllRead?: () => Promise<void> | void;
  onClose?: () => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  onNotificationRead,
  onMarkAllRead,
  onClose,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
  }, [user?.id]);

  const fetchNotifications = async (loadMore = false) => {
    if (!user?.id) return;

    setLoading(true);
    const currentOffset = loadMore ? offset : 0;
    const data = await NotificationService.getUserNotifications(
      user.id,
      limit,
      currentOffset
    );

    if (loadMore) {
      setNotifications(prev => [...prev, ...data]);
    } else {
      setNotifications(data);
    }

    setHasMore(data.length === limit);
    setOffset(currentOffset + data.length);
    setLoading(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await NotificationService.markAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
    onNotificationRead?.();
  };

  const handleLoadMore = () => {
    fetchNotifications(true);
  };

  const handleMarkAllClick = async () => {
    await onMarkAllRead?.();
    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllClick}
            className="text-xs"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No notifications yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            You'll see alerts, check-ins, and messages here
          </p>
        </div>
      ) : (
        <>
          <ScrollArea className="h-[400px]">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onClick={() => onClose?.()}
              />
            ))}

            {hasMore && (
              <div className="p-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more'
                  )}
                </Button>
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => {
                window.location.href = '/settings/notifications';
                onClose?.();
              }}
            >
              Notification settings
            </Button>
          </div>
        </>
      )}
    </>
  );
};

