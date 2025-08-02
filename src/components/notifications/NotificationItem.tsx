import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { CheckCheck, Bell } from 'lucide-react';

interface NotificationItemProps {
  notification: any;
  onMarkAsRead?: (id: string) => void;
  onClick?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onClick,
}) => {
  const { id, title, message, created_at, read_at, sender } = notification;

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead?.(id);
  };

  return (
    <div
      className={cn(
        'flex w-full gap-3 p-4 text-left hover:bg-accent cursor-pointer',
        !read_at && 'bg-muted'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <Avatar className="h-8 w-8">
        {sender?.avatar_url ? (
          <AvatarImage src={sender.avatar_url} alt={sender.display_name} />
        ) : (
          <AvatarFallback>
            {sender?.display_name?.[0] || <Bell className="h-4 w-4" />}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        {message && (
          <p className="text-sm text-muted-foreground line-clamp-2">{message}</p>
        )}
        {created_at && (
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
          </p>
        )}
      </div>
      {!read_at && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={handleMarkRead}
          aria-label="Mark as read"
        >
          <CheckCheck className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

