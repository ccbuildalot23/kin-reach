import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Volume2, Pause, Play, Moon, Sun, Heart, Brain, Coffee, Bed, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { FloatingCrisisButton } from '@/components/FloatingCrisisButton';

interface Sound {
  id: string;
  label: string;
  icon: string;
  description: string;
  duration: string;
  color: string;
  category: 'anxiety' | 'cravings' | 'sleep' | 'motivation' | 'panic';
}

const Sounds = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const sounds: Sound[] = [
    // Anxiety Relief
    { 
      id: 'breathing', 
      label: '4-7-8 Breathing', 
      icon: '🧪', 
      description: 'Calm your nervous system quickly',
      duration: '5 min',
      color: 'from-purple-400 to-purple-600',
      category: 'anxiety'
    },
    { 
      id: 'rain', 
      label: 'Gentle Rain', 
      icon: '🌧️', 
      description: 'Wash away anxious thoughts',
      duration: '10 min',
      color: 'from-blue-400 to-blue-600',
      category: 'anxiety'
    },
    // Cravings Support
    { 
      id: 'urgesurfing', 
      label: 'Ride the Wave', 
      icon: '🌊', 
      description: 'Surf through cravings meditation',
      duration: '7 min',
      color: 'from-cyan-400 to-teal-600',
      category: 'cravings'
    },
    { 
      id: 'stronger', 
      label: 'You Are Stronger', 
      icon: '💪', 
      description: 'Affirmations for tough moments',
      duration: '5 min',
      color: 'from-orange-400 to-red-500',
      category: 'cravings'
    },
    // Sleep Help
    { 
      id: 'bodyscan', 
      label: 'Body Scan', 
      icon: '🌙', 
      description: 'Progressive muscle relaxation',
      duration: '15 min',
      color: 'from-indigo-400 to-purple-500',
      category: 'sleep'
    },
    { 
      id: 'sleepstory', 
      label: 'Recovery Dreams', 
      icon: '✨', 
      description: 'Peaceful story for restful sleep',
      duration: '20 min',
      color: 'from-pink-400 to-purple-500',
      category: 'sleep'
    },
    // Motivation
    { 
      id: 'morning', 
      label: 'Morning Victory', 
      icon: '☀️', 
      description: 'Start your day with strength',
      duration: '5 min',
      color: 'from-yellow-400 to-orange-500',
      category: 'motivation'
    },
    { 
      id: 'warrior', 
      label: 'Recovery Warrior', 
      icon: '🚀', 
      description: 'Remember why you started',
      duration: '8 min',
      color: 'from-red-400 to-pink-500',
      category: 'motivation'
    },
    // Panic Attack
    { 
      id: 'grounding', 
      label: '5-4-3-2-1 Grounding', 
      icon: '🌱', 
      description: 'Emergency grounding technique',
      duration: '3 min',
      color: 'from-green-400 to-emerald-600',
      category: 'panic'
    },
    { 
      id: 'safespace', 
      label: 'You Are Safe', 
      icon: '🛟', 
      description: 'Immediate panic relief',
      duration: '5 min',
      color: 'from-purple-400 to-pink-500',
      category: 'panic'
    }
  ];

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('connect-button-darkmode');
    if (savedDarkMode === 'true') {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('connect-button-darkmode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-4" />
          <p className="text-purple-600 font-medium">Opening your peace library...</p>
          <p className="text-purple-500 text-sm mt-2">A moment of calm awaits</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSoundToggle = (soundId: string) => {
    if (activeSound === soundId && isPlaying) {
      setIsPlaying(false);
      toast({
        title: "Sound paused",
        description: "Take a moment when you're ready.",
      });
    } else {
      setActiveSound(soundId);
      setIsPlaying(true);
      const sound = sounds.find(s => s.id === soundId);
      toast({
        title: `🎵 Starting ${sound?.label}`,
        description: "You're taking care of yourself. That's beautiful.",
        className: "bg-purple-100 text-purple-900 border-purple-200",
      });
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50'} transition-colors duration-300`}>
      <FloatingCrisisButton userId={user?.id || ''} />
      
      {/* Floating gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 ${darkMode ? 'bg-gradient-to-br from-purple-700 to-pink-800' : 'bg-gradient-to-br from-purple-200 to-pink-300'} rounded-full blur-3xl opacity-30 animate-pulse`}></div>
        <div className={`absolute bottom-20 right-10 w-96 h-96 ${darkMode ? 'bg-gradient-to-br from-blue-700 to-cyan-800' : 'bg-gradient-to-br from-blue-200 to-cyan-300'} rounded-full blur-3xl opacity-30 animate-pulse`}></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10 pt-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-purple-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Peace Library
              </h1>
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Your personal sanctuary of calm 💙
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-700'} shadow-md`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Currently Playing */}
        {activeSound && isPlaying && (
          <Card className={`mb-6 ${darkMode ? 'bg-gray-800/80' : 'bg-gradient-to-br from-purple-100 to-pink-100'} backdrop-blur-sm border-purple-200`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl animate-pulse">{sounds.find(s => s.id === activeSound)?.icon}</div>
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-purple-800'}`}>
                      Healing in Progress
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-purple-600'}`}>
                      {sounds.find(s => s.id === activeSound)?.label}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPlaying(false)}
                  className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-100'}
                >
                  <Pause className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sound Categories */}
        <div className="space-y-6 mb-8">
          {[
            { category: 'anxiety', title: 'Anxiety Relief', icon: Brain, color: 'purple' },
            { category: 'cravings', title: 'Overcome Cravings', icon: Heart, color: 'red' },
            { category: 'sleep', title: 'Sleep & Rest', icon: Bed, color: 'indigo' },
            { category: 'motivation', title: 'Daily Motivation', icon: Coffee, color: 'orange' },
            { category: 'panic', title: 'Panic Attack Help', icon: AlertCircle, color: 'pink' }
          ].map(({ category, title, icon: Icon, color }) => {
            const categorySounds = sounds.filter(s => s.category === category);
            
            return (
              <div key={category} className="space-y-3">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
                  <Icon className={`w-5 h-5 text-${color}-500`} />
                  {title}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categorySounds.map((sound) => {
                    const isActive = activeSound === sound.id && isPlaying;
                    return (
                      <Card
                        key={sound.id}
                        className={`cursor-pointer transition-all duration-300 ${
                          darkMode ? 'bg-gray-800/80 hover:bg-gray-700/80' : 'bg-white/80 hover:bg-white/90'
                        } backdrop-blur-sm ${
                          isActive ? 'ring-2 ring-purple-500 shadow-lg transform scale-[1.02]' : ''
                        } border-l-4 border-l-${color}-400`}
                        onClick={() => handleSoundToggle(sound.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${sound.color} text-white text-xl`}>
                                {sound.icon}
                              </div>
                              <div>
                                <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                  {sound.label}
                                </h3>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {sound.duration}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={isActive ? 'text-purple-600' : ''}
                            >
                              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                          </div>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {sound.description}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recovery Tips */}
        <Card className={`${darkMode ? 'bg-gray-800/80' : 'bg-gradient-to-br from-purple-100 to-pink-100'} backdrop-blur-sm border-purple-200`}>
          <CardHeader>
            <CardTitle className={darkMode ? 'text-gray-100' : 'text-purple-800'}>Using Your Peace Library</CardTitle>
            <CardDescription className={darkMode ? 'text-gray-400' : 'text-purple-600'}>
              Tools for your recovery journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-white/70'}`}>
                <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-2">
                  When Cravings Hit:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start with "Ride the Wave" - cravings always pass, just like waves
                </p>
              </div>
              
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-white/70'}`}>
                <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">
                  Can't Sleep?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Try "Body Scan" to release physical tension from the day
                </p>
              </div>
              
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-white/70'}`}>
                <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">
                  Panic Attack?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  "5-4-3-2-1 Grounding" brings you back to safety quickly
                </p>
              </div>
              
              <p className="text-center text-sm font-medium text-purple-600 dark:text-purple-400 mt-4">
                💙 Each listen is a victory - celebrate taking care of yourself
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Sounds;