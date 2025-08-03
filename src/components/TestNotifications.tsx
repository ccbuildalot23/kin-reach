import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function TestNotifications() {
  const runTests = async () => {
    console.log('Starting notification tests...');
    
    try {
      // Test 1: Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        return;
      }
      console.log('Current user:', user);

      // Test 2: Create notification
      const { data, error } = await supabase.from('notifications').insert({
        recipient_id: user?.id,
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test notification!',
        priority: 'normal'
      });

      if (error) {
        console.error('Notification error:', error);
      } else {
        console.log('Notification created:', data);
      }

      // Test 3: Check notifications
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.log('Recent notifications:', notifications);

    } catch (err) {
      console.error('Test failed:', err);
    }
  };

  // Also expose to window for console access
  if (typeof window !== 'undefined') {
    (window as any).testNotifications = runTests;
    (window as any).supabase = supabase;
  }

  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="font-bold mb-2">Notification System Test</h3>
      <Button onClick={runTests}>
        Run Tests (Check Console)
      </Button>
      <p className="text-sm mt-2 text-gray-600">
        Or type `testNotifications()` in console
      </p>
    </div>
  );
}
