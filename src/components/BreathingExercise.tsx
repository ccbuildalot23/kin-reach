import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreathingExerciseProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BreathingExercise({ isOpen, onClose }: BreathingExerciseProps) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isOpen || !isActive) return;

    const timer = setInterval(() => {
      setCount((prev) => {
        if (phase === 'inhale' && prev >= 4) {
          setPhase('hold');
          return 1;
        } else if (phase === 'hold' && prev >= 7) {
          setPhase('exhale');
          return 1;
        } else if (phase === 'exhale' && prev >= 8) {
          setPhase('inhale');
          return 1;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isActive, phase]);

  if (!isOpen) return null;

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
        return 'from-blue-400 to-cyan-400';
      case 'hold':
        return 'from-purple-400 to-pink-400';
      case 'exhale':
        return 'from-green-400 to-teal-400';
    }
  };

  const getPhaseSize = () => {
    switch (phase) {
      case 'inhale':
        return 'scale-125';
      case 'hold':
        return 'scale-125';
      case 'exhale':
        return 'scale-75';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full relative animate-in fade-in slide-in-from-bottom-5 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Breathing Exercise
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Let's take a moment to breathe together
            </p>
          </div>

          {!isActive ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This is the 4-7-8 breathing technique. It helps calm your nervous system and reduce anxiety.
                </p>
              </div>
              <button
                onClick={() => setIsActive(true)}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                Start Breathing Exercise
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative w-48 h-48 mx-auto">
                {/* Breathing circle */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-full bg-gradient-to-br transition-all duration-1000",
                    getPhaseColor(),
                    getPhaseSize()
                  )}
                />
                
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-white mb-2">{count}</div>
                  <div className="text-lg font-medium text-white">{getPhaseText()}</div>
                </div>

                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-center gap-2">
                  <div className={cn(
                    "w-16 h-1 rounded-full transition-colors",
                    phase === 'inhale' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  )} />
                  <div className={cn(
                    "w-16 h-1 rounded-full transition-colors",
                    phase === 'hold' ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  )} />
                  <div className={cn(
                    "w-16 h-1 rounded-full transition-colors",
                    phase === 'exhale' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  )} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {phase === 'inhale' && 'Breathe in through your nose'}
                  {phase === 'hold' && 'Hold your breath gently'}
                  {phase === 'exhale' && 'Exhale slowly through your mouth'}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsActive(false);
                  setPhase('inhale');
                  setCount(0);
                }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Stop Exercise
              </button>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400">
            You're doing great. Take as much time as you need.
          </p>
        </div>
      </div>
    </div>
  );
}