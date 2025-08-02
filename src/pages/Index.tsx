import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles, Phone, MessageCircle, Headphones, Volume2, Feather, Sun, Moon, Plus, X, Mail, Edit2, Trash2, AlertCircle, CheckCircle, Send, LogOut } from 'lucide-react';
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { Settings } from "@/components/Settings";
import { SMSTest } from "@/components/SMSTest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

type ButtonState = 'ready' | 'sending' | 'sent';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, isAuthenticated } = useAuth();

  // Define constants at the top of the component
  const supportModes = [
    {
      id: 'comfort',
      label: 'Need Comfort',
      icon: Heart,
      gradient: 'from-teal-400 to-blue-500',
      message: 'I could use some comfort and understanding right now',
      encouragement: 'It takes courage to reach out. You deserve support.'
    },
    {
      id: 'listen',
      label: 'Someone to Listen',
      icon: Feather,
      gradient: 'from-blue-400 to-cyan-500',
      message: 'I need someone to listen without judgment',
      encouragement: 'Your feelings are valid. Let someone be there for you.'
    },
    {
      id: 'guidance',
      label: 'Gentle Guidance',
      icon: Sun,
      gradient: 'from-emerald-400 to-teal-500',
      message: 'I could use some gentle guidance',
      encouragement: 'Asking for help is a sign of strength, not weakness.'
    },
    {
      id: 'presence',
      label: 'Just Be With Me',
      icon: Sparkles,
      gradient: 'from-cyan-400 to-blue-600',
      message: 'I just need to know someone cares',
      encouragement: 'You matter. Your presence in this world matters.'
    }
  ];

  const asmrSounds = [
    { id: 'rain', label: 'Gentle Rain', icon: '🌧️' },
    { id: 'waves', label: 'Ocean Waves', icon: '🌊' },
    { id: 'breathing', label: 'Calm Breathing', icon: '🫧' },
    { id: 'heartbeat', label: 'Heartbeat', icon: '💗' }
  ];

  // ALL HOOKS MUST BE DECLARED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [supportNetwork, setSupportNetwork] = useState<SupportPerson[]>([]);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [reachOutHistory, setReachOutHistory] = useState<ReachOutEvent[]>([]);
  
  // New UI state
  const [selectedMode, setSelectedMode] = useState<any>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [buttonState, setButtonState] = useState<ButtonState>('ready');
  const [asmrActive, setAsmrActive] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showContactManager, setShowContactManager] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phoneNumber: '', relationship: '' });
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

  const handleReachOut = async (contacts: SupportPerson[], message: string) => {
    try {
      // Call the Supabase edge function to send actual messages
      const { data, error } = await supabase.functions.invoke('send-support-message', {
        body: {
          contacts: contacts,
          message: message,
          senderName: 'Someone who needs support'
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

      setReachOutHistory(prev => [newEvent, ...prev].slice(0, 10));

    } catch (error) {
      console.error('Failed to send support messages:', error);
      throw error;
    }
  };

  const handleEmergencyHelp = () => {
    setSelectedMode({
      id: 'emergency',
      label: 'Immediate Help',
      icon: AlertCircle,
      gradient: 'from-red-500 to-red-600',
      message: 'I need immediate support. This is urgent.',
      encouragement: "Help is on the way. You're brave for reaching out."
    });
    setShowConfirmation(true);
  };

  const addContact = () => {
    if (newContact.name && newContact.phoneNumber) {
      const contact: SupportPerson = {
        id: Date.now().toString(),
        name: newContact.name.trim(),
        phoneNumber: newContact.phoneNumber.trim(),
        relationship: newContact.relationship.trim() || undefined,
        isActive: true
      };
      
      setSupportNetwork([...supportNetwork, contact]);
      setNewContact({ name: '', phoneNumber: '', relationship: '' });
      setShowAddContact(false);
      
      toast({
        title: "Support person added",
        description: `${contact.name} is now in your network.`,
        className: "bg-accent text-accent-foreground",
      });
    }
  };

  const deleteContact = (id: string) => {
    setSupportNetwork(supportNetwork.filter(c => c.id !== id));
    toast({
      title: "Contact removed",
      description: "They've been removed from your support network.",
    });
  };

  const sendConnection = async () => {
    const activeContacts = supportNetwork.filter(c => c.isActive);
    
    if (activeContacts.length === 0) {
      toast({
        title: "Add someone who cares about you",
        description: "Go to Settings to add your support network first.",
        variant: "destructive",
      });
      return;
    }

    setButtonState('sending');
    
    try {
      const messageToSend = selectedMode.message || messageTemplate;
      await handleReachOut(activeContacts, messageToSend);
      
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
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50'} p-4 transition-colors duration-300`}>
      {/* Floating gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 ${darkMode ? 'bg-gradient-to-br from-teal-700 to-blue-800' : 'bg-gradient-to-br from-teal-200 to-blue-300'} rounded-full blur-3xl opacity-30 animate-pulse`}></div>
        <div className={`absolute bottom-20 right-10 w-96 h-96 ${darkMode ? 'bg-gradient-to-br from-cyan-700 to-emerald-800' : 'bg-gradient-to-br from-cyan-200 to-emerald-300'} rounded-full blur-3xl opacity-30 animate-pulse`}></div>
      </div>

      <div className="max-w-md mx-auto relative z-10">
        {/* Header with Controls */}
        <div className="flex justify-between items-start mb-6 pt-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-3">
              You're Safe Here
            </h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-lg`}>Take a deep breath. We're here for you.</p>
          </div>
          <div className="flex gap-2">
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

        {/* Emergency Button */}
        <button
          onClick={handleEmergencyHelp}
          className="w-full mb-6 bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-semibold text-lg
            animate-pulse hover:animate-none transition-all transform hover:scale-105 shadow-lg"
        >
          <div className="flex items-center justify-center">
            <AlertCircle className="w-6 h-6 mr-2" />
            It's Okay If You Need Help Now
          </div>
        </button>

        {/* Contact Manager Button */}
        <button
          onClick={() => setShowContactManager(true)}
          className={`w-full mb-6 ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white/80'} backdrop-blur-sm rounded-xl p-3 flex items-center justify-center shadow-md hover:shadow-lg transition-all`}
        >
          <Plus className="w-5 h-5 mr-2" />
          Manage Support Contacts
        </button>

        {/* ASMR Controls */}
        <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm rounded-2xl shadow-lg p-4 mb-6`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Headphones className="w-5 h-5 text-teal-600 mr-2" />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Calming Sounds</span>
            </div>
            <Volume2 className={`w-5 h-5 ${asmrActive ? 'text-teal-600' : darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {asmrSounds.map((sound) => (
              <button
                key={sound.id}
                onClick={() => setAsmrActive(!asmrActive)}
                className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gradient-to-br from-teal-50 to-blue-50 hover:from-teal-100 hover:to-blue-100'} 
                  transition-all flex flex-col items-center text-center`}
              >
                <span className="text-2xl mb-1">{sound.icon}</span>
                <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{sound.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        {!showConfirmation && !showContactManager ? (
          <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm rounded-2xl shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold text-center mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              How can we support you today?
            </h2>
            <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6 text-sm`}>
              Remember: reaching out is an act of self-love
            </p>
            
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
        ) : showContactManager ? (
          /* Contact Manager */
          <div className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm rounded-2xl shadow-lg p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Support Contacts</h3>
              <button onClick={() => setShowContactManager(false)}>
                <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>

            {/* Contact List */}
            <div className="space-y-3 mb-4">
              {supportNetwork.map(contact => (
                <div key={contact.id} className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{contact.name}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center mt-1`}>
                        <Phone className="w-3 h-3 mr-1" /> {contact.phoneNumber}
                      </p>
                      {contact.relationship && (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {contact.relationship}
                        </p>
                      )}
                    </div>
                    <button onClick={() => deleteContact(contact.id)}>
                      <Trash2 className={`w-4 h-4 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Contact Form */}
            {showAddContact ? (
              <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-teal-50'} rounded-lg`}>
                <Input
                  type="text"
                  placeholder="Contact Name *"
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  className={`w-full p-2 mb-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white'}`}
                />
                <Input
                  type="tel"
                  placeholder="Phone Number *"
                  value={newContact.phoneNumber}
                  onChange={(e) => setNewContact({...newContact, phoneNumber: e.target.value})}
                  className={`w-full p-2 mb-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white'}`}
                />
                <Input
                  type="text"
                  placeholder="Relationship (optional)"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                  className={`w-full p-2 mb-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white'}`}
                />
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                  * Name and phone number required
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={addContact}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-2 rounded-lg"
                  >
                    Save Contact
                  </Button>
                  <Button
                    onClick={() => { setShowAddContact(false); setNewContact({ name: '', phoneNumber: '', relationship: '' }); }}
                    className={`flex-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} py-2 rounded-lg`}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={() => setShowAddContact(true)}
                  className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-lg"
                >
                  Add New Contact
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  className="w-full"
                >
                  Advanced Settings
                </Button>
              </div>
            )}
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
                      `Send to ${supportNetwork.filter(c => c.isActive).length} Contacts 💚`
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

        {/* SMS Test Section - for development/testing */}
        {user && (
          <div className="mt-8">
            <SMSTest />
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