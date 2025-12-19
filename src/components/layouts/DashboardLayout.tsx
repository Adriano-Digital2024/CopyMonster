import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, CreditCard, Trophy, Settings, LogOut, Menu, Loader2, Target, Rocket, FileText, Newspaper, Lightbulb, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import logoDark from '@/assets/logo-dark.png';
import logoLight from '@/assets/logo-light.png';
import { useTheme } from '@/components/ThemeProvider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { TrialExpiredModal } from '@/components/trial/TrialExpiredModal';

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

  // Check if user should be blocked from using agents
  useEffect(() => {
    if (!isLoading && user) {
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

  const menuItems = [
    { icon: Target, label: t('dashboard.menu.positioning'), path: '/dashboard/positioning', highlight: true },
    { icon: LayoutDashboard, label: t('dashboard.menu.overview'), path: '/dashboard' },
    { icon: Users, label: t('dashboard.menu.agents'), path: '/dashboard/agents' },
    { icon: Rocket, label: t('dashboard.menu.campaigns'), path: '/dashboard/campaigns' },
    { icon: FileText, label: t('dashboard.menu.copyResults'), path: '/dashboard/copy-results' },
    { icon: Newspaper, label: t('dashboard.menu.headlines'), path: '/dashboard/headlines' },
    { icon: Lightbulb, label: t('dashboard.menu.insights'), path: '/dashboard/insights' },
    { icon: Book, label: t('dashboard.menu.library'), path: '/dashboard/library' },
    { icon: Trophy, label: t('dashboard.menu.performance'), path: '/dashboard/performance' },
    { icon: CreditCard, label: t('dashboard.menu.billing'), path: '/dashboard/billing' },
    { icon: Settings, label: t('dashboard.menu.settings'), path: '/dashboard/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <img src={theme === 'dark' ? logoDark : logoLight} alt="CopyMonster" className="h-14" />
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => (
          <Button 
            key={item.path} 
            variant={item.highlight ? "default" : "ghost"} 
            className={`w-full justify-start ${item.highlight ? 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30' : ''}`} 
            onClick={() => navigate(item.path)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
            {item.highlight && index === 0 && (
              <span className="ml-auto text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                Start
              </span>
            )}
          </Button>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-sm mb-4">
          <p className="font-medium">{user?.first_name}</p>
          <p className="text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {user?.credits} {t('dashboard.credits')}
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={handleLogout}>
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
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r border-border bg-card">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-card">
          <div className="flex h-16 items-center justify-between px-4">
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 ml-auto">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
