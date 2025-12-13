import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/dashboard/Agents";
import AgentChat from "./pages/dashboard/AgentChat";
import Chat from "./pages/dashboard/Chat";
import Billing from "./pages/dashboard/Billing";
import Performance from "./pages/dashboard/Performance";
import Settings from "./pages/dashboard/Settings";
import Positioning from "./pages/dashboard/Positioning";
import Campaigns from "./pages/dashboard/Campaigns";
import CopyResults from "./pages/dashboard/CopyResults";
import Headlines from "./pages/dashboard/Headlines";
import Insights from "./pages/dashboard/Insights";
import Library from "./pages/dashboard/Library";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/Users";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminDiscounts from "./pages/admin/Discounts";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminAgentConfig from "./pages/admin/AgentConfig";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminKnowledgeBase from "./pages/admin/KnowledgeBase";
import AdminModels from "./pages/admin/Models";
import NotFound from "./pages/NotFound";
import './i18n/config';

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/agents" element={<Agents />} />
              <Route path="/dashboard/agents/:slug" element={<AgentChat />} />
              <Route path="/dashboard/chat" element={<Chat />} />
              <Route path="/dashboard/billing" element={<Billing />} />
              <Route path="/dashboard/performance" element={<Performance />} />
              <Route path="/dashboard/settings" element={<Settings />} />
              <Route path="/dashboard/positioning" element={<Positioning />} />
              <Route path="/dashboard/campaigns" element={<Campaigns />} />
              <Route path="/dashboard/copy-results" element={<CopyResults />} />
              <Route path="/dashboard/headlines" element={<Headlines />} />
              <Route path="/dashboard/insights" element={<Insights />} />
              <Route path="/dashboard/library" element={<Library />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/discounts" element={<AdminDiscounts />} />
              <Route path="/admin/agents" element={<AdminAgents />} />
              <Route path="/admin/agents/:slug" element={<AdminAgentConfig />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/knowledge-base" element={<AdminKnowledgeBase />} />
              <Route path="/admin/models" element={<AdminModels />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;