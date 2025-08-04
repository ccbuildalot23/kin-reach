import React from 'react';
import { Phone, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RecoveryHeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export function RecoveryHeader({ showBackButton = false, title }: RecoveryHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-gray-600 dark:text-gray-400"
              >
                ← Back
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {title || 'Serenity'}
              </span>
            </div>
          </div>

          {/* Right side - Crisis resources */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = 'tel:988'}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <Phone className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">988</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/crisis-alert')}
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              <Heart className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Get Help</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Supportive message banner */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 py-2 px-4">
        <p className="text-center text-sm text-purple-700 dark:text-purple-300">
          💙 You're not alone • Progress, not perfection • One day at a time
        </p>
      </div>
    </div>
  );
}