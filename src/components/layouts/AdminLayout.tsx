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
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import logoDark from '@/assets/logo-dark.png';
import logoLight from '@/assets/logo-light.png';
import { useTheme } from '@/components/ThemeProvider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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

  const menuItems = [
    { icon: LayoutDashboard, label: t('admin.menu.overview'), path: '/admin' },
    { icon: Users, label: t('admin.menu.users'), path: '/admin/users' },
    { icon: BarChart3, label: t('admin.menu.analytics'), path: '/admin/analytics' },
    { icon: Percent, label: t('admin.menu.discounts'), path: '/admin/discounts' },
    { icon: Bot, label: t('admin.menu.agents'), path: '/admin/agents' },
    { icon: BookOpen, label: t('admin.knowledgeBase.title'), path: '/admin/knowledge-base' },
    { icon: Brain, label: t('admin.models.title'), path: '/admin/models' },
    { icon: Settings, label: t('admin.menu.settings'), path: '/admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <img 
          src={theme === 'dark' ? logoDark : logoLight} 
          alt="CopyMonster" 
          className="h-8"
        />
        <div className="mt-2 text-xs text-muted-foreground">Admin Panel</div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <Button
          variant="ghost"
          className="w-full justify-start mb-4"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('admin.backToDashboard')}
        </Button>
        
        {menuItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate(item.path)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-sm mb-4">
          <p className="font-medium">{user?.first_name}</p>
          <p className="text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-primary mt-1">Administrator</p>
        </div>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('admin.menu.logout')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
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