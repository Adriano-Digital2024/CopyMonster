import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Github } from 'lucide-react';
import logoDark from '@/assets/logo-dark.png';
import logoLight from '@/assets/logo-light.png';
import { useTheme } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
const ResetPassword = () => {
  const {
    t
  } = useTranslation();
  const {
    theme
  } = useTheme();
  const navigate = useNavigate();
  const {
    resetPassword
  } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
      toast.success(t('auth.resetEmailSent'));
    } catch (error) {
      toast.error(t('auth.resetError'));
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute top-4 right-4 flex gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md card-shadow">
        <CardHeader className="space-y-4">
          <div className="flex justify-center mb-4">
            <img src={theme === 'dark' ? logoDark : logoLight} alt="CopyMonster" className="h-14" />
          </div>
          <CardTitle className="text-2xl text-center">{t('auth.resetPassword')}</CardTitle>
          <CardDescription className="text-center">
            {emailSent ? t('auth.resetEmailSentDescription') : t('auth.resetPasswordDescription')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!emailSent ? <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.sendResetLink')}
              </Button>
            </form> : <Button onClick={() => navigate('/auth')} className="w-full">
              {t('auth.backToLogin')}
            </Button>}
          
          <Button variant="ghost" className="w-full" onClick={() => navigate('/auth')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('auth.backToLogin')}
          </Button>
        </CardContent>
      </Card>
    </div>;
};
export default ResetPassword;