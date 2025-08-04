import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ArrowLeft, Send, Heart, Phone, MessageCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationService } from "@/lib/notificationService";
import { FloatingCrisisButton } from "@/components/FloatingCrisisButton";
import { BreathingExercise } from "@/components/BreathingExercise";

export function CrisisAlert() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showBreathing, setShowBreathing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const messageTemplates = [
    { id: 'safe', text: "I'm safe but struggling right now", icon: Shield, color: 'blue' },
    { id: 'help', text: "I need immediate help", icon: AlertTriangle, color: 'red' },
    { id: 'call', text: "Can someone please call me?", icon: Phone, color: 'purple' },
    { id: 'talk', text: "I need someone to talk to", icon: MessageCircle, color: 'green' },
    { id: 'thoughts', text: "I'm having thoughts of using", icon: Heart, color: 'orange' },
  ];

  async function sendCrisisAlert() {
    if (!message.trim() && !selectedTemplate) {
      toast({
        title: "Share what's happening",
        description: "Your support team wants to help. Use a template or write your own message.",
        className: "bg-amber-100 text-amber-900 border-amber-200",
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
      const finalMessage = selectedTemplate ? 
        messageTemplates.find(t => t.id === selectedTemplate)?.text || message :
        message;
      await NotificationService.sendCrisisAlert(user.id, finalMessage);

      // Show breathing exercise while processing
      setShowBreathing(true);
      
      toast({
        title: "💙 Help is on the way",
        description: "Your support team has been notified. You're not alone.",
        className: "bg-green-100 text-green-900 border-green-200",
      });

      // Navigate back after short delay
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error("Error sending crisis alert:", error);
      toast({
        title: "Let's try again",
        description: "Sometimes things don't work, but you're still brave for trying.",
        className: "bg-amber-100 text-amber-900 border-amber-200",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <FloatingCrisisButton />
      <BreathingExercise isOpen={showBreathing} onClose={() => setShowBreathing(false)} />
      
      <div className="container max-w-2xl mx-auto py-6 space-y-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to safety
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowBreathing(true)}
            className="text-purple-600 border-purple-300"
          >
            <Heart className="h-4 w-4 mr-2" />
            Breathe
          </Button>
        </div>

        {/* Supportive Header Message */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            You're brave for reaching out 💙
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your support team is here for you, no matter what
          </p>
        </div>

        {/* Pre-written Message Templates */}
        <Card className="border-purple-200 bg-white/90 dark:bg-gray-800/90 backdrop-blur mb-6">
          <CardHeader>
            <CardTitle className="text-purple-700 dark:text-purple-400">
              Quick Messages
            </CardTitle>
            <CardDescription>
              Tap to select or write your own below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {messageTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setMessage(template.text);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                      selectedTemplate === template.id
                        ? `border-${template.color}-500 bg-${template.color}-50 dark:bg-${template.color}-900/20`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className={"h-5 w-5 text-" + template.color + "-600"} />
                    <span className="font-medium">{template.text}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-white/90 dark:bg-gray-800/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
              Your Crisis Message
            </CardTitle>
            <CardDescription>
              Your entire support team will be notified immediately
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                <strong>Remember:</strong> Asking for help is a sign of strength, not weakness.
                Your support team cares about you and wants to help.
              </p>
            </div>

            <Textarea
              placeholder="Share what's on your heart... (or use a quick message above)"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setSelectedTemplate(null); // Clear template selection if user types
              }}
              rows={4}
              className="resize-none border-purple-200 focus:border-purple-400"
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                disabled={sending}
                className="flex-1 border-gray-300"
              >
                I'm okay for now
              </Button>
              <Button
                onClick={sendCrisisAlert}
                disabled={sending || (!message.trim() && !selectedTemplate)}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              >
                {sending ? (
                  <div className="flex items-center justify-center">
                    <Heart className="h-4 w-4 mr-2 animate-pulse" />
                    Notifying your team...
                  </div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to Support Team
                  </>
                )}
              </Button>
            </div>

            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Need someone right now?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "tel:988")}
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call 988
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "sms:741741?body=HOME")}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Text HOME
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Emergency? Call 911
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Encouraging Message */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardContent className="p-6 text-center">
            <Heart className="h-12 w-12 text-purple-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-purple-700 dark:text-purple-300">
              "The darkest nights produce the brightest stars"
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
              You're taking the right step by reaching out
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CrisisAlert;
