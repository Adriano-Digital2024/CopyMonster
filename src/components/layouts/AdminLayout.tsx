import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Percent,
  Bot,
  Settings,
  LogOut,
  Menu,
  ArrowLeft,
  Loader2,
  BookOpen,
  Brain,
  CreditCard,
  Target,
  Megaphone,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import logoDark from '@/assets/logo-dark.png';
import logoLight from '@/assets/logo-light.png';
import { useTheme } from '@/components/ThemeProvider';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated || !user?.isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, user?.isAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Fallback para garantir que não renderize se não for admin
  if (!user?.isAdmin) {
    return null;
  }

  const menuSections = [
    {
      label: 'Overview',
      items: [
        { icon: LayoutDashboard, label: t('admin.menu.overview'), path: '/admin' },
        { icon: BarChart3, label: t('admin.menu.analytics'), path: '/admin/analytics' },
      ],
    },
    {
      label: 'Gestão',
      items: [
        { icon: Users, label: t('admin.menu.users'), path: '/admin/users' },
        { icon: CreditCard, label: 'Assinaturas', path: '/admin/subscriptions' },
        { icon: Percent, label: t('admin.menu.discounts'), path: '/admin/discounts' },
        { icon: Megaphone, label: 'Campanhas', path: '/admin/campaigns' },
        { icon: FileText, label: 'Copy Results', path: '/admin/copy-results' },
        { icon: Target, label: 'Mapeamentos', path: '/admin/mappings' },
      ],
    },
    {
      label: 'Conteúdo & IA',
      items: [
        { icon: Bot, label: t('admin.menu.agents'), path: '/admin/agents' },
        { icon: BookOpen, label: t('admin.knowledgeBase.title'), path: '/admin/knowledge-base' },
        { icon: Brain, label: t('admin.models.title'), path: '/admin/models' },
      ],
    },
    {
      label: 'Sistema',
      items: [
        { icon: Settings, label: t('admin.menu.settings'), path: '/admin/settings' },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-sidebar-surface">
      <div className="px-5 py-5 border-b border-border/60">
        <img src={theme === 'dark' ? logoDark : logoLight} alt="CopyMonster" className="h-8" />
        <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">Admin Panel</div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar space-y-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="nav-item"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left truncate">{t('admin.backToDashboard')}</span>
        </button>

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
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border/60">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
            {user?.first_name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.first_name}</p>
            <p className="text-[10px] uppercase tracking-wider text-primary">Administrator</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start mt-1 text-muted-foreground hover:text-foreground" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {t('admin.menu.logout')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
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
                <SheetTitle className="sr-only">Admin Menu</SheetTitle>
                <Sidebar />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-1 ml-auto">
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