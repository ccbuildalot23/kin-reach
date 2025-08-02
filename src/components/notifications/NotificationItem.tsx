import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertCircle,
  Heart,
  MessageCircle,
  Trophy,
  Info,
  Users,
  Calendar,
} from 'lucide-react';

const notificationIcons = {
  crisis_alert: AlertCircle,
  check_in: Heart,
  milestone: Trophy,
  support_message: MessageCircle,
  system: Info,
  sponsor_message: Users,
  meeting_reminder: Calendar,
};

const notificationColors = {
  crisis_alert: 'text-red-500 bg-red-50',
  check_in: 'text-blue-500 bg-blue-50',
  milestone: 'text-green-500 bg-green-50',
  support_message: 'text-purple-500 bg-purple-50',
  system: 'text-gray-500 bg-gray-50',
  sponsor_message: 'text-indigo-500 bg-indigo-50',
  meeting_reminder: 'text-orange-500 bg-orange-50',
};

const priorityIndicators = {
  low: null,
  normal: null,
  high: 'border-l-4 border-l-orange-400',
  urgent: 'border-l-4 border-l-red-500 animate-pulse-subtle',
};

interface Notification {
  id: string;
  title: string;
  message?: string;
  created_at: string;
  read_at?: string | null;
  type: keyof typeof notificationIcons | string;
  priority?: keyof typeof priorityIndicators;
  sender?: {
    avatar_url?: string;
    display_name?: string;
  };
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClick?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onClick,
}) => {
  const Icon =
    notificationIcons[notification.type as keyof typeof notificationIcons] || Info;
  const colorClasses =
    notificationColors[
      notification.type as keyof typeof notificationColors
    ] || 'text-gray-500 bg-gray-50';
  const priorityClass =
    priorityIndicators[
      notification.priority as keyof typeof priorityIndicators
    ];

  const handleClick = () => {
    if (!notification.read_at) {
      onMarkAsRead(notification.id);
    }
    onClick?.();
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        'flex gap-3 p-4 hover:bg-accent cursor-pointer transition-all duration-200',
        !notification.read_at && 'bg-accent/50',
        priorityClass,
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0">
        {notification.sender ? (
          <Avatar className="h-10 w-10">
            <AvatarImage src={notification.sender.avatar_url} />
            <AvatarFallback className="bg-primary/10">
              {notification.sender.display_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center',
              colorClasses,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p
              className={cn(
                'font-medium text-sm',
                !notification.read_at && 'font-semibold',
              )}
            >
              {notification.title}
            </p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {notification.message}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
              {notification.priority === 'urgent' && (
                <span className="text-xs text-red-600 font-medium">Urgent</span>
              )}
              {notification.priority === 'high' && (
                <span className="text-xs text-orange-600 font-medium">
                  High Priority
                </span>
              )}
            </div>
          </div>

          {!notification.read_at && (
            <div className="flex-shrink-0 mt-1">
              <div className="w-2 h-2 bg-primary rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

