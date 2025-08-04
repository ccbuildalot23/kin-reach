import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, Info } from 'lucide-react';

export function WellnessDisclaimer() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Check if user has accepted disclaimer
    const hasAccepted = localStorage.getItem('wellness-disclaimer-accepted');
    if (!hasAccepted) {
      setShowDisclaimer(true);
    } else {
      setAccepted(true);
    }
  }, []);

  const handleAccept = () => {
    if (checked) {
      localStorage.setItem('wellness-disclaimer-accepted', 'true');
      setAccepted(true);
      setShowDisclaimer(false);
    }
  };

  // Show banner for accepted users
  if (accepted && !showDisclaimer) {
    return (
      <Alert className="mb-4 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Wellness App:</strong> This app provides peer support and wellness tools. 
          For medical emergencies, call 911. For crisis support, call 988.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog open={showDisclaimer} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Heart className="h-6 w-6 text-purple-600" />
            Welcome to Serenity Wellness
          </DialogTitle>
          <DialogDescription className="text-base mt-4">
            Your companion for recovery support and wellness
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">
              Important Information
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
              <li>• This is a <strong>wellness support app</strong>, not a medical service</li>
              <li>• Designed to connect you with peer support during recovery</li>
              <li>• Not a substitute for professional medical or mental health treatment</li>
              <li>• Your data is encrypted and protected with security best practices</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-purple-900 dark:text-purple-300">
              In Case of Emergency
            </h3>
            <div className="space-y-2 text-sm text-purple-800 dark:text-purple-400">
              <p className="font-medium">• Medical Emergency: Call 911</p>
              <p className="font-medium">• Crisis Support: Call or text 988</p>
              <p className="font-medium">• Text Support: Text HOME to 741741</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              By using this app, you acknowledge that it is a wellness tool and agree to our{' '}
              <button className="text-purple-600 hover:underline">Terms of Service</button> and{' '}
              <button className="text-purple-600 hover:underline">Privacy Policy</button>.
            </p>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox 
              id="accept" 
              checked={checked}
              onCheckedChange={(checked) => setChecked(checked as boolean)}
            />
            <label 
              htmlFor="accept" 
              className="text-sm leading-relaxed cursor-pointer"
            >
              I understand this is a wellness app for peer support, not a medical service, 
              and I will seek appropriate professional help when needed.
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={handleAccept}
            disabled={!checked}
            className="bg-purple-600 hover:bg-purple-700"
          >
            I Understand & Accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}