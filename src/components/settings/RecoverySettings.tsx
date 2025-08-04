import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Heart, Trophy, Sparkles, Target, Clock, Book } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface RecoverySettingsProps {
  cleanDate: Date | null;
  setCleanDate: (date: Date | null) => void;
  recoveryWhy: string;
  setRecoveryWhy: (why: string) => void;
}

export function RecoverySettings({ cleanDate, setCleanDate, recoveryWhy, setRecoveryWhy }: RecoverySettingsProps) {
  const [tempCleanDate, setTempCleanDate] = React.useState(cleanDate ? format(cleanDate, 'yyyy-MM-dd') : '');
  const [tempWhy, setTempWhy] = React.useState(recoveryWhy);
  const [dailyCheckIn, setDailyCheckIn] = React.useState(localStorage.getItem('serenity-checkin-time') || '09:00');
  const [recoveryProgram, setRecoveryProgram] = React.useState(localStorage.getItem('serenity-program') || '');

  const handleSaveRecoveryDate = () => {
    if (tempCleanDate) {
      const newDate = new Date(tempCleanDate);
      setCleanDate(newDate);
      localStorage.setItem('serenity-clean-date', newDate.toISOString());
      toast({
        title: "🌟 Recovery date updated",
        description: "Your journey is honored and celebrated",
        className: "bg-purple-100 text-purple-900 border-purple-200",
      });
    }
  };

  const handleSaveWhy = () => {
    setRecoveryWhy(tempWhy);
    localStorage.setItem('serenity-recovery-why', tempWhy);
    toast({
      title: "💙 Your why is powerful",
      description: "Keep it close to your heart",
      className: "bg-purple-100 text-purple-900 border-purple-200",
    });
  };

  const handleSaveCheckIn = () => {
    localStorage.setItem('serenity-checkin-time', dailyCheckIn);
    toast({
      title: "⏰ Check-in time set",
      description: `Daily reminder at ${dailyCheckIn}`,
      className: "bg-green-100 text-green-900 border-green-200",
    });
  };

  const handleSaveProgram = () => {
    localStorage.setItem('serenity-program', recoveryProgram);
    toast({
      title: "✅ Program saved",
      description: "Your recovery path is unique and valid",
      className: "bg-blue-100 text-blue-900 border-blue-200",
    });
  };

  const milestones = [
    { days: 1, label: "24 Hours", icon: "🌱", message: "The first day is the bravest" },
    { days: 7, label: "1 Week", icon: "🌿", message: "You're building new habits" },
    { days: 30, label: "30 Days", icon: "🌳", message: "A month of strength" },
    { days: 90, label: "90 Days", icon: "🌲", message: "New neural pathways formed" },
    { days: 365, label: "1 Year", icon: "🌟", message: "A year of miracles" },
  ];

  const getDaysClean = () => {
    if (!cleanDate) return 0;
    return Math.floor((new Date().getTime() - cleanDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getNextMilestone = () => {
    const days = getDaysClean();
    return milestones.find(m => m.days > days) || milestones[milestones.length - 1];
  };

  return (
    <div className="space-y-6">
      {/* Recovery Date */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Calendar className="h-5 w-5" />
            My Recovery Date
          </CardTitle>
          <CardDescription>
            The day your new life began
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clean-date">Clean Date</Label>
            <div className="flex gap-2">
              <Input
                id="clean-date"
                type="date"
                value={tempCleanDate}
                onChange={(e) => setTempCleanDate(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSaveRecoveryDate} className="bg-purple-600 hover:bg-purple-700">
                Save
              </Button>
            </div>
          </div>
          
          {cleanDate && (
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-purple-700">{getDaysClean()} Days</p>
                <p className="text-purple-600">Of courage and growth</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Next Milestone:</p>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-2xl">{getNextMilestone().icon}</span>
                  <div className="text-right">
                    <p className="font-medium text-purple-700">{getNextMilestone().label}</p>
                    <p className="text-xs text-purple-600">{getNextMilestone().message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Why */}
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-700">
            <Heart className="h-5 w-5" />
            My Why
          </CardTitle>
          <CardDescription>
            Your reason for choosing recovery - keep it close
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recovery-why">Why I Choose Recovery</Label>
            <Textarea
              id="recovery-why"
              value={tempWhy}
              onChange={(e) => setTempWhy(e.target.value)}
              placeholder="For my family, for my future, for myself..."
              rows={4}
              className="resize-none"
            />
            <Button onClick={handleSaveWhy} className="w-full bg-pink-600 hover:bg-pink-700">
              <Heart className="w-4 h-4 mr-2" />
              Save My Why
            </Button>
          </div>
          
          <div className="p-4 bg-pink-50 rounded-lg">
            <p className="text-sm text-pink-700 italic">
              "When things get tough, remember why you started. Your why is your anchor."
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Daily Check-in */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Clock className="h-5 w-5" />
            Daily Check-in
          </CardTitle>
          <CardDescription>
            Set a daily reminder to check in with yourself
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checkin-time">Check-in Time</Label>
            <div className="flex gap-2">
              <Input
                id="checkin-time"
                type="time"
                value={dailyCheckIn}
                onChange={(e) => setDailyCheckIn(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSaveCheckIn} className="bg-blue-600 hover:bg-blue-700">
                Set Reminder
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Daily check-ins help you stay connected to your recovery and catch warning signs early.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Program */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Book className="h-5 w-5" />
            Recovery Program
          </CardTitle>
          <CardDescription>
            What recovery path are you following?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="program">Program (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="program"
                value={recoveryProgram}
                onChange={(e) => setRecoveryProgram(e.target.value)}
                placeholder="AA, NA, SMART Recovery, etc."
                className="flex-1"
              />
              <Button onClick={handleSaveProgram} className="bg-green-600 hover:bg-green-700">
                Save
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 font-medium mb-2">
              All paths to recovery are valid 💚
            </p>
            <p className="text-xs text-green-600">
              Whether it's a 12-step program, therapy, medication, or your own path - what matters is that it works for you.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Affirmation */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-100 to-pink-100">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-purple-700 mb-2">
            Today's Affirmation
          </p>
          <p className="text-purple-600 italic">
            "I am not defined by my past. I am empowered by my decision to change."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}