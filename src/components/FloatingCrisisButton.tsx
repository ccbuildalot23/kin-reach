import React, { useState } from 'react';
import { Phone, Heart, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingCrisisButtonProps {
  userId?: string;
}

export function FloatingCrisisButton({ userId = "anonymous" }: FloatingCrisisButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEmergencyCall = () => {
    window.location.href = 'tel:988';
  };

  const handleTextCrisis = () => {
    window.location.href = 'sms:741741?body=HOME';
  };

  const handleSupportRequest = () => {
    window.location.href = '/crisis-alert';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded menu */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 min-w-[280px] animate-in slide-in-from-bottom-2 duration-200">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              You're not alone 💙
            </h3>
            
            <button
              onClick={handleEmergencyCall}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-red-700 dark:text-red-400">Call 988</div>
                <div className="text-sm text-red-600 dark:text-red-500">Crisis Lifeline - Free & Confidential</div>
              </div>
            </button>

            <button
              onClick={handleTextCrisis}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-blue-700 dark:text-blue-400">Text HOME to 741741</div>
                <div className="text-sm text-blue-600 dark:text-blue-500">Crisis Text Line - 24/7 Support</div>
              </div>
            </button>

            {userId !== "anonymous" && (
              <button
                onClick={handleSupportRequest}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-purple-700 dark:text-purple-400">Alert Your Support Team</div>
                  <div className="text-sm text-purple-600 dark:text-purple-500">Notify your trusted contacts</div>
                </div>
              </button>
            )}

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Emergency? Call 911
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main floating button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center",
          "bg-gradient-to-br from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600",
          "hover:scale-110 active:scale-95",
          isExpanded && "rotate-45"
        )}
        aria-label="Crisis support options"
      >
        {isExpanded ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Heart className="w-6 h-6 text-white animate-pulse" />
        )}
      </button>

      {/* Pulsing ring animation when closed */}
      {!isExpanded && (
        <div className="absolute inset-0 -z-10">
          <div className="w-14 h-14 rounded-full bg-red-400 animate-ping opacity-20" />
        </div>
      )}
    </div>
  );
}