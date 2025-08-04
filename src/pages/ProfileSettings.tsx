import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PhoneInput } from '@/components/PhoneInput';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Heart,
  Shield,
  Loader2,
  Camera,
  AlertCircle,
  Check,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  phone: string | null;
  bio: string | null;
  clean_date: string | null;
  location: string | null;
  avatar_url: string | null;
  is_sponsor: boolean;
  accepts_sponsees: boolean;
  years_clean: number | null;
  recovery_program: string | null;
  is_searchable_by_phone: boolean;
  is_searchable_by_email: boolean;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    display_name: '',
    phone: '',
    bio: '',
    clean_date: '',
    location: '',
    is_sponsor: false,
    accepts_sponsees: false,
    recovery_program: '',
    is_searchable_by_phone: true,
    is_searchable_by_email: true,
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } else if (data) {
      setProfile({
        ...data,
        clean_date: data.recovery_start_date ? format(new Date(data.recovery_start_date), 'yyyy-MM-dd') : '',
      });
    }
    setLoading(false);
  }, [user?.id, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    
    // Validate required fields
    if (!profile.display_name || !profile.phone) {
      toast({
        title: 'Almost there!',
        description: 'We need your name and phone to support you better',
        className: 'bg-amber-100 text-amber-900 border-amber-200',
      });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        email: user.email,
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive',
      });
    } else {
      toast({
        title: '💙 Changes saved',
        description: 'Your recovery profile is updated',
        className: 'bg-green-100 text-green-900 border-green-200',
      });
    }
    setSaving(false);
  };

  const calculateCleanTime = () => {
    if (!profile.clean_date) return null;
    
    const cleanDate = new Date(profile.clean_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - cleanDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Your Recovery Profile
          </h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                This information helps others in your recovery network identify you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    A photo helps your support team recognize you 💙
                  </p>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display_name">
                  Display Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="display_name"
                  value={profile.display_name || ''}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  placeholder="How you want to be known in the app"
                />
                <p className="text-xs text-muted-foreground">
                  How your support team will see you
                </p>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <PhoneInput
                  value={profile.phone || ''}
                  onChange={(value) => setProfile({ ...profile, phone: value })}
                  placeholder="(555) 123-4567"
                />
                <p className="text-xs text-muted-foreground">
                  So we can reach you when you need support
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">About Me</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Share a bit about yourself and your recovery journey..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Help others get to know you (visible to your connections)
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={profile.location || ''}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="City, State"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Helps connect you with local recovery resources
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>
                Someone we can contact if you trigger a crisis alert
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    value={profile.emergency_contact_name || ''}
                    onChange={(e) => setProfile({ ...profile, emergency_contact_name: e.target.value })}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                  <PhoneInput
                    value={profile.emergency_contact_phone || ''}
                    onChange={(value) => setProfile({ ...profile, emergency_contact_phone: value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Information</CardTitle>
              <CardDescription>
                Share your recovery journey to inspire and connect with others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Clean Date */}
              <div className="space-y-2">
                <Label htmlFor="clean_date">
                  <Heart className="inline h-4 w-4 mr-1" />
                  Clean Date
                </Label>
                <Input
                  id="clean_date"
                  type="date"
                  value={profile.clean_date || ''}
                  onChange={(e) => setProfile({ ...profile, clean_date: e.target.value })}
                />
                {profile.clean_date && (
                  <p className="text-sm font-medium text-green-600">
                    {calculateCleanTime()} clean! Keep going! 🎉
                  </p>
                )}
              </div>

              {/* Recovery Program */}
              <div className="space-y-2">
                <Label htmlFor="recovery_program">Recovery Program</Label>
                <Input
                  id="recovery_program"
                  value={profile.recovery_program || ''}
                  onChange={(e) => setProfile({ ...profile, recovery_program: e.target.value })}
                  placeholder="AA, NA, SMART Recovery, etc."
                />
              </div>

              {/* Sponsor Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="is_sponsor" className="text-base">
                      I am a sponsor
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      I have experience sponsoring others in recovery
                    </p>
                  </div>
                  <Switch
                    id="is_sponsor"
                    checked={profile.is_sponsor || false}
                    onCheckedChange={(checked) => setProfile({ ...profile, is_sponsor: checked })}
                  />
                </div>

                {profile.is_sponsor && (
                  <div className="flex items-center justify-between pl-6">
                    <div className="space-y-1">
                      <Label htmlFor="accepts_sponsees" className="text-base">
                        Accepting new sponsees
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Others can request you as a sponsor
                      </p>
                    </div>
                    <Switch
                      id="accepts_sponsees"
                      checked={profile.accepts_sponsees || false}
                      onCheckedChange={(checked) => setProfile({ ...profile, accepts_sponsees: checked })}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Discovery</CardTitle>
              <CardDescription>
                Control how others can find and connect with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">
                      Your information is protected
                    </p>
                    <p className="text-sm text-blue-700">
                      Only people you connect with can see your full profile. 
                      Others can only find you if you enable the options below.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="searchable_phone" className="text-base">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Allow others to find me by phone number
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      People with your phone number can send you connection requests
                    </p>
                  </div>
                  <Switch
                    id="searchable_phone"
                    checked={profile.is_searchable_by_phone ?? true}
                    onCheckedChange={(checked) => 
                      setProfile({ ...profile, is_searchable_by_phone: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="searchable_email" className="text-base">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Allow others to find me by email
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      People with your email can send you connection requests
                    </p>
                  </div>
                  <Switch
                    id="searchable_email"
                    checked={profile.is_searchable_by_email ?? true}
                    onCheckedChange={(checked) => 
                      setProfile({ ...profile, is_searchable_by_email: checked })
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">What others can see:</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Before connecting:</p>
                      <p className="text-muted-foreground">Display name and avatar only</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">After connecting:</p>
                      <p className="text-muted-foreground">
                        Full profile including bio, recovery info, and contact details
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>

      {/* Save Button - Fixed at bottom */}
      <div className="sticky bottom-0 bg-background border-t mt-8 py-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            Remember to save your changes
          </p>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save All Changes'
            )}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ProfileSettings;

