import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProfileSettings } from "./ProfileSettings";
import { RecoverySettings } from "./RecoverySettings";
import { NotificationPreferences } from "../notifications/NotificationPreferences";
import { SupportNetworkSettings } from "./SupportNetworkSettings";
import { AccountSecurity } from "./AccountSecurity";
import { PrivacySettings } from "./PrivacySettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { CrisisPreferences } from "./CrisisPreferences";
import { ResourcesSettings } from "./ResourcesSettings";
import { User, Shield, Bell, Users, Lock, ArrowLeft, Calendar, Heart, Sparkles, Eye, Palette, AlertTriangle, BookOpen } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FloatingCrisisButton } from "@/components/FloatingCrisisButton";
import { Card, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

export function SettingsLayout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get("tab") || "recovery";
  const [cleanDate, setCleanDate] = useState<Date | null>(null);
  const [recoveryWhy, setRecoveryWhy] = useState<string>('');

  useEffect(() => {
    const savedCleanDate = localStorage.getItem('serenity-clean-date');
    const savedWhy = localStorage.getItem('serenity-recovery-why');
    
    if (savedCleanDate) {
      setCleanDate(new Date(savedCleanDate));
    }
    if (savedWhy) {
      setRecoveryWhy(savedWhy);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <FloatingCrisisButton />
      
      <div className="container max-w-4xl mx-auto py-6 space-y-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-purple-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Recovery Settings
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Your recovery, your way 💙
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Safety
          </Button>
        </div>

        {/* Recovery Stats Card */}
        {cleanDate && (
          <Card className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {Math.floor((new Date().getTime() - cleanDate.getTime()) / (1000 * 60 * 60 * 24))} Days Strong
                  </h2>
                  <p className="text-purple-600 dark:text-purple-400">
                    Clean since {format(cleanDate, 'MMMM d, yyyy')}
                  </p>
                </div>
                <Calendar className="w-12 h-12 text-purple-500" />
              </div>
              {recoveryWhy && (
                <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Your Why:</p>
                  <p className="text-purple-600 dark:text-purple-400 italic">"{recoveryWhy}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 gap-2 h-auto p-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <TabsTrigger value="recovery" className="flex items-center gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Recovery</span>
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="crisis" className="flex items-center gap-2 data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Crisis</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2 data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Resources</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-700">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recovery">
            <RecoverySettings cleanDate={cleanDate} setCleanDate={setCleanDate} recoveryWhy={recoveryWhy} setRecoveryWhy={setRecoveryWhy} />
          </TabsContent>

          <TabsContent value="network">
            <SupportNetworkSettings />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationPreferences />
          </TabsContent>

          <TabsContent value="crisis">
            <CrisisPreferences />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacySettings />
          </TabsContent>

          <TabsContent value="appearance">
            <AppearanceSettings />
          </TabsContent>

          <TabsContent value="resources">
            <ResourcesSettings />
          </TabsContent>

          <TabsContent value="security">
            <AccountSecurity />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

