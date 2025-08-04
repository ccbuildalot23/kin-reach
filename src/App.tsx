import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotificationSettings from "./pages/NotificationSettings";
import ProfileSettings from "./pages/ProfileSettings";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { CrisisAlert } from "@/pages/CrisisAlert";
import { SMSTesting } from "@/pages/SMSTesting";
import Sounds from "./pages/Sounds";
import Contacts from "./pages/Contacts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/sms-testing" element={<SMSTesting />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/notifications" element={<NotificationSettings />} />
            <Route path="/settings/profile" element={<ProfileSettings />} />
            <Route path="/crisis-alert" element={<CrisisAlert />} />
            <Route path="/peace-library" element={<Sounds />} />
            <Route path="/support-team" element={<Contacts />} />
            {/* Legacy routes for backward compatibility */}
            <Route path="/sounds" element={<Sounds />} />
            <Route path="/contacts" element={<Contacts />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
