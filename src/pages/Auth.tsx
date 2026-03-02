import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useMetaPixel } from '@/hooks/useMetaPixel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import logoDark from '@/assets/logo-dark.png';
import logoLight from '@/assets/logo-light.png';
import { useTheme } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { z } from 'zod';
const signupSchema = z.object({
  firstName: z.string().trim().min(2, {
    message: "Nome deve ter no mínimo 2 caracteres"
  }).max(50, {
    message: "Nome muito longo"
  }),
  email: z.string().trim().email({
    message: "Email inválido"
  }).max(255),
  password: z.string().min(8, {
    message: "Senha deve ter no mínimo 8 caracteres"
  }).max(100),
  phone: z.string().trim().min(8, {
    message: "Telefone inválido"
  }).optional()
});
const loginSchema = z.object({
  email: z.string().trim().email({
    message: "Email inválido"
  }),
  password: z.string().min(1, {
    message: "Senha é obrigatória"
  })
});
const Auth = () => {
  const {
    t
  } = useTranslation();
  const {
    theme
  } = useTheme();
  const navigate = useNavigate();
  const {
    login,
    signup,
    isAuthenticated,
    isLoading: isAuthLoading
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const { trackCompleteRegistration } = useMetaPixel();
  useEffect(() => {
    // Se o carregamento terminou e o usuário está autenticado, redireciona.
    if (!isAuthLoading && isAuthenticated) {
      navigate('/dashboard', {
        replace: true
      });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const validatedData = loginSchema.parse({
        email: loginEmail,
        password: loginPassword
      });
      await login(validatedData.email, validatedData.password);
      toast.success(t('auth.loginSuccess'));
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        setIsSubmitting(false);
        return;
      }
      toast.error(t('auth.loginError'));
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const validatedData = signupSchema.parse({
        firstName: signupFirstName,
        email: signupEmail,
        password: signupPassword,
        phone: signupPhone
      });
      await signup({
        firstName: validatedData.firstName,
        email: validatedData.email,
        password: validatedData.password,
        phone: validatedData.phone || ''
      });
      
      // Track Meta Pixel CompleteRegistration on successful signup
      trackCompleteRegistration({ status: true });
      
      toast.success(t('auth.signupSuccess'));
      toast.info(t('auth.verifyEmailNotice'));
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        setIsSubmitting(false);
        return;
      }
      toast.error(t('auth.signupError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se estiver carregando, mostra o spinner.
  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }

  // Se o carregamento terminou e o usuário está autenticado, não renderiza o formulário (o useEffect já redirecionou).
  if (isAuthenticated) {
    return null;
  }
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
          <CardTitle className="text-2xl text-center">{t('auth.welcome')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.subtitle')}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('auth.email')}</Label>
                  <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t('auth.password')}</Label>
                  <Input id="login-password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                </div>
                
                <Button type="button" variant="link" className="p-0 h-auto" onClick={() => navigate('/reset-password')}>
                  {t('auth.forgotPassword')}
                </Button>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.loginButton')}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstname">{t('auth.firstName')}</Label>
                  <Input id="signup-firstname" type="text" placeholder="John" value={signupFirstName} onChange={e => setSignupFirstName(e.target.value)} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
                  <Input id="signup-email" type="email" placeholder="you@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
                  <Input id="signup-password" type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required minLength={8} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">{t('auth.phone')}</Label>
                  <PhoneInput id="signup-phone" international defaultCountry="US" value={signupPhone} onChange={value => setSignupPhone(value || '')} className="phone-input" required />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.signupButton')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;