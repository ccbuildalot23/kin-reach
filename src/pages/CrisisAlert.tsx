import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ArrowLeft, Send, Heart, Phone, MessageCircle, Shield, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationService } from "@/lib/notificationService";
import { sendCrisisAlert } from "@/lib/sms";
import { FloatingCrisisButton } from "@/components/FloatingCrisisButton";
import { BreathingExercise } from "@/components/BreathingExercise";
import { cn } from "@/lib/utils";

export function CrisisAlert() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showBreathing, setShowBreathing] = useState(false);
  const [sendingInApp, setSendingInApp] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const messageTemplates = [
    { id: 'safe', text: "I'm safe but struggling right now", icon: Shield, color: 'blue' },
    { id: 'help', text: "I need immediate help", icon: AlertTriangle, color: 'red' },
    { id: 'call', text: "Can someone please call me?", icon: Phone, color: 'purple' },
    { id: 'talk', text: "I need someone to talk to", icon: MessageCircle, color: 'green' },
    { id: 'thoughts', text: "I'm having thoughts of using", icon: Heart, color: 'orange' },
  ];

  async function sendInAppAlert() {
    if (!message.trim() && !selectedTemplate) {
      toast({
        title: "Share what's happening",
        description: "Your support team wants to help. Use a template or write your own message.",
        className: "bg-amber-100 text-amber-900 border-amber-200",
      });
      return;
    }

    setSendingInApp(true);
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
        description: "Your support team has been notified in-app. You're not alone.",
        className: "bg-green-100 text-green-900 border-green-200",
      });

      // Navigate back after short delay
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error("Error sending in-app crisis alert:", error);
      toast({
        title: "Let's try again",
        description: "Sometimes things don't work, but you're still brave for trying.",
        className: "bg-amber-100 text-amber-900 border-amber-200",
      });
    } finally {
      setSendingInApp(false);
    }
  }

  async function sendSMSAlert() {
    if (!message.trim() && !selectedTemplate) {
      toast({
        title: "Share what's happening",
        description: "Your support team wants to help. Use a template or write your own message.",
        className: "bg-amber-100 text-amber-900 border-amber-200",
      });
      return;
    }

    setSendingSMS(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Send SMS crisis alert
      const finalMessage = selectedTemplate ? 
        messageTemplates.find(t => t.id === selectedTemplate)?.text || message :
        message;
      const result = await sendCrisisAlert(user.id, finalMessage);

      if (result.success) {
        // Show breathing exercise while processing
        setShowBreathing(true);
        
        toast({
          title: "💙 Help is on the way",
          description: `SMS sent to ${result.contactsNotified} of ${result.totalContacts} contacts. You're not alone.`,
          className: "bg-green-100 text-green-900 border-green-200",
        });

        // Navigate back after short delay
        setTimeout(() => navigate("/"), 1500);
      } else {
        throw new Error(result.error || "Failed to send SMS");
      }
    } catch (error) {
      console.error("Error sending SMS crisis alert:", error);
      toast({
        title: "Let's try again",
        description: "Sometimes things don't work, but you're still brave for trying.",
        className: "bg-amber-100 text-amber-900 border-amber-200",
      });
    } finally {
      setSendingSMS(false);
    }
  }

  function handleCall988() {
    try {
      // Try different methods to initiate the call
      if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
        window.location.href = "tel:988";
      } else {
        // Fallback for non-secure contexts
        window.open("tel:988", "_self");
      }
      
      toast({
        title: "988 Crisis Lifeline",
        description: "Connecting you to immediate help. You're taking the right step.",
        className: "bg-blue-100 text-blue-900 border-blue-200",
      });
    } catch (error) {
      console.error("Error initiating call:", error);
      toast({
        title: "Call 988 directly",
        description: "If the call didn't start, dial 988 on your phone for immediate help.",
        className: "bg-blue-100 text-blue-900 border-blue-200",
      });
    }
  }

  function handleTextCrisis() {
    try {
      // Try to open SMS app with pre-filled message
      const smsUrl = "sms:741741?body=HOME";
      window.location.href = smsUrl;
      
      toast({
        title: "Crisis Text Line",
        description: "Opening your messaging app. Send 'HOME' to 741741 for support.",
        className: "bg-purple-100 text-purple-900 border-purple-200",
      });
    } catch (error) {
      console.error("Error opening SMS:", error);
      toast({
        title: "Text HOME to 741741",
        description: "Open your messaging app and text HOME to 741741 for crisis support.",
        className: "bg-purple-100 text-purple-900 border-purple-200",
      });
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
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left flex items-center gap-3",
                      selectedTemplate === template.id
                        ? {
                            'border-blue-500 bg-blue-50 dark:bg-blue-900/20': template.color === 'blue',
                            'border-red-500 bg-red-50 dark:bg-red-900/20': template.color === 'red',
                            'border-purple-500 bg-purple-50 dark:bg-purple-900/20': template.color === 'purple',
                            'border-green-500 bg-green-50 dark:bg-green-900/20': template.color === 'green',
                            'border-orange-500 bg-orange-50 dark:bg-orange-900/20': template.color === 'orange'
                          }
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5",
                      {
                        'text-blue-600': template.color === 'blue',
                        'text-red-600': template.color === 'red',
                        'text-purple-600': template.color === 'purple',
                        'text-green-600': template.color === 'green',
                        'text-orange-600': template.color === 'orange'
                      }
                    )} />
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

            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={sendInAppAlert}
                  disabled={sendingInApp || sendingSMS || (!message.trim() && !selectedTemplate)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {sendingInApp ? (
                    <div className="flex items-center justify-center">
                      <Heart className="h-4 w-4 mr-2 animate-pulse" />
                      Sending...
                    </div>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      Notify In-App
                    </>
                  )}
                </Button>
                <Button
                  onClick={sendSMSAlert}
                  disabled={sendingInApp || sendingSMS || (!message.trim() && !selectedTemplate)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                >
                  {sendingSMS ? (
                    <div className="flex items-center justify-center">
                      <Heart className="h-4 w-4 mr-2 animate-pulse" />
                      Sending SMS...
                    </div>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send SMS Alert
                    </>
                  )}
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                disabled={sendingInApp || sendingSMS}
                className="w-full border-gray-300"
              >
                I'm okay for now
              </Button>
            </div>

            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Need someone right now?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleCall988}
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call 988
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTextCrisis}
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
