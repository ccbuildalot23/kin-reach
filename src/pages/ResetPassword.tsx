import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { auditLogger } from '@/lib/auditLogger';
import { Lock, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Invalid or expired link",
          description: "Please request a new password reset link.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };
    checkSession();
  }, [navigate, toast]);

  useEffect(() => {
    // Check password requirements
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordRequirements(requirements);

    // Calculate password strength
    const strength = Object.values(requirements).filter(Boolean).length;
    setPasswordStrength(strength);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    if (passwordStrength < 5) {
      toast({
        title: "Password not strong enough",
        description: "Please meet all password requirements for your security.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Log password reset success
      if (user) {
        await auditLogger.logPasswordResetSuccess(user.id);
      }

      toast({
        title: "Password updated successfully",
        description: "Welcome back to your sanctuary. Redirecting to sign in...",
        className: "bg-accent text-accent-foreground",
      });

      // Sign out to ensure clean state
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Unable to update password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-destructive';
    if (passwordStrength <= 4) return 'bg-warning';
    return 'bg-success';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/80 to-secondary/80 rounded-full mb-4 shadow-lg animate-pulse-subtle">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-light text-foreground mb-2 tracking-wide">
              Serenity
            </h1>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Create Your New Password
            </h2>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
              Choose a strong password to protect your sanctuary
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                minLength={8}
              />
              
              {password && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Password strength:</span>
                    <span className={`font-medium ${passwordStrength >= 5 ? 'text-success' : 'text-muted-foreground'}`}>
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                  
                  <div className="mt-3 space-y-1">
                    {Object.entries({
                      minLength: 'At least 8 characters',
                      hasUpperCase: 'One uppercase letter',
                      hasLowerCase: 'One lowercase letter',
                      hasNumber: 'One number',
                      hasSpecial: 'One special character',
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center text-xs">
                        {passwordRequirements[key as keyof typeof passwordRequirements] ? (
                          <CheckCircle className="w-3 h-3 text-success mr-2" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-muted-foreground mr-2" />
                        )}
                        <span className={passwordRequirements[key as keyof typeof passwordRequirements] ? 'text-success' : 'text-muted-foreground'}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive mt-1">Passwords don't match</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 shadow-md hover:shadow-lg" 
              disabled={loading || passwordStrength < 5 || password !== confirmPassword}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-pulse">Updating your password...</span>
                </span>
              ) : (
                'Set New Password'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/auth')}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Back to sign in
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <Lock className="w-3 h-3" />
              Your security is protected with HIPAA-compliant encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;