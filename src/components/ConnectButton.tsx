import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Send, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SupportPerson {
  id: string;
  name: string;
  phoneNumber: string;
  relationship?: string;
  isActive: boolean;
}

interface ConnectButtonProps {
  supportNetwork: SupportPerson[];
  messageTemplate: string;
  onReachOut: (contacts: SupportPerson[], message: string) => void;
}

type ButtonState = 'ready' | 'sending' | 'sent';

export const ConnectButton = ({ supportNetwork, messageTemplate, onReachOut }: ConnectButtonProps) => {
  const [buttonState, setButtonState] = useState<ButtonState>('ready');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (buttonState === 'sent' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && buttonState === 'sent') {
      setButtonState('ready');
    }
  }, [buttonState, countdown]);

  const handleReachOut = async () => {
    const activeContacts = supportNetwork.filter(contact => contact.isActive);
    
    if (activeContacts.length === 0) {
      toast({
        title: "Add someone who cares about you",
        description: "Go to Settings to add your support network first.",
        variant: "destructive",
      });
      return;
    }

    if (buttonState === 'sent') {
      toast({
        title: "Already sent",
        description: "Your people are on their way. Give them a moment to respond.",
      });
      return;
    }

    setButtonState('sending');
    
    try {
      // Simulate sending delay for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onReachOut(activeContacts, messageTemplate);
      
      setButtonState('sent');
      setCountdown(60); // 60 second cooldown
      
      toast({
        title: "✓ Your people have been notified",
        description: `Help is on the way. You're not alone. Contacted: ${activeContacts.map(c => c.name).join(", ")}`,
        className: "bg-accent text-accent-foreground",
      });
      
    } catch (error) {
      setButtonState('ready');
      toast({
        title: "The message didn't go through",
        description: "But you took the brave step of trying. Try again?",
        variant: "destructive",
      });
    }
  };

  const getButtonText = () => {
    switch (buttonState) {
      case 'sending':
        return 'Connecting...';
      case 'sent':
        return `Sent (${countdown}s)`;
      default:
        return 'REACH OUT';
    }
  };

  const getButtonIcon = () => {
    switch (buttonState) {
      case 'sending':
        return <Send className="w-8 h-8" />;
      case 'sent':
        return <CheckCircle className="w-8 h-8" />;
      default:
        return <Heart className="w-8 h-8" />;
    }
  };

  const getSubtext = () => {
    switch (buttonState) {
      case 'sending':
        return `Sending love to ${supportNetwork.filter(c => c.isActive).map(c => c.name).join(", ")}...`;
      case 'sent':
        return "Help is on the way. You're not alone.";
      default:
        return "Your people are here for you";
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <Button
        onClick={handleReachOut}
        disabled={buttonState === 'sending'}
        className={cn(
          "connect-button w-64 h-64 rounded-full text-white text-2xl font-bold",
          "flex flex-col items-center justify-center space-y-3",
          "border-0 outline-none focus:ring-4 focus:ring-primary/30",
          buttonState === 'sending' && 'sending',
          buttonState === 'sent' && 'sent'
        )}
      >
        {getButtonIcon()}
        <span>{getButtonText()}</span>
      </Button>
      
      <p className="text-center text-muted-foreground text-lg max-w-sm">
        {getSubtext()}
      </p>
      
      {buttonState === 'ready' && supportNetwork.length === 0 && (
        <p className="text-center text-sm text-muted-foreground max-w-sm">
          Add your support network in Settings to get started
        </p>
      )}
    </div>
  );
};