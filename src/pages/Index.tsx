import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, AlertCircle, Send, LogOut, Heart, Calendar, MessageSquare, Trophy, Sparkles, Phone, Users } from 'lucide-react';
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { Settings } from "@/components/Settings";
import { CrisisButton } from "@/components/CrisisButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { supportModes } from "@/constants/supportModes";
import { FloatingCrisisButton } from "@/components/FloatingCrisisButton";
import { BreathingExercise } from "@/components/BreathingExercise";
import { Card, CardContent } from "@/components/ui/card";
import { format, differenceInDays } from 'date-fns';
import { cn } from "@/lib/utils";

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
  const [showBreathing, setShowBreathing] = useState(false);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [cleanDate, setCleanDate] = useState<Date | null>(null);

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
      title: "Welcome to your recovery journey",
      description: "You've taken a brave step. Your support team is here for you.",
      className: "bg-purple-100 text-purple-900 border-purple-200",
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
          title: "Let's build your support team",
          description: "Visit Settings to add people who care about you.",
          className: "bg-blue-100 text-blue-900 border-blue-200",
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
        title: "💙 Your support team has been notified",
        description: `${supportMembers.length} caring souls know you need them. You're not alone.`,
        className: "bg-green-100 text-green-900 border-green-200",
      });
      
    } catch (error) {
      console.error('Failed to send support request:', error);
      setButtonState('ready');
      toast({
        title: "Let's try again together",
        description: "Sometimes technology hiccups, but your courage doesn't. Try once more?",
        className: "bg-amber-100 text-amber-900 border-amber-200",
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

  const getDaysClean = () => {
    if (!cleanDate) return 0;
    return differenceInDays(new Date(), cleanDate);
  };

  const getMilestoneMessage = () => {
    const days = getDaysClean();
    if (days === 0) return "Day 1 - The bravest day";
    if (days === 1) return "24 hours - You did it!";
    if (days === 7) return "1 week - Keep going!";
    if (days === 30) return "30 days - Amazing progress!";
    if (days === 90) return "90 days - You're inspiring!";
    if (days === 365) return "1 year - Incredible journey!";
    if (days > 365) return Math.floor(days / 365) + " years - Living proof of recovery";
    return days + " days - One day at a time";
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
    )}>
      {/* Floating Crisis Button */}
      <FloatingCrisisButton userId={user?.id || ''} />
      
      {/* Breathing Exercise Modal */}
      <BreathingExercise isOpen={showBreathing} onClose={() => setShowBreathing(false)} />
      
      {/* Floating gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-30 animate-pulse",
          darkMode ? "bg-gradient-to-br from-purple-700 to-pink-800" : "bg-gradient-to-br from-purple-200 to-pink-300"
        )}></div>
        <div className={cn(
          "absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse",
          darkMode ? "bg-gradient-to-br from-blue-700 to-cyan-800" : "bg-gradient-to-br from-blue-200 to-cyan-300"
        )}></div>
      </div>

      <div className="max-w-md mx-auto relative z-10">
        {/* Header with Controls */}
        <div className="flex justify-between items-center mb-6 pt-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Serenity
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={cn("p-2 rounded-lg shadow-md", darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-700')}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={signOut}
              className={cn("p-2 rounded-lg shadow-md transition-colors", darkMode ? 'bg-gray-800 text-gray-400 hover:text-red-400' : 'bg-white text-gray-700 hover:text-red-600')}
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Recovery Progress Card */}
        {cleanDate && (
          <Card className={cn("mb-6 backdrop-blur-sm border-purple-200", darkMode ? 'bg-gray-800/80' : 'bg-white/80')}>
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h2 className="text-4xl font-bold text-purple-600 mb-2">{getDaysClean()}</h2>
              <p className="text-lg font-medium text-purple-700 dark:text-purple-400">
                {getMilestoneMessage()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Clean since {format(cleanDate, 'MMMM d, yyyy')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* How are you feeling check-in */}
        <div className={cn("backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6", darkMode ? 'bg-gray-800/80' : 'bg-white/80')}>
          <h2 className={cn("text-xl font-semibold text-center mb-4", darkMode ? 'text-gray-100' : 'text-gray-800')}>
            How are you feeling right now?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setCurrentMood('struggling'); setShowConfirmation(true); }}
              className="p-4 rounded-xl bg-gradient-to-br from-red-400 to-pink-500 text-white hover:shadow-lg transition-all transform hover:scale-105"
            >
              <AlertCircle className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">I'm struggling</span>
            </button>
            <button
              onClick={() => navigate('/support-team')}
              className="p-4 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 text-white hover:shadow-lg transition-all transform hover:scale-105"
            >
              <Users className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">I need someone</span>
            </button>
            <button
              onClick={() => toast({ title: "🎉 That's wonderful!", description: "Every win counts. You're doing amazing!", className: "bg-green-100 text-green-900 border-green-200" })}
              className="p-4 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white hover:shadow-lg transition-all transform hover:scale-105"
            >
              <Trophy className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Celebrate a win</span>
            </button>
            <button
              onClick={() => setShowBreathing(true)}
              className="p-4 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 text-white hover:shadow-lg transition-all transform hover:scale-105"
            >
              <Heart className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Just breathe</span>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={cn("backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6", darkMode ? 'bg-gray-800/80' : 'bg-white/80')}>
          <h3 className={cn("text-lg font-semibold mb-4", darkMode ? 'text-gray-100' : 'text-gray-800')}>
            Quick Support
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/crisis-alert')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <Phone className="w-5 h-5 text-red-600" />
              <span className="text-red-700 dark:text-red-400 font-medium">Crisis Support</span>
            </button>
            <button
              onClick={() => navigate('/peace-library')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <Heart className="w-5 h-5 text-purple-600" />
              <span className="text-purple-700 dark:text-purple-400 font-medium">Peace Library</span>
            </button>
            <button
              onClick={() => navigate('/support-team')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-blue-700 dark:text-blue-400 font-medium">Your Support Team</span>
            </button>
          </div>
        </div>

        {/* Daily Affirmation */}
        <Card className={cn("mb-6 backdrop-blur-sm border-purple-200", darkMode ? 'bg-gray-800/80' : 'bg-gradient-to-br from-purple-100 to-pink-100')}>
          <CardContent className="p-6 text-center">
            <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-purple-700 dark:text-purple-300 italic">
              "You survived 100% of your worst days. You're doing great."
            </p>
          </CardContent>
        </Card>

        {/* Confirmation Modal */}
        {showConfirmation && selectedMode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={cn("backdrop-blur-sm rounded-2xl shadow-lg p-8", darkMode ? 'bg-gray-800/80' : 'bg-white/80')}>
              {buttonState !== 'sent' ? (
                <>
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse", `bg-gradient-to-br ${selectedMode.gradient}`)}>
                    <selectedMode.icon className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className={cn("text-xl font-semibold text-center mb-2", darkMode ? 'text-gray-100' : 'text-gray-800')}>
                    You're doing great
                  </h3>
                  <p className={cn("text-center mb-2 italic", darkMode ? 'text-gray-400' : 'text-gray-600')}>
                    "{selectedMode.encouragement}"
                  </p>
                  <p className={cn("text-center mb-6 p-3 rounded-lg", darkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-teal-50')}>
                    We'll send: "{selectedMode.message}"
                  </p>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={sendConnection}
                      disabled={buttonState === 'sending'}
                      className={cn("w-full text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50", `bg-gradient-to-r ${selectedMode.gradient}`)}
                    >
                      {buttonState === 'sending' ? (
                        <div className="flex items-center justify-center">
                          <Send className="w-5 h-5 mr-2 animate-pulse" />
                          Connecting...
                        </div>
                       ) : (
                         <>Send Support Request 💚</>
                       )}
                    </Button>
                    <Button
                      onClick={() => setShowConfirmation(false)}
                      className={cn("w-full py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors", darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}
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
                  <p className={cn("mb-2", darkMode ? 'text-gray-300' : 'text-gray-700')}>Your support network has been notified</p>
                  <p className={cn("text-sm italic mb-4", darkMode ? 'text-gray-400' : 'text-gray-600')}>
                    Take a deep breath. Help is coming. You're not alone.
                  </p>
                  <p className="text-sm text-gray-500">
                    Ready again in {countdown}s
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recovery Quote */}
        <div className="mt-8 text-center space-y-3">
          <Button
            onClick={() => setShowSettings(true)}
            className={cn("w-full py-4 px-6 rounded-xl text-white font-medium hover:shadow-lg transition-all transform hover:scale-105", darkMode ? 'bg-gradient-to-r from-purple-700 to-pink-700' : 'bg-gradient-to-r from-purple-500 to-pink-500')}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Customize Your Recovery Journey
          </Button>
          
          <p className={cn("text-sm", darkMode ? 'text-gray-400' : 'text-gray-600')}>
            You are worthy of recovery 💜
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            Taking it one moment at a time
          </p>
        </div>
      </div>

      {/* Support Mode Selection Overlay */}
      {!showConfirmation && !selectedMode && (
        <div className="space-y-6 p-6">
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            How can we support you?
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {supportModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => { setSelectedMode(mode); setShowConfirmation(true); }}
                  className={cn("p-6 rounded-2xl text-white hover:shadow-lg transition-all transform hover:scale-105", `bg-gradient-to-br ${mode.gradient}`)}
                >
                  <div className="flex items-center gap-4">
                    <Icon className="w-8 h-8" />
                    <div className="text-left">
                      <h3 className="text-lg font-semibold">{mode.label}</h3>
                      <p className="text-sm opacity-90">{mode.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;