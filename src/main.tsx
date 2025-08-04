import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/accessibility.css'
import { supabase } from "@/integrations/supabase/client";

// Make supabase available in browser console for testing
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  (window as any).__SUPABASE_CLIENT__ = supabase;
  
  // Test notification function
  (window as any).testNotif = async () => {
    const supabaseClient = (window as any).__SUPABASE_CLIENT__ || 
      (document.querySelector('#root') as any)?._reactRootContainer?._internalRoot?.current?.memoizedState?.element?.props?.supabase ||
      (window as any).supabase;
      
    if (!supabaseClient) {
      console.log('Looking for Supabase in React components...');
      return;
    }
    
    console.log('Found Supabase, testing...');
    const { data: { user } } = await supabaseClient.auth.getUser();
    console.log('User:', user);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
