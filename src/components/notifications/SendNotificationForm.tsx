import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send, Search, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  display_name: string;
  email?: string;
  avatar_url?: string;
  phone?: string;
}

type NotificationType =
  | 'support_message'
  | 'check_in'
  | 'milestone'
  | 'sponsor_message';
type NotificationPriority = 'low' | 'normal' | 'high';

export const SendNotificationForm: React.FC = () => {
  const { sendNotification } = useNotifications();
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searching, setSearching] = useState(false);
  const [type, setType] = useState<NotificationType>('support_message');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<NotificationPriority>('normal');

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, email, avatar_url, phone')
        .or(`display_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(5);

      setSearchResults(data || []);
      setSearching(false);
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !title || !message) {
      return;
    }

    setSending(true);
    const success = await sendNotification(
      selectedUser.id,
      type,
      title,
      message,
      priority
    );

    if (success) {
      // Reset form
      setSelectedUser(null);
      setSearchTerm('');
      setTitle('');
      setMessage('');
      setPriority('normal');
    }
    setSending(false);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchTerm('');
    setSearchResults([]);
  };

  const getTypeEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      support_message: '💬',
      check_in: '💙',
      milestone: '🎉',
      sponsor_message: '🤝',
    };
    return emojis[type] || '📬';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Support Message</CardTitle>
        <CardDescription>
          Send an encouraging message to someone in your recovery network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Search */}
          <div>
            <Label htmlFor="recipient">To</Label>
            {selectedUser ? (
              <div className="flex items-center gap-2 mt-1 p-2 border rounded-md bg-accent">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback>
                    {selectedUser.display_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedUser.display_name}</p>
                  {selectedUser.email && (
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedUser(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="recipient"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or email..."
                    className="pl-9"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                </div>
                
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
                        onClick={() => handleSelectUser(user)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.display_name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.display_name}</p>
                          {user.email && (
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Message Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Message Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support_message">
                    <span className="flex items-center gap-2">
                      {getTypeEmoji('support_message')} Support Message
                    </span>
                  </SelectItem>
                  <SelectItem value="check_in">
                    <span className="flex items-center gap-2">
                      {getTypeEmoji('check_in')} Check-in
                    </span>
                  </SelectItem>
                  <SelectItem value="milestone">
                    <span className="flex items-center gap-2">
                      {getTypeEmoji('milestone')} Milestone
                    </span>
                  </SelectItem>
                  <SelectItem value="sponsor_message">
                    <span className="flex items-center gap-2">
                      {getTypeEmoji('sponsor_message')} Sponsor Message
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <Badge variant="secondary">Low</Badge>
                  </SelectItem>
                  <SelectItem value="normal">
                    <Badge variant="default">Normal</Badge>
                  </SelectItem>
                  <SelectItem value="high">
                    <Badge className="bg-orange-500">High</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Subject</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${getTypeEmoji(type)} Your message subject...`}
              disabled={!selectedUser}
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your supportive message here..."
              rows={5}
              disabled={!selectedUser}
            />
          </div>

          <Button 
            type="submit" 
            disabled={!selectedUser || !title || !message || sending} 
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

