import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId?: string;
  recipientName?: string;
}

export function SendMessageDialog({
  open,
  onOpenChange,
  recipientId,
  recipientName,
}: SendMessageDialogProps) {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("support");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // If no specific recipient, send to all support network members
      if (!recipientId) {
        // Get support network
        const { data: supportNetwork, error: networkError } = await supabase
          .from('support_network')
          .select('supporter_id')
          .eq('user_id', user.id);

        if (networkError || !supportNetwork || supportNetwork.length === 0) {
          throw new Error('No support network members found');
        }

        // Create notifications for each support member
        const notifications = supportNetwork.map(member => ({
          recipient_id: member.supporter_id,
          sender_id: user.id,
          type: messageType,
          title: messageType === 'check_in' ? 'Check-in Message' : 'Support Message',
          message: message,
          priority: 'normal',
          data: {
            message_type: messageType,
            timestamp: new Date().toISOString()
          }
        }));

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) throw notificationError;

        toast({
          title: "Success",
          description: `Message sent to ${supportNetwork.length} support network member(s)`,
        });
      } else {
        // Send to specific recipient
        const { error } = await supabase
          .from('notifications')
          .insert({
            recipient_id: recipientId,
            sender_id: user.id,
            type: messageType,
            title: messageType === 'check_in' ? 'Check-in Message' : 'Support Message',
            message: message,
            priority: 'normal',
            data: {
              message_type: messageType,
              timestamp: new Date().toISOString()
            }
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: `Message sent to ${recipientName || 'recipient'}`,
        });
      }

      // Reset form and close dialog
      setMessage("");
      setMessageType("support");
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Message
          </DialogTitle>
          <DialogDescription>
            {recipientName 
              ? `Send a message to ${recipientName}`
              : "Send a message to your support network"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="message-type">Message Type</Label>
            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger id="message-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="support">Support Message</SelectItem>
                <SelectItem value="check_in">Check-in</SelectItem>
                <SelectItem value="update">Update</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-[120px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending || !message.trim()}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}