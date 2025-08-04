import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Heart, Feather, Sun, Sparkles } from 'lucide-react';

export const SupportRequestTest = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const supportModes = [
    {
      id: 'comfort',
      label: 'Need Comfort',
      icon: Heart,
      message: 'I could use some comfort and understanding right now',
    },
    {
      id: 'listen',
      label: 'Someone to Listen',
      icon: Feather,
      message: 'I need someone to listen without judgment',
    },
    {
      id: 'guidance',
      label: 'Gentle Guidance',
      icon: Sun,
      message: 'I could use some gentle guidance',
    },
    {
      id: 'presence',
      label: 'Just Be With Me',
      icon: Sparkles,
      message: 'I just need to know someone cares',
    }
  ];

  const testSupportRequest = async (mode: any) => {
    if (!user) return;
    
    setTesting(true);
    const newResults: string[] = [];

    try {
      // 1. Check if user has support network
      const { data: supportMembers, error: networkError } = await supabase
        .from('support_network')
        .select('supporter_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (networkError) {
        newResults.push(`❌ ${mode.label}: Failed to load support network - ${networkError.message}`);
        setResults(prev => [...prev, ...newResults]);
        setTesting(false);
        return;
      }

      if (!supportMembers || supportMembers.length === 0) {
        newResults.push(`⚠️ ${mode.label}: No support network members found. Add some first!`);
        setResults(prev => [...prev, ...newResults]);
        setTesting(false);
        return;
      }

      newResults.push(`✅ ${mode.label}: Found ${supportMembers.length} support network members`);

      // 2. Create notifications
      const titles = {
        'comfort': '💙 Someone needs comfort',
        'listen': '👂 Someone needs someone to listen', 
        'guidance': '☀️ Someone needs gentle guidance',
        'presence': '✨ Someone needs presence'
      };

      const notifications = supportMembers.map(member => ({
        recipient_id: member.supporter_id,
        sender_id: user.id,
        type: 'support_request',
        title: titles[mode.id] || 'Support request',
        message: mode.message,
        priority: 'high',
        data: {
          support_type: mode.id,
          timestamp: new Date().toISOString()
        }
      }));

      const { data: createdNotifications, error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (notificationError) {
        newResults.push(`❌ ${mode.label}: Failed to create notifications - ${notificationError.message}`);
      } else {
        newResults.push(`✅ ${mode.label}: Created ${createdNotifications?.length || 0} notifications successfully`);
      }

      setResults(prev => [...prev, ...newResults]);
      
      toast({
        title: `Test completed for ${mode.label}`,
        description: `Check the results below`,
      });

    } catch (error) {
      newResults.push(`❌ ${mode.label}: Unexpected error - ${error}`);
      setResults(prev => [...prev, ...newResults]);
    }

    setTesting(false);
  };

  const clearResults = () => setResults([]);

  const testAllButtons = async () => {
    setTesting(true);
    setResults([]);
    
    for (const mode of supportModes) {
      await testSupportRequest(mode);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setTesting(false);
  };

  const checkDatabase = async () => {
    if (!user) return;
    
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'support_request')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        toast({
          title: "Database check failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setResults(prev => [
        ...prev,
        `📊 Database Check: Found ${notifications?.length || 0} support request notifications`,
        ...notifications?.map(n => `   - ${n.title} (${new Date(n.created_at).toLocaleString()})`) || []
      ]);

    } catch (error) {
      setResults(prev => [...prev, `❌ Database check failed: ${error}`]);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">🧪 Support Request Button Test</h3>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        {supportModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Button
              key={mode.id}
              onClick={() => testSupportRequest(mode)}
              disabled={testing}
              className="flex items-center gap-2 p-3"
              variant="outline"
            >
              <Icon className="w-4 h-4" />
              Test {mode.label}
            </Button>
          );
        })}
      </div>

      <div className="flex gap-2 mb-4">
        <Button onClick={testAllButtons} disabled={testing} className="flex-1">
          {testing ? 'Testing...' : 'Test All 4 Buttons'}
        </Button>
        <Button onClick={checkDatabase} variant="outline">
          Check Database
        </Button>
        <Button onClick={clearResults} variant="outline">
          Clear Results
        </Button>
      </div>

      {results.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          <h4 className="font-medium mb-2">Test Results:</h4>
          <div className="space-y-1 text-sm font-mono">
            {results.map((result, index) => (
              <div key={index} className={"" + 
                result.includes('❌') ? 'text-red-600' : 
                result.includes('✅') ? 'text-green-600' :
                result.includes('⚠️') ? 'text-yellow-600' :
                'text-gray-600'
               + ""}>
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};