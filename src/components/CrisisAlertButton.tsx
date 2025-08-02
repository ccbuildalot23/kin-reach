import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, Loader2, Phone } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CrisisAlertButtonProps {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export const CrisisAlertButton: React.FC<CrisisAlertButtonProps> = ({
  size = 'lg',
  variant = 'destructive',
  className = '',
}) => {
  const { sendCrisisAlert } = useNotifications();
  const [showDialog, setShowDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendAlert = async () => {
    setSending(true);
    await sendCrisisAlert(message || undefined);
    setSending(false);
    setShowDialog(false);
    setMessage('');
  };

  const handleEmergencyCall = () => {
    // In a real app, you might have a specific crisis hotline
    window.location.href = 'tel:988'; // National Suicide Prevention Lifeline
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowDialog(true)}
        className={`${className} font-semibold`}
      >
        <AlertCircle className="mr-2 h-4 w-4" />
        Crisis Alert
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Send Crisis Alert
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This will immediately notify your entire support network that you need help.
              </p>
              <div className="space-y-2">
                <Label htmlFor="crisis-message">
                  Optional message (or leave blank for default)
                </Label>
                <Textarea
                  id="crisis-message"
                  placeholder="I'm struggling and need support..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[80px]"
                  disabled={sending}
                />
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <p className="text-sm font-medium text-orange-800 mb-2">
                  Need immediate help?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEmergencyCall}
                  className="w-full border-orange-300 hover:bg-orange-100"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call Crisis Hotline (988)
                </Button>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendAlert}
              disabled={sending}
              className="bg-red-600 hover:bg-red-700"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Alert...
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Send Alert
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CrisisAlertButton;

