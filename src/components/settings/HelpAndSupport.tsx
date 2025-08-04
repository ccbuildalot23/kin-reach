import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  ExternalLink, 
  AlertTriangle,
  Heart,
  Send,
  FileText,
  Video,
  Download,
  Star,
  Clock,
  Shield,
  Users,
  BookOpen,
  Loader2,
  Bell
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const emergencyContacts = [
  {
    name: "National Suicide Prevention Lifeline",
    number: "988",
    description: "24/7 crisis support",
    country: "US"
  },
  {
    name: "Crisis Text Line",
    number: "Text HOME to 741741",
    description: "Free 24/7 crisis counseling",
    country: "US"
  },
  {
    name: "SAMHSA National Helpline",
    number: "1-800-662-4357",
    description: "Mental health and substance abuse help",
    country: "US"
  },
  {
    name: "International Association for Suicide Prevention",
    number: "Visit iasp.info",
    description: "Find crisis centers worldwide",
    country: "International"
  }
];

const faqs = [
  {
    question: "How do I add someone to my support network?",
    answer: "Go to Settings > Support Network, then search for users by phone number or email. You can also invite people to join the app if they're not already using it."
  },
  {
    question: "What happens when I send a crisis alert?",
    answer: "Your support network will receive immediate notifications through the app and via SMS if enabled. They'll know you need help right away."
  },
  {
    question: "Is my data secure and private?",
    answer: "Yes, we follow HIPAA guidelines and use end-to-end encryption. Your recovery information is stored securely and only shared with people you choose."
  },
  {
    question: "How do I track my recovery progress?",
    answer: "Set your clean date in Recovery Settings to track your daily progress. You can also share milestones with your support network."
  },
  {
    question: "Can I use the app offline?",
    answer: "Yes, basic features work offline. Your data will sync when you reconnect to the internet."
  },
  {
    question: "How do I change my notification preferences?",
    answer: "Go to Settings > Alerts to customize what notifications you receive and how you receive them (in-app, SMS, email)."
  },
  {
    question: "What if I relapse?",
    answer: "Recovery is a journey with ups and downs. Use the crisis alert feature, reach out to your support network, and remember that tomorrow is a new day to try again."
  },
  {
    question: "How do I delete my account?",
    answer: "Contact our support team or use the data deletion option in Privacy Settings. We'll help you remove all your data safely."
  }
];

