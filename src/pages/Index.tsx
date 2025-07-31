import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Heart } from "lucide-react";
import { ConnectButton } from "@/components/ConnectButton";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { Settings } from "@/components/Settings";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SupportPerson {
  id: string;
  name: string;
  phoneNumber: string;
  relationship?: string;
  isActive: boolean;
}

interface ReachOutEvent {
  timestamp: Date;
  contactsNotified: string[];
  message: string;
}

const Index = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [supportNetwork, setSupportNetwork] = useState<SupportPerson[]>([]);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [reachOutHistory, setReachOutHistory] = useState<ReachOutEvent[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedOnboarding = localStorage.getItem('connect-button-onboarding');
    const savedNetwork = localStorage.getItem('connect-button-network');
    const savedMessage = localStorage.getItem('connect-button-message');
    const savedHistory = localStorage.getItem('connect-button-history');

    if (savedOnboarding === 'completed') {
      setHasCompletedOnboarding(true);
    }

    if (savedNetwork) {
      try {
        setSupportNetwork(JSON.parse(savedNetwork));
      } catch (error) {
        console.error('Error loading support network:', error);
      }
    }

    if (savedMessage) {
      setMessageTemplate(savedMessage);
    }

    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setReachOutHistory(history.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        })));
      } catch (error) {
        console.error('Error loading reach out history:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (hasCompletedOnboarding) {
      localStorage.setItem('connect-button-onboarding', 'completed');
    }
  }, [hasCompletedOnboarding]);

  useEffect(() => {
    localStorage.setItem('connect-button-network', JSON.stringify(supportNetwork));
  }, [supportNetwork]);

  useEffect(() => {
    localStorage.setItem('connect-button-message', messageTemplate);
  }, [messageTemplate]);

  useEffect(() => {
    localStorage.setItem('connect-button-history', JSON.stringify(reachOutHistory));
  }, [reachOutHistory]);

  const handleOnboardingComplete = (network: SupportPerson[], message: string) => {
    setSupportNetwork(network);
    setMessageTemplate(message);
    setHasCompletedOnboarding(true);
    
    toast({
      title: "Welcome to Connect Button",
      description: "You're all set up. Your support network is just one tap away.",
      className: "bg-accent text-accent-foreground",
    });
  };

  const handleReachOut = async (contacts: SupportPerson[], message: string) => {
    try {
      // Call the Supabase edge function to send actual messages
      const { data, error } = await supabase.functions.invoke('send-support-message', {
        body: {
          contacts: contacts,
          message: message,
          senderName: 'Someone who needs support' // You could make this customizable
        }
      });

      if (error) {
        console.error('Error sending messages:', error);
        throw error;
      }

      console.log('Messages sent successfully:', data);

      // Record this reach-out event
      const newEvent: ReachOutEvent = {
        timestamp: new Date(),
        contactsNotified: contacts.map(c => c.name),
        message: message
      };

      setReachOutHistory(prev => [newEvent, ...prev].slice(0, 10)); // Keep last 10 events

    } catch (error) {
      console.error('Failed to send support messages:', error);
      throw error;
    }
  };

  const getEncouragingMessage = () => {
    const messages = [
      "It's okay to need people",
      "Asking for help is brave", 
      "You matter to someone",
      "This feeling will pass",
      "You're not alone"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  if (showSettings) {
    return (
      <Settings
        supportNetwork={supportNetwork}
        messageTemplate={messageTemplate}
        onUpdateNetwork={setSupportNetwork}
        onUpdateMessage={setMessageTemplate}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <Heart className="w-6 h-6 text-primary" />
          <span className="text-lg font-medium text-foreground">Connect Button</span>
        </div>
        <Button
          onClick={() => setShowSettings(true)}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <SettingsIcon className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 space-y-8">
        <ConnectButton
          supportNetwork={supportNetwork}
          messageTemplate={messageTemplate}
          onReachOut={handleReachOut}
        />

        {/* Encouraging Message */}
        <div className="text-center max-w-sm">
          <p className="text-muted-foreground text-sm font-medium">
            {getEncouragingMessage()}
          </p>
        </div>

        {/* Support Network Preview */}
        {supportNetwork.filter(c => c.isActive).length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Ready to contact: {supportNetwork.filter(c => c.isActive).map(c => c.name).join(", ")}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Remember: Your struggles are valid, and help is always available
        </p>
      </footer>
    </div>
  );
};

export default Index;
