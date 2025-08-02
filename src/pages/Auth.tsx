import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { CrisisButton } from '@/components/CrisisButton';
import { Heart, Mail, Lock, User, Calendar, MessageSquare, AlertTriangle } from 'lucide-react';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [recoveryStartDate, setRecoveryStartDate] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!smsConsent) {
      toast({
        title: "SMS Consent Required",
        description: "Please agree to receive text messages to continue",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            recovery_start_date: recoveryStartDate || new Date().toISOString().split('T')[0],
            sms_consent_given: smsConsent,
            sms_consent_timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Welcome to your safe space",
        description: "Please check your email to confirm your account",
      });
    } catch (error: any) {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up existing state before signing in
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        // Force page reload for clean state
        window.location.href = '/';
      }
    } catch (error: any) {
      toast({
        title: "Unable to sign in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary/20 to-secondary/30 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-border/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full mb-4">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isSignUp ? 'Join Your Safe Space' : 'Welcome Back'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isSignUp ? 'Create your account to start your journey' : 'Sign in to access your support network'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recoveryDate" className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Recovery Start Date (Optional)
                  </Label>
                  <Input
                    id="recoveryDate"
                    type="date"
                    value={recoveryStartDate}
                    onChange={(e) => setRecoveryStartDate(e.target.value)}
                  />
                </div>

                {/* SMS Consent Form */}
                <div className="space-y-4 p-4 bg-secondary/20 rounded-lg border border-border/50">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">SMS Support Communications</h3>
                      
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                          <strong>Message Frequency:</strong> You will receive daily wellness check-ins, 
                          as-needed crisis support notifications, and weekly appointment reminders.
                        </p>
                        
                        <p>
                          <strong>Standard messaging rates apply.</strong> Data and message rates may apply based on your mobile carrier plan.
                        </p>
                        
                        <div className="bg-card/50 p-3 rounded border border-border/30">
                          <p className="font-medium text-foreground mb-2">How to manage your preferences:</p>
                          <ul className="space-y-1 text-xs">
                            <li>• Reply <strong>STOP</strong> to any message to unsubscribe</li>
                            <li>• Text <strong>STOP</strong> to our support number anytime</li>
                            <li>• Update preferences in your app settings</li>
                            <li>• Text <strong>HELP</strong> for support information</li>
                          </ul>
                        </div>
                        
                        <div className="flex items-start space-x-2 p-2 bg-warning/10 rounded border border-warning/20">
                          <AlertTriangle className="w-4 h-4 mt-0.5 text-warning flex-shrink-0" />
                          <div className="text-xs">
                            <p className="font-medium">Age Requirement:</p>
                            <p>You must be 18+ or have guardian consent to participate in SMS communications.</p>
                          </div>
                        </div>
                        
                        <p className="text-xs">
                          All consent is documented with timestamps and stored securely in compliance with healthcare privacy regulations (HIPAA).
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="smsConsent"
                          checked={smsConsent}
                          onCheckedChange={(checked) => setSmsConsent(checked as boolean)}
                          className="border-primary data-[state=checked]:bg-primary"
                        />
                        <Label 
                          htmlFor="smsConsent" 
                          className="text-sm font-medium cursor-pointer text-foreground"
                        >
                          I agree to receive text messages from Serenity Recovery App to support my mental health journey
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90" 
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Help */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Your privacy and security are our priority</p>
          </div>
        </div>

        {/* Emergency Resources */}
        <div className="mt-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground mb-2">
            Need immediate help?
          </p>
          
          {/* Crisis Button for anonymous users */}
          <div className="flex justify-center">
            <CrisisButton userId="anonymous" variant="compact" showStatus={false} />
          </div>
          
          <p className="text-xs text-muted-foreground">
            Crisis Lifeline: 988 • Emergency: 911
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;