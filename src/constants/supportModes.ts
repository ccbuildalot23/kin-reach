import { Heart, Feather, Sun, Sparkles, AlertCircle } from 'lucide-react';

export const supportModes = [
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