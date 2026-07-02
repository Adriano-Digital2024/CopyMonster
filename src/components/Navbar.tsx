import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { Menu, X, Github } from 'lucide-react';
import logoLight from '@/assets/logo-light.png';
import logoDark from '@/assets/logo-dark.png';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
export const Navbar = () => {
  const {
    t
  } = useTranslation();
  const {
    theme
  } = useTheme();
  const navigate = useNavigate();
  const {
    isAuthenticated
  } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const navLinks = [{
    key: 'features',
    href: '#agents'
  }, {
    key: 'pricing',
    href: '#pricing'
  }, {
    key: 'testimonials',
    href: '#testimonials'
  }];
  return <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/95 backdrop-blur-md border-b border-border/50' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <img src={theme === 'dark' ? logoDark : logoLight} alt="CopyMonster" className="h-14" />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => <a key={link.key} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t(`nav.${link.key}`)}
              </a>)}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              asChild
            >
              <a
                href="https://github.com/Adriano-Digital2024/CopyMonster"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
              >
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </a>
            </Button>
            {isAuthenticated ? <Button className="gradient-primary" onClick={() => navigate('/dashboard')}>
                {t('nav.dashboard')}
              </Button> : <Button className="gradient-primary" onClick={() => navigate('/auth')}>
                {t('nav.startTrial')}
              </Button>}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              asChild
            >
              <a
                href="https://github.com/Adriano-Digital2024/CopyMonster"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
              >
                <Github className="h-5 w-5" />
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && <motion.div initial={{
        opacity: 0,
        height: 0
      }} animate={{
        opacity: 1,
        height: 'auto'
      }} exit={{
        opacity: 0,
        height: 0
      }} className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navLinks.map(link => <a key={link.key} href={link.href} className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  {t(`nav.${link.key}`)}
                </a>)}
              {isAuthenticated ? <Button className="w-full gradient-primary" onClick={() => navigate('/dashboard')}>
                  {t('nav.dashboard')}
                </Button> : <Button className="w-full gradient-primary" onClick={() => navigate('/auth')}>
                  {t('nav.startTrial')}
                </Button>}
              <a
                href="https://github.com/Adriano-Digital2024/CopyMonster"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>
          </motion.div>}
      </AnimatePresence>
    </nav>;
};