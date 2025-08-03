import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotificationSettings from "./pages/NotificationSettings";
import ProfileSettings from "./pages/ProfileSettings";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { CrisisAlert } from "@/pages/CrisisAlert";
import { SMSTesting } from "@/pages/SMSTesting";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/sms-testing" element={<SMSTesting />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/notifications" element={<NotificationSettings />} />
          <Route path="/settings/profile" element={<ProfileSettings />} />
          <Route path="/crisis-alert" element={<CrisisAlert />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
