import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { CrisisButton } from '@/components/CrisisButton';
import { auditLogger } from '@/lib/auditLogger';
import { Heart, Mail, Lock, User, Calendar, MessageSquare, AlertTriangle, Volume2, VolumeX, Sparkles } from 'lucide-react';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [recoveryStartDate, setRecoveryStartDate] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [oscillator, setOscillator] = useState<OscillatorNode | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the recovery link
        navigate('/reset-password');
      } else if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Initialize calming sounds preference
  useEffect(() => {
    const savedSoundPref = localStorage.getItem('serenity-sound-enabled');
    if (savedSoundPref === 'true') {
      setSoundEnabled(true);
      initializeSound();
    }
  }, []);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [oscillator, audioContext]);

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
      // Log signup attempt
      await auditLogger.logSignupAttempt(email);
      
      const { data, error } = await supabase.auth.signUp({
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

      // Log signup success
      if (data.user) {
        await auditLogger.logSignupSuccess(data.user.id, email);
      }

      toast({
        title: "Welcome to your safe space",
        description: "Please check your email to confirm your account",
      });
    } catch (error: any) {
      // Log signup failure
      await auditLogger.logSignupFailure(email, error.message);
      
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
      // Log login attempt
      await auditLogger.logLoginAttempt(email);
      
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
        // Log login success
        await auditLogger.logLoginSuccess(data.user.id, email);
        
        // Force page reload for clean state
        window.location.href = '/';
      }
    } catch (error: any) {
      // Log login failure
      await auditLogger.logLoginFailure(email, error.message);
      
      toast({
        title: "Unable to sign in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Log password reset request
      await auditLogger.logPasswordResetRequest(email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a link to reset your password and return to your sanctuary.",
        className: "bg-accent text-accent-foreground",
      });
      
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Unable to send reset email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);

      // Create a calming sound using oscillators
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // Use a low frequency for a calming hum
      osc.frequency.value = 110; // A2 note
      osc.type = 'sine';
      
      // Set low volume for background ambience
      gainNode.gain.value = 0.05;
      
      // Connect nodes
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Start the oscillator
      osc.start(0);
      
      setOscillator(osc);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const toggleSound = () => {
    if (soundEnabled) {
      // Stop sound
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
        setOscillator(null);
      }
      if (audioContext) {
        audioContext.close();
        setAudioContext(null);
      }
      setSoundEnabled(false);
      localStorage.setItem('serenity-sound-enabled', 'false');
      toast({
        title: "Calming sounds disabled",
        description: "You can enable them anytime",
      });
    } else {
      // Start sound
      setSoundEnabled(true);
      localStorage.setItem('serenity-sound-enabled', 'true');
      initializeSound();
      toast({
        title: "Calming sounds enabled",
        description: "Gentle background ambience activated",
        className: "bg-accent text-accent-foreground",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 flex items-center justify-center p-4">
      {/* Enhanced Background Elements with Calming Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary/20 to-secondary/30 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-3xl opacity-20 animate-pulse-subtle"></div>
        
        {/* Floating particles for calming effect */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-border/50">
          {/* Header with Serenity Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/80 to-secondary/80 rounded-full mb-4 shadow-lg animate-pulse-subtle">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-light text-foreground mb-2 tracking-wide">
              Serenity
            </h1>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {isSignUp ? 'Begin Your Journey to Peace' : 'Welcome Back to Your Sanctuary'}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
              {isSignUp ? 'Create your personal haven where healing begins and support surrounds you' : 'Return to your safe space where calm awaits and your support network stands ready'}
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
                          I agree to receive text messages from Serenity to support my mental health journey
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
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 shadow-md hover:shadow-lg" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-pulse">Finding your peace...</span>
                </span>
              ) : (
                isSignUp ? 'Begin Your Journey' : 'Enter Your Sanctuary'
              )}
            </Button>

            {/* Forgot Password Link */}
            {!isSignUp && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setShowForgotPassword(false);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? 'Already on your journey? Sign in' : "Ready to begin? Create your sanctuary"}
            </button>
          </div>

          {/* Help & Sound Toggle */}
          <div className="mt-6 space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                <Lock className="w-3 h-3" />
                Your peace of mind is protected with HIPAA-compliant security
              </p>
            </div>
            
            {/* ASMR Sound Toggle */}
            <div className="flex justify-center">
              <button
                onClick={toggleSound}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground bg-secondary/20 hover:bg-secondary/30 rounded-full transition-all duration-300"
                title="Toggle calming background sounds"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Calming sounds on</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Enable calming sounds</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Emergency Resources */}
        <div className="mt-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground mb-2">
            Need immediate support?
          </p>
          
          {/* Crisis Button for anonymous users */}
          <div className="flex justify-center">
            <CrisisButton userId="anonymous" variant="compact" showStatus={false} />
          </div>
          
          <p className="text-xs text-muted-foreground">
            You're never alone • Crisis Lifeline: 988 • Emergency: 911
          </p>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-card/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-border/50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
              <h3 className="text-xl font-semibold mb-4">Reset Your Password</h3>
              <p className="text-muted-foreground mb-6">
                Enter your email and we'll send you a link to create a new password and return to your sanctuary.
              </p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="reset-email" className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Address
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;