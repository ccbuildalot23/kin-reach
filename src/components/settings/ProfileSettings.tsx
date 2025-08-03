import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneInputValidated } from "@/components/PhoneInputValidated";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  display_name: z.string().min(2, "Display name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().regex(/^\+1\d{10}$/, "Invalid phone number"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  recovery_start_date: z.date().optional(),
  recovery_type: z.enum(['alcohol', 'drugs', 'both', 'other', 'prefer_not_to_say']).optional(),
  timezone: z.string()
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileSettings() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  });

  const recoveryStartDate = watch("recovery_start_date");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setValue('full_name', data.full_name || '');
        setValue('display_name', data.display_name || '');
        setValue('email', data.email || user.email || '');
        setValue('phone_number', data.phone_number || '');
        setValue('bio', data.bio || '');
        setValue('timezone', data.timezone || 'America/New_York');
        if (data.recovery_start_date) {
          setValue('recovery_start_date', new Date(data.recovery_start_date));
        }
        if (data.recovery_type) {
          setValue('recovery_type', data.recovery_type);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    }
  }

  async function onSubmit(data: ProfileFormData) {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          display_name: data.display_name,
          email: data.email,
          phone_number: data.phone_number,
          bio: data.bio,
          recovery_start_date: data.recovery_start_date ? format(data.recovery_start_date, 'yyyy-MM-dd') : null,
          recovery_type: data.recovery_type,
          timezone: data.timezone,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  const calculateCleanTime = () => {
    if (!recoveryStartDate) return null;
    const days = Math.floor((new Date().getTime() - recoveryStartDate.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const cleanDays = calculateCleanTime();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            This information will be visible to providers and help other users find you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                placeholder="John Doe"
                {...register("full_name")}
                className={errors.full_name ? "border-red-500" : ""}
              />
              {errors.full_name && (
                <p className="text-sm text-red-500">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                placeholder="John D."
                {...register("display_name")}
                className={errors.display_name ? "border-red-500" : ""}
              />
              {errors.display_name && (
                <p className="text-sm text-red-500">{errors.display_name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register("email")}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number *</Label>
            <PhoneInputValidated
              value={watch("phone_number")}
              onChange={(value) => setValue("phone_number", value)}
              error={errors.phone_number?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us a bit about yourself..."
              {...register("bio")}
              rows={4}
              className={errors.bio ? "border-red-500" : ""}
            />
            {errors.bio && (
              <p className="text-sm text-red-500">{errors.bio.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {watch("bio")?.length || 0}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recovery Information</CardTitle>
          <CardDescription>
            This helps us provide better support and celebrate your milestones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Recovery Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !recoveryStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {recoveryStartDate ? format(recoveryStartDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={recoveryStartDate}
                    onSelect={(date) => setValue("recovery_start_date", date as Date)}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {cleanDays !== null && (
                <p className="text-sm text-green-600 font-medium">
                  {cleanDays} days clean! 🎉
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recovery_type">Recovery Type</Label>
              <Select
                value={watch("recovery_type")}
                onValueChange={(value: any) => setValue("recovery_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alcohol">Alcohol</SelectItem>
                  <SelectItem value="drugs">Drugs</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={watch("timezone")}
              onValueChange={(value) => setValue("timezone", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="America/Phoenix">Arizona Time</SelectItem>
                <SelectItem value="Pacific/Honolulu">Hawaii Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium">Current Privacy Settings</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Crisis Alerts: {profile?.enable_crisis_alerts ? 'Enabled' : 'Disabled'}</p>
              <p>Family Notifications: {profile?.enable_family_notifications ? 'Enabled' : 'Disabled'}</p>
              <p>HIPAA Consent: {profile?.hipaa_consent_given ? 'Given' : 'Not Given'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Profile"
        )}
      </Button>
    </form>
  );
}

