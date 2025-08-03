import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationService } from "@/lib/notificationService";

export function CrisisAlert() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  async function sendCrisisAlert() {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Send crisis alert using the notification service
      await NotificationService.sendCrisisAlert(user.id, message);

      toast({
        title: "Crisis Alert Sent",
        description: "Your support network has been notified",
      });

      // Navigate back after short delay
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error("Error sending crisis alert:", error);
      toast({
        title: "Error",
        description: "Failed to send crisis alert",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-6 w-6" />
            Send Crisis Alert
          </CardTitle>
          <CardDescription>
            This will immediately notify your entire support network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">
              <strong>Important:</strong> Crisis alerts are for urgent situations only.
              Your support network will receive immediate notifications via app and SMS.
            </p>
          </div>

          <Textarea
            placeholder="What's happening? How can your support network help?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              disabled={sending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={sendCrisisAlert}
              disabled={sending || !message.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {sending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Alert
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Need immediate help?</p>
            <div className="space-y-2">
              <Button
                variant="link"
                onClick={() => (window.location.href = "tel:988")}
                className="text-blue-600"
              >
                Call 988 (Suicide & Crisis Lifeline)
              </Button>
              <Button
                variant="link"
                onClick={() => (window.location.href = "tel:911")}
                className="text-blue-600 block"
              >
                Call 911 (Emergency)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CrisisAlert;
