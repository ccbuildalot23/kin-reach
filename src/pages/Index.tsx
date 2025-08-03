import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, AlertCircle, Send, LogOut, Heart } from 'lucide-react';
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { Settings } from "@/components/Settings";
import { CrisisButton } from "@/components/CrisisButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { supportModes } from "@/constants/supportModes";

interface SupportPerson {
  id: string;
  name: string;
  phoneNumber: string;
  relationship?: string;
  isActive: boolean;
}


type ButtonState = 'ready' | 'sending' | 'sent';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, isAuthenticated } = useAuth();


  // ALL HOOKS MUST BE DECLARED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [supportNetwork, setSupportNetwork] = useState<SupportPerson[]>([]);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [reachOutHistory, setReachOutHistory] = useState<any[]>([]);
  
  // New UI state
  const [selectedMode, setSelectedMode] = useState<any>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [buttonState, setButtonState] = useState<ButtonState>('ready');
  const [darkMode, setDarkMode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // ALL useEffect hooks MUST also be called before any conditional returns
  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [loading, isAuthenticated]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedOnboarding = localStorage.getItem('connect-button-onboarding');
    const savedNetwork = localStorage.getItem('connect-button-network');
    const savedMessage = localStorage.getItem('connect-button-message');
    const savedHistory = localStorage.getItem('connect-button-history');
    const savedDarkMode = localStorage.getItem('connect-button-darkmode');

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

    if (savedDarkMode === 'true') {
      setDarkMode(true);
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

  useEffect(() => {
    localStorage.setItem('connect-button-darkmode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Countdown timer for sent state
  useEffect(() => {
    if (buttonState === 'sent' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && buttonState === 'sent') {
      setButtonState('ready');
      setShowConfirmation(false);
      setSelectedMode('');
    }
  }, [buttonState, countdown]);

  // NOW we can have conditional renders after all hooks are declared
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your safe space...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to auth
  }


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



  const sendConnection = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to send support requests.",
        variant: "destructive",
      });
      return;
    }

    setButtonState('sending');
    
    try {
      // Get user's support network from database
      const { data: supportMembers, error: networkError } = await supabase
        .from('support_network')
        .select('supporter_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (networkError) {
        console.error('Error loading support network:', networkError);
        throw new Error('Failed to load support network');
      }

      if (!supportMembers || supportMembers.length === 0) {
        toast({
          title: "Add someone who cares about you",
          description: "Go to Settings to add your support network first.",
          variant: "destructive",
        });
        setButtonState('ready');
        return;
      }

      // Create notification titles based on support type
      const titles = {
        'comfort': '💙 Someone needs comfort',
        'listen': '👂 Someone needs someone to listen', 
        'guidance': '☀️ Someone needs gentle guidance',
        'presence': '✨ Someone needs presence',
        'emergency': '🚨 Emergency support needed'
      };

      const notificationTitle = titles[selectedMode.id] || 'Support request';
      const messageToSend = selectedMode.message || messageTemplate;

      // Create notifications for each support member
      const notifications = supportMembers.map((member: any) => ({
        recipient_id: member.supporter_id,
        sender_id: user.id,
        type: 'support_request',
        title: notificationTitle,
        message: messageToSend,
        priority: selectedMode.id === 'emergency' ? 'urgent' : 'high',
        data: {
          support_type: selectedMode.id,
          timestamp: new Date().toISOString(),
          encouragement: selectedMode.encouragement
        }
      }));

      const { data: createdNotifications, error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (notificationError) {
        console.error('Error creating notifications:', notificationError);
        throw new Error('Failed to send notifications');
      }

      console.log('Support notifications created:', createdNotifications);
      
      setButtonState('sent');
      setCountdown(60); // 60 second cooldown
      
      toast({
        title: "✓ Your support network has been notified",
        description: `${supportMembers.length} people are now aware you need support. Help is on the way.`,
        className: "bg-accent text-accent-foreground",
      });
      
    } catch (error) {
      console.error('Failed to send support request:', error);
      setButtonState('ready');
      toast({
        title: "The support request didn't go through",
        description: "But you took the brave step of trying. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  if (showSettings) {
    return (
      <Settings
        supportNetwork={supportNetwork}
        messageTemplate={messageTemplate}
        userId={user?.id || ''}
        onUpdateNetwork={setSupportNetwork}
        onUpdateMessage={setMessageTemplate}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50'} p-4 transition-colors duration-300`}>
      {/* Floating gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 ${darkMode ? 'bg-gradient-to-br from-teal-700 to-blue-800' : 'bg-gradient-to-br from-teal-200 to-blue-300'} rounded-full blur-3xl opacity-30 animate-pulse`}></div>
        <div className={`absolute bottom-20 right-10 w-96 h-96 ${darkMode ? 'bg-gradient-to-br from-cyan-700 to-emerald-800' : 'bg-gradient-to-br from-cyan-200 to-emerald-300'} rounded-full blur-3xl opacity-30 animate-pulse`}></div>
      </div>

      <div className="max-w-md mx-auto relative z-10">
        {/* Header with Controls */}
        <div className="flex justify-between items-center mb-6 pt-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              You're Safe Here
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-700'} shadow-md`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={signOut}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-400 hover:text-red-400' : 'bg-white text-gray-700 hover:text-red-600'} shadow-md transition-colors`}
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Welcome message */}
        <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-6`}>
          Take a deep breath. We're here for you.
        </p>

        {/* Crisis Button - Emergency variant */}
        <div className="mb-6">
          <CrisisButton userId={user?.id || ''} variant="emergency" />
        </div>

        {/* Main Content Area */}
        {!showConfirmation ? (
          <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm rounded-2xl shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold text-center mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              How can we support you today?
            </h2>
            <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6 text-sm`}>
              Remember: reaching out is an act of self-love
            </p>
            
            {/* Quick stats */}
            <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-teal-50/50'}`}>
              <p className={`text-sm text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {supportNetwork.filter((c: SupportPerson) => c.isActive).length} active contacts ready to support you
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {supportModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => { setSelectedMode(mode); setShowConfirmation(true); }}
                    className={`bg-gradient-to-br ${mode.gradient} text-white p-6 rounded-xl 
                      hover:shadow-lg transition-all transform hover:scale-105
                      focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-teal-400`}
                  >
                    <Icon className="w-8 h-8 mb-2 mx-auto" />
                    <span className="text-sm font-medium">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Confirmation Screen */
          <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm rounded-2xl shadow-lg p-8`}>
            {buttonState !== 'sent' ? (
              <>
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${selectedMode.gradient}
                  flex items-center justify-center mx-auto mb-4 animate-pulse`}>
                  <selectedMode.icon className="w-10 h-10 text-white" />
                </div>
                
                <h3 className={`text-xl font-semibold text-center mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  You're doing great
                </h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center mb-2 italic`}>
                  "{selectedMode.encouragement}"
                </p>
                <p className={`${darkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-teal-50'} text-center mb-6 p-3 rounded-lg`}>
                  We'll send: "{selectedMode.message}"
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={sendConnection}
                    disabled={buttonState === 'sending'}
                    className={`w-full bg-gradient-to-r ${selectedMode.gradient} text-white py-3 rounded-lg
                      font-medium hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50`}
                  >
                    {buttonState === 'sending' ? (
                      <div className="flex items-center justify-center">
                        <Send className="w-5 h-5 mr-2 animate-pulse" />
                        Connecting...
                      </div>
                     ) : (
                       `Send Support Request 💚`
                     )}
                  </Button>
                  <Button
                    onClick={() => setShowConfirmation(false)}
                    className={`w-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} py-3 rounded-lg
                      font-medium hover:bg-gray-200 transition-colors`}
                    disabled={buttonState === 'sending'}
                  >
                    Take a moment
                  </Button>
                </div>
              </>
            ) : (
              /* Success Message */
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full 
                  flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Heart className="w-10 h-10 text-white animate-pulse" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                  Connection sent with care
                </h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Your support network has been notified</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} italic mb-4`}>
                  Take a deep breath. Help is coming. You're not alone.
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Ready again in {countdown}s
                </p>
              </div>
            )}
          </div>
        )}


        {/* Footer */}
        <div className="mt-8 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            You are worthy of love and support 💚
          </p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            For immediate help: 988 (Crisis Lifeline) • 911 (Emergency)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;