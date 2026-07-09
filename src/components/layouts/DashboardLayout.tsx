import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, CreditCard, Trophy, Settings, LogOut, Menu, Loader2, Target, Rocket, FileText, Book, BarChart3, Activity, Radar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import logoDark from '@/assets/logo-dark.png';
import logoLight from '@/assets/logo-light.png';
import { useTheme } from '@/components/ThemeProvider';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { TrialExpiredModal } from '@/components/trial/TrialExpiredModal';
import { NotificationBell } from '@/components/dashboard/NotificationBell';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, logout, isAuthenticated, isLoading, isTrialExpired, canUseAgents } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showBlockingModal, setShowBlockingModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Check if user should be blocked from using agents (admins never blocked)
  useEffect(() => {
    if (!isLoading && user) {
      // Admins are NEVER blocked - they have unlimited access
      if (user.isAdmin) {
        setShowBlockingModal(false);
        return;
      }
      
      // Only block on pages that use agents (not billing, settings, etc.)
      const agentPages = [
        '/dashboard/agents',
        '/dashboard/positioning',
        '/dashboard/agent-chat',
        '/dashboard/chat',
      ];
      
      const isAgentPage = agentPages.some(page => location.pathname.startsWith(page));
      
      if (isAgentPage && !canUseAgents) {
        setShowBlockingModal(true);
      } else {
        setShowBlockingModal(false);
      }
    }
  }, [isLoading, user, canUseAgents, location.pathname]);

  // Mostra um spinner de carregamento enquanto o estado de autenticação está sendo determinado
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não estiver autenticado após o carregamento, retorna null (o useEffect já redirecionou)
  if (!isAuthenticated) {
    return null;
  }

  const menuSections = [
    {
      label: 'Workspace',
      items: [
        { icon: Target, label: t('dashboard.menu.positioning'), path: '/dashboard/positioning', highlight: true },
        { icon: LayoutDashboard, label: t('dashboard.menu.overview'), path: '/dashboard' },
        { icon: Users, label: t('dashboard.menu.agents'), path: '/dashboard/agents' },
        { icon: Rocket, label: t('dashboard.menu.campaigns'), path: '/dashboard/campaigns' },
        { icon: FileText, label: t('dashboard.menu.copyResults'), path: '/dashboard/copy-results' },
        { icon: Book, label: t('dashboard.menu.library'), path: '/dashboard/library' },
        { icon: Trophy, label: t('dashboard.menu.performance'), path: '/dashboard/performance' },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { icon: BarChart3, label: t('dashboard.menu.adsIntelligence'), path: '/dashboard/ads-intelligence', comingSoon: true },
        { icon: Activity, label: t('dashboard.menu.performanceOverview'), path: '/dashboard/performance-overview', comingSoon: true },
        { icon: Radar, label: t('dashboard.menu.marketRadar'), path: '/dashboard/market-radar', comingSoon: true },
      ],
    },
    {
      label: 'Account',
      items: [
        { icon: Users, label: t('partners.title'), path: '/dashboard/partners' },
        { icon: CreditCard, label: t('dashboard.menu.billing'), path: '/dashboard/billing' },
        { icon: Settings, label: t('dashboard.menu.settings'), path: '/dashboard/settings' },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-sidebar-surface">
      <div className="px-5 py-5 border-b border-border/60">
        <img src={theme === 'dark' ? logoDark : logoLight} alt="CopyMonster" className="h-10" />
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar space-y-6">
        {menuSections.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`nav-item ${active ? 'nav-item-active' : ''}`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.highlight && (
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-primary border border-primary/40 px-1.5 py-0.5 rounded">
                      Start
                    </span>
                  )}
                  {item.comingSoon && (
                    <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground border border-border px-1.5 py-0.5 rounded">
                      Em breve
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border/60">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
            {user?.first_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.first_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.credits} {t('dashboard.credits')}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start mt-1 text-muted-foreground hover:text-foreground" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {t('dashboard.menu.logout')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Trial/Credits Expired Modal */}
      <TrialExpiredModal 
        open={showBlockingModal} 
        type={isTrialExpired ? 'trial_expired' : 'no_credits'} 
      />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r border-border/60">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4 lg:px-8">
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Sidebar />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-1 ml-auto">
              <NotificationBell />
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="px-4 py-6 lg:px-10 lg:py-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
