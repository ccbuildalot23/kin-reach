import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from "@/integrations/supabase/client";

// Add this line to make supabase available in console for testing
if (process.env.NODE_ENV === 'development') {
  (window as any).supabase = supabase;
}

createRoot(document.getElementById("root")!).render(<App />);