export function HelpAndSupport() {
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const submitFeedback = async () => {
    if (!feedbackTitle.trim() || !feedbackMessage.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a title and message for your feedback.',
        variant: 'destructive',
      });
      return;
    }

    setSubmittingFeedback(true);
    try {
      const feedback = {
        user_id: user?.id || null,
        type: feedbackType,
        title: feedbackTitle.trim(),
        message: feedbackMessage.trim(),
        contact_email: feedbackEmail.trim() || user?.email || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_feedback')
        .insert(feedback);

      if (error) {
        console.error('Error submitting feedback:', error);
        toast({
          title: 'Error',
          description: 'Failed to submit feedback. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Thank You!',
        description: 'Your feedback has been submitted. We appreciate you helping us improve the app.',
      });

      // Clear form
      setFeedbackTitle('');
      setFeedbackMessage('');
      setFeedbackEmail('');
    } catch (error) {
      console.error('Error in submitFeedback:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Emergency Resources */}
      <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 dark:text-red-200">
          <strong>In Crisis?</strong> If you're having thoughts of self-harm or suicide, please reach out for help immediately. You are not alone.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Phone className="h-5 w-5" />
            Emergency Contacts
          </CardTitle>
          <CardDescription>
            Immediate help when you need it most
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emergencyContacts.map((contact, index) => (
            <div key={index} className="flex items-start justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 dark:text-red-100">{contact.name}</h4>
                <p className="text-lg font-mono text-red-700 dark:text-red-300">{contact.number}</p>
                <p className="text-sm text-red-600 dark:text-red-400">{contact.description}</p>
                <p className="text-xs text-red-500 dark:text-red-500">{contact.country}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (contact.number.startsWith('Text')) {
                    // For text-based services, copy to clipboard
                    navigator.clipboard.writeText(contact.number);
                    toast({ title: 'Copied', description: 'Instructions copied to clipboard' });
                  } else if (contact.number.includes('iasp.info')) {
                    openExternalLink('https://www.iasp.info/resources/Crisis_Centres/');
                  } else {
                    window.location.href = `tel:${contact.number}`;
                  }
                }}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                {contact.number.includes('iasp.info') ? <ExternalLink className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Frequently Asked Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            Quick answers to common questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Getting Started
          </CardTitle>
          <CardDescription>
            Learn how to make the most of your recovery app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold">Building Your Support Network</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Learn how to add trusted people to your recovery journey and customize your support preferences.
              </p>
              <Button variant="outline" size="sm">
                <Video className="h-4 w-4 mr-2" />
                Watch Tutorial
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="h-5 w-5 text-pink-600" />
                <h4 className="font-semibold">Setting Recovery Goals</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Set your clean date, define your "why," and track meaningful milestones on your recovery path.
              </p>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Read Guide
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold">Notifications & Alerts</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Configure how and when you receive support notifications, crisis alerts, and check-in reminders.
              </p>
              <Button variant="outline" size="sm">
                <Video className="h-4 w-4 mr-2" />
                Watch Tutorial
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold">Privacy & Security</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Understand how your data is protected and customize your privacy settings for peace of mind.
              </p>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Read Guide
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Contact Support
          </CardTitle>
          <CardDescription>
            Need help? We're here to support you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Email Support</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Get help via email within 24 hours
              </p>
              <Button variant="outline" size="sm" onClick={() => window.location.href = 'mailto:support@recoveryapp.com'}>
                Send Email
              </Button>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Live Chat</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Available Mon-Fri, 9 AM - 6 PM EST
              </p>
              <Button variant="outline" size="sm">
                Start Chat
              </Button>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Response Time</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Most inquiries answered within 4 hours
              </p>
              <div className="text-xs text-muted-foreground">
                Average: 2.3 hours
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Send Feedback
          </CardTitle>
          <CardDescription>
            Help us improve your recovery experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Feedback Type</Label>
            <select
              id="feedback-type"
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="suggestion">Suggestion</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="compliment">Compliment</option>
              <option value="complaint">Complaint</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-title">Title</Label>
            <Input
              id="feedback-title"
              placeholder="Brief description of your feedback"
              value={feedbackTitle}
              onChange={(e) => setFeedbackTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">Message</Label>
            <Textarea
              id="feedback-message"
              placeholder="Tell us more about your experience, suggestions, or issues..."
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              rows={4}
            />
          </div>

          {!isAuthenticated && (
            <div className="space-y-2">
              <Label htmlFor="feedback-email">Email (optional)</Label>
              <Input
                id="feedback-email"
                type="email"
                placeholder="your.email@example.com"
                value={feedbackEmail}
                onChange={(e) => setFeedbackEmail(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                We'll only use this to follow up on your feedback if needed
              </p>
            </div>
          )}

          <Button 
            onClick={submitFeedback} 
            disabled={submittingFeedback}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {submittingFeedback ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Feedback
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resources & Downloads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Resources & Downloads
          </CardTitle>
          <CardDescription>
            Helpful resources for your recovery journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">Recovery Workbook (PDF)</span>
              </div>
              <span className="text-sm text-muted-foreground">
                A comprehensive guide to building healthy habits and maintaining sobriety
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5" />
                <span className="font-semibold">Coping Strategies Guide</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Practical techniques for managing cravings and difficult emotions
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5" />
                <span className="font-semibold">Support Network Template</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Help your loved ones understand how to best support your recovery
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="h-5 w-5" />
                <span className="font-semibold">Find Local Resources</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Locate meetings, counselors, and treatment centers in your area
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}