import { useState } from 'react';
import { User, Settings as SettingsIcon, Shield, Key, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/components/ThemeProvider';
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = () => {
    toast({
      title: t('dashboard.settings.toast.profileSuccess'),
      description: t('dashboard.settings.toast.profileSuccessDesc')
    });
  };

  const handleSavePreferences = () => {
    toast({
      title: t('dashboard.settings.toast.preferencesSuccess'),
      description: t('dashboard.settings.toast.preferencesSuccessDesc')
    });
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: t('dashboard.settings.toast.passwordMismatch'),
        description: t('dashboard.settings.toast.passwordMismatchDesc'),
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: t('dashboard.settings.toast.passwordTooShort'),
        description: t('dashboard.settings.toast.passwordTooShortDesc'),
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: t('dashboard.settings.toast.passwordChanged'),
        description: t('dashboard.settings.toast.passwordChangedDesc')
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: t('dashboard.settings.toast.passwordError'),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('dashboard.settings.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.settings.subtitle')}
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.settings.tabs.profile')}</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.settings.tabs.preferences')}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.settings.tabs.security')}</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.settings.tabs.api')}</span>
            </TabsTrigger>
            <TabsTrigger value="danger" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.settings.tabs.danger')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('dashboard.settings.profile.title')}</h3>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">{t('dashboard.settings.profile.name')}</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">{t('dashboard.settings.profile.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">{t('dashboard.settings.profile.phone')}</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bio">{t('dashboard.settings.profile.bio')}</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={t('dashboard.settings.profile.bioPlaceholder')}
                      rows={4}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile}>{t('dashboard.settings.profile.save')}</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('dashboard.settings.preferences.title')}</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('dashboard.settings.preferences.language')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.settings.preferences.languageDesc')}
                      </p>
                    </div>
                    <Select
                      value={i18n.language}
                      onValueChange={(value) => i18n.changeLanguage(value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('dashboard.settings.preferences.theme')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.settings.preferences.themeDesc')}
                      </p>
                    </div>
                    <Select
                      value={theme}
                      onValueChange={(value: 'light' | 'dark') => setTheme(value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t('dashboard.settings.preferences.light')}</SelectItem>
                        <SelectItem value="dark">{t('dashboard.settings.preferences.dark')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('dashboard.settings.preferences.emailNotifications')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.settings.preferences.emailNotificationsDesc')}
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('dashboard.settings.preferences.browserNotifications')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.settings.preferences.browserNotificationsDesc')}
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Button onClick={handleSavePreferences}>{t('dashboard.settings.preferences.save')}</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('dashboard.settings.security.title')}</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">{t('dashboard.settings.security.currentPassword')}</Label>
                    <Input 
                      id="currentPassword" 
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">{t('dashboard.settings.security.newPassword')}</Label>
                    <Input 
                      id="newPassword" 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">{t('dashboard.settings.security.confirmPassword')}</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleChangePassword}>{t('dashboard.settings.security.changePassword')}</Button>
                </div>

                <div className="pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('dashboard.settings.security.twoFactor')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.settings.security.twoFactorDesc')}
                      </p>
                    </div>
                    <Button variant="outline">{t('dashboard.settings.security.setup2FA')}</Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('dashboard.settings.api.title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.settings.api.subtitle')}
                  </p>
                </div>

                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('dashboard.settings.api.comingSoon')}</p>
                  <p className="text-sm mt-1">{t('dashboard.settings.api.comingSoonDesc')}</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="danger">
            <Card className="p-6 border-destructive">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-destructive">{t('dashboard.settings.danger.title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.settings.danger.subtitle')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-destructive rounded-lg">
                    <h4 className="font-semibold mb-2">{t('dashboard.settings.danger.deleteAccount')}</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('dashboard.settings.danger.deleteAccountDesc')}
                    </p>
                    <Button variant="destructive">{t('dashboard.settings.danger.deleteAccountButton')}</Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}