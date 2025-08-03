import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Volume2, Pause, Play, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface Sound {
  id: string;
  label: string;
  icon: string;
  description: string;
  duration: string;
  color: string;
}

const Sounds = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const sounds: Sound[] = [
    { 
      id: 'rain', 
      label: 'Gentle Rain', 
      icon: '🌧️', 
      description: 'Soft rainfall for deep relaxation',
      duration: '10 min',
      color: 'from-blue-400 to-blue-600'
    },
    { 
      id: 'waves', 
      label: 'Ocean Waves', 
      icon: '🌊', 
      description: 'Calming beach waves',
      duration: '15 min',
      color: 'from-cyan-400 to-teal-600'
    },
    { 
      id: 'breathing', 
      label: 'Calm Breathing', 
      icon: '🫧', 
      description: 'Guided breathing exercise',
      duration: '5 min',
      color: 'from-purple-400 to-purple-600'
    },
    { 
      id: 'heartbeat', 
      label: 'Heartbeat', 
      icon: '💗', 
      description: 'Soothing heartbeat rhythm',
      duration: '8 min',
      color: 'from-pink-400 to-red-500'
    },
    { 
      id: 'forest', 
      label: 'Forest Ambience', 
      icon: '🌲', 
      description: 'Birds and rustling leaves',
      duration: '12 min',
      color: 'from-green-400 to-emerald-600'
    },
    { 
      id: 'whitenoise', 
      label: 'White Noise', 
      icon: '📻', 
      description: 'Consistent background noise',
      duration: '20 min',
      color: 'from-gray-400 to-gray-600'
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
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <Volume2 className="w-8 h-8 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading calming sounds...</p>
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
        title: `Playing ${sound?.label}`,
        description: "Close your eyes and breathe deeply.",
        className: "bg-accent text-accent-foreground",
      });
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50'} p-4 transition-colors duration-300`}>
      {/* Floating gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 ${darkMode ? 'bg-gradient-to-br from-purple-700 to-pink-800' : 'bg-gradient-to-br from-purple-200 to-pink-300'} rounded-full blur-3xl opacity-30 animate-pulse`}></div>
        <div className={`absolute bottom-20 right-10 w-96 h-96 ${darkMode ? 'bg-gradient-to-br from-blue-700 to-cyan-800' : 'bg-gradient-to-br from-blue-200 to-cyan-300'} rounded-full blur-3xl opacity-30 animate-pulse`}></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10 pt-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Calming Sounds
            </h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Find your peace with soothing audio
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
          <Card className={`mb-6 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{sounds.find(s => s.id === activeSound)?.icon}</div>
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      Now Playing
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {sounds.find(s => s.id === activeSound)?.label}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPlaying(false)}
                  className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                >
                  <Pause className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sound Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {sounds.map((sound) => {
            const isActive = activeSound === sound.id && isPlaying;
            return (
              <Card
                key={sound.id}
                className={`cursor-pointer transition-all duration-300 ${
                  darkMode ? 'bg-gray-800/80 hover:bg-gray-700/80' : 'bg-white/80 hover:bg-white/90'
                } backdrop-blur-sm ${
                  isActive ? 'ring-2 ring-purple-500 shadow-lg transform scale-[1.02]' : ''
                }`}
                onClick={() => handleSoundToggle(sound.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${sound.color} text-white text-2xl`}>
                        {sound.icon}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                          {sound.label}
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {sound.duration}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={isActive ? 'text-purple-600' : ''}
                    >
                      {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
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

        {/* Tips Section */}
        <Card className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm`}>
          <CardHeader>
            <CardTitle className={darkMode ? 'text-gray-100' : ''}>Relaxation Tips</CardTitle>
            <CardDescription className={darkMode ? 'text-gray-400' : ''}>
              Enhance your calming experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li className="flex items-start">
                <span className="mr-2">🌟</span>
                <span className="text-sm">Find a comfortable position and close your eyes</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🌟</span>
                <span className="text-sm">Take slow, deep breaths - in through your nose, out through your mouth</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🌟</span>
                <span className="text-sm">Let the sounds wash over you without forcing relaxation</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🌟</span>
                <span className="text-sm">Use headphones for a more immersive experience</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Sounds;