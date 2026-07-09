import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CookieConsentProvider } from "@/contexts/CookieConsentContext";
import { CookieManager } from "@/components/cookie/CookieManager";
import { MetaPixelTracker } from "@/components/tracking/MetaPixelTracker";
import { AuthHashHandler } from "@/components/AuthHashHandler";
import Index from "./pages/Index";
import Start from "./pages/Start";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/dashboard/Agents";
import AgentChat from "./pages/dashboard/AgentChat";
import Chat from "./pages/dashboard/Chat";
import ChatLanding from "./pages/ChatLanding";
import Billing from "./pages/dashboard/Billing";
import Performance from "./pages/dashboard/Performance";
import Settings from "./pages/dashboard/Settings";
import Positioning from "./pages/dashboard/Positioning";
import Campaigns from "./pages/dashboard/Campaigns";
import CopyResults from "./pages/dashboard/CopyResults";
import Library from "./pages/dashboard/Library";
import DnaUpdates from "./pages/dashboard/DnaUpdates";
import AdsIntelligence from "./pages/dashboard/AdsIntelligence";
import PerformanceOverview from "./pages/dashboard/PerformanceOverview";
import MarketRadar from "./pages/dashboard/MarketRadar";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/Users";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminDiscounts from "./pages/admin/Discounts";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminAgentConfig from "./pages/admin/AgentConfig";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminKnowledgeBase from "./pages/admin/KnowledgeBase";
import AdminModels from "./pages/admin/Models";
import AdminSubscriptions from "./pages/admin/Subscriptions";
import AdminMappings from "./pages/admin/PositioningMappings";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminCopyResults from "./pages/admin/AdminCopyResults";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import CookiePolicy from "./pages/legal/CookiePolicy";
import GDPR from "./pages/legal/GDPR";
import DataDeletionStatus from "./pages/legal/DataDeletionStatus";
import PartnersDashboard from "./pages/dashboard/partners/PartnersDashboard";
import AdminPartners from "./pages/admin/partners/Index";
import NotFound from "./pages/NotFound";
import './i18n/config';

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <CookieConsentProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <CookieManager />
              <MetaPixelTracker />
              <AuthHashHandler />
              <Routes>
                <Route path="/" element={<ChatLanding />} />
                <Route path="/start" element={<Index />} />
                <Route path="/home" element={<Start />} />
                <Route path="/chat" element={<ChatLanding />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                {/* Legal Pages */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/gdpr" element={<GDPR />} />
                <Route path="/legal/data-deletion-status" element={<DataDeletionStatus />} />
                {/* Dashboard - Protected */}
                <Route element={<ProtectedRoute />}>
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
                  <Route path="/dashboard/library" element={<Library />} />
                  <Route path="/dashboard/library/updates" element={<DnaUpdates />} />
                  <Route path="/dashboard/ads-intelligence" element={<AdsIntelligence />} />
                  <Route path="/dashboard/performance-overview" element={<PerformanceOverview />} />
                  <Route path="/dashboard/market-radar" element={<MarketRadar />} />
                </Route>
                {/* Admin - Protected + Admin Required */}
                <Route element={<ProtectedRoute requireAdmin />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/mappings" element={<AdminMappings />} />
                  <Route path="/admin/campaigns" element={<AdminCampaigns />} />
                  <Route path="/admin/copy-results" element={<AdminCopyResults />} />
                  
                  <Route path="/admin/discounts" element={<AdminDiscounts />} />
                  <Route path="/admin/agents" element={<AdminAgents />} />
                   <Route path="/admin/agents/:slug" element={<AdminAgentConfig />} />
                   <Route path="/admin/partners" element={<AdminPartners />} />
                   <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/knowledge-base" element={<AdminKnowledgeBase />} />
                  <Route path="/admin/models" element={<AdminModels />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CookieConsentProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;ault App;