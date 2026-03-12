import { useState, useEffect, useCallback } from 'react';
import { User, Settings as SettingsIcon, Shield, Key, AlertTriangle, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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

  // Meta integration state
  type MetaStatusType = 'disconnected' | 'connected' | 'token_expired' | 'permission_revoked' | 'rate_limited' | 'error' | 'loading';
  const [metaStatus, setMetaStatus] = useState<MetaStatusType>('loading');
  const [metaIntegration, setMetaIntegration] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchMetaIntegration = useCallback(async () => {
    const { data } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('provider', 'meta')
      .maybeSingle();
    
    if (data) {
      const status = data.status as MetaStatusType;
      setMetaStatus(['connected', 'token_expired', 'permission_revoked', 'rate_limited', 'error'].includes(status) ? status : 'disconnected');
      setMetaIntegration(data);
    } else {
      setMetaStatus('disconnected');
      setMetaIntegration(null);
    }
  }, []);

  useEffect(() => {
    // Check for OAuth redirect query params
    const urlParams = new URLSearchParams(window.location.search);
    const metaParam = urlParams.get('meta');
    if (metaParam === 'success') {
      toast({
        title: t('dashboard.settings.integrations.success.connected'),
        description: t('dashboard.settings.integrations.success.connectedDesc'),
      });
      setIsConnecting(false);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (metaParam === 'error') {
      toast({
        title: t('dashboard.settings.integrations.errors.connectFailed'),
        description: t('dashboard.settings.integrations.errors.connectFailedDesc'),
        variant: 'destructive',
      });
      setIsConnecting(false);
      window.history.replaceState({}, '', window.location.pathname);
    }

    fetchMetaIntegration();

    // Listen for OAuth callback messages (popup mode)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'meta-oauth-success') {
        toast({
          title: t('dashboard.settings.integrations.success.connected'),
          description: t('dashboard.settings.integrations.success.connectedDesc'),
        });
        fetchMetaIntegration();
        setIsConnecting(false);
      } else if (event.data?.type === 'meta-oauth-error') {
        toast({
          title: t('dashboard.settings.integrations.errors.connectFailed'),
          description: t('dashboard.settings.integrations.errors.connectFailedDesc'),
          variant: 'destructive',
        });
        setIsConnecting(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchMetaIntegration, toast, t]);

  const handleConnectMeta = async () => {
    setIsConnecting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('No session');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/meta-oauth?action=authorize`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      const data = await res.json();
      if (data.url) {
        const popup = window.open(data.url, 'meta-oauth', 'width=600,height=700');
        if (!popup || popup.closed) {
          // Popup blocked - redirect full page instead
          window.location.href = data.url;
        }
      } else {
        throw new Error('No OAuth URL returned');
      }
    } catch {
      toast({
        title: t('dashboard.settings.integrations.errors.connectFailed'),
        description: t('dashboard.settings.integrations.errors.connectFailedDesc'),
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnectMeta = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('No session');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/meta-disconnect`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      const data = await res.json();
      if (data.success) {
        toast({
          title: t('dashboard.settings.integrations.success.disconnected'),
          description: t('dashboard.settings.integrations.success.disconnectedDesc'),
        });
        fetchMetaIntegration();
      } else {
        throw new Error('Disconnect failed');
      }
    } catch {
      toast({
        title: t('dashboard.settings.integrations.errors.disconnectFailed'),
        description: t('dashboard.settings.integrations.errors.disconnectFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleSyncMeta = async () => {
    setIsSyncing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('No session');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/meta-sync`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      const data = await res.json();

      if (data.error === 'cooldown') {
        toast({
          title: t('dashboard.settings.integrations.errors.cooldown'),
          description: t('dashboard.settings.integrations.errors.cooldownDesc', { minutes: data.remaining_minutes }),
          variant: 'destructive',
        });
      } else if (data.error === 'token_expired') {
        toast({
          title: t('dashboard.settings.integrations.errors.tokenExpired'),
          description: t('dashboard.settings.integrations.errors.tokenExpiredDesc'),
          variant: 'destructive',
        });
        fetchMetaIntegration();
      } else if (data.error === 'permission_revoked') {
        toast({
          title: t('dashboard.settings.integrations.errors.permissionRevoked'),
          description: t('dashboard.settings.integrations.errors.permissionRevokedDesc'),
          variant: 'destructive',
        });
        fetchMetaIntegration();
      } else if (data.error === 'rate_limited') {
        toast({
          title: t('dashboard.settings.integrations.errors.rateLimited'),
          description: t('dashboard.settings.integrations.errors.rateLimitedDesc'),
          variant: 'destructive',
        });
      } else if (data.success) {
        toast({
          title: t('dashboard.settings.integrations.success.synced'),
          description: t('dashboard.settings.integrations.success.syncedDesc', { ads: data.ads_records, ig: data.ig_records }),
        });
        fetchMetaIntegration();
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch {
      toast({
        title: t('dashboard.settings.integrations.errors.syncFailed'),
        description: t('dashboard.settings.integrations.errors.syncFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

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
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.settings.tabs.profile')}</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.settings.tabs.preferences')}</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.settings.integrations.title')}</span>
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

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('dashboard.settings.profile.title')}</h3>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">{t('dashboard.settings.profile.name')}</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t('dashboard.settings.profile.email')}</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">{t('dashboard.settings.profile.phone')}</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">{t('dashboard.settings.profile.bio')}</Label>
                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t('dashboard.settings.profile.bioPlaceholder')} rows={4} />
                  </div>
                </div>
                <Button onClick={handleSaveProfile}>{t('dashboard.settings.profile.save')}</Button>
              </div>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
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
                      <p className="text-sm text-muted-foreground">{t('dashboard.settings.preferences.languageDesc')}</p>
                    </div>
                    <Select value={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
                      <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
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
                      <p className="text-sm text-muted-foreground">{t('dashboard.settings.preferences.themeDesc')}</p>
                    </div>
                    <Select value={theme} onValueChange={(value: 'light' | 'dark') => setTheme(value)}>
                      <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t('dashboard.settings.preferences.light')}</SelectItem>
                        <SelectItem value="dark">{t('dashboard.settings.preferences.dark')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('dashboard.settings.preferences.emailNotifications')}</Label>
                      <p className="text-sm text-muted-foreground">{t('dashboard.settings.preferences.emailNotificationsDesc')}</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('dashboard.settings.preferences.browserNotifications')}</Label>
                      <p className="text-sm text-muted-foreground">{t('dashboard.settings.preferences.browserNotificationsDesc')}</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <Button onClick={handleSavePreferences}>{t('dashboard.settings.preferences.save')}</Button>
              </div>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('dashboard.settings.integrations.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('dashboard.settings.integrations.subtitle')}</p>
                </div>

                {/* Meta Ads & Instagram Card */}
                <div className="border rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="currentColor">
                          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {t('dashboard.settings.integrations.meta.title')}
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">Em breve</span>
                        </h4>
                        <p className="text-sm text-muted-foreground">{t('dashboard.settings.integrations.meta.description')}</p>
                      </div>
                    </div>
                    <Badge variant={
                      metaStatus === 'connected' ? 'default' 
                      : metaStatus === 'token_expired' || metaStatus === 'permission_revoked' || metaStatus === 'error' ? 'destructive'
                      : 'secondary'
                    }>
                      {metaStatus === 'connected' 
                        ? t('dashboard.settings.integrations.status.connected')
                        : metaStatus === 'token_expired'
                          ? t('dashboard.settings.integrations.status.tokenExpired')
                          : metaStatus === 'permission_revoked'
                            ? t('dashboard.settings.integrations.status.permissionRevoked')
                            : metaStatus === 'rate_limited'
                              ? t('dashboard.settings.integrations.status.rateLimited')
                              : metaStatus === 'error'
                                ? t('dashboard.settings.integrations.status.error')
                                : metaStatus === 'loading' 
                                  ? '...'
                                  : t('dashboard.settings.integrations.status.disconnected')
                      }
                    </Badge>
                  </div>

                  {/* Warning message for error statuses */}
                  {(metaStatus === 'token_expired' || metaStatus === 'permission_revoked') && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                      <p className="text-destructive font-medium">
                        {metaStatus === 'token_expired' 
                          ? t('dashboard.settings.integrations.errors.tokenExpiredDesc')
                          : t('dashboard.settings.integrations.errors.permissionRevokedDesc')
                        }
                      </p>
                    </div>
                  )}

                  {metaStatus === 'connected' && metaIntegration && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('dashboard.settings.integrations.meta.adAccount')}</span>
                        <p className="font-medium">{metaIntegration.meta_ad_account_id || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('dashboard.settings.integrations.meta.igAccount')}</span>
                        <p className="font-medium">{metaIntegration.instagram_account_id || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('dashboard.settings.integrations.meta.lastSync')}</span>
                        <p className="font-medium">
                          {metaIntegration.last_synced_at 
                            ? new Date(metaIntegration.last_synced_at).toLocaleDateString(i18n.language)
                            : t('dashboard.settings.integrations.meta.neverSynced')
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {metaStatus === 'connected' ? (
                      <>
                        <Button onClick={handleSyncMeta} disabled={isSyncing} size="sm">
                          {isSyncing ? t('dashboard.settings.integrations.meta.syncing') : t('dashboard.settings.integrations.meta.sync')}
                        </Button>
                        <Button onClick={handleDisconnectMeta} variant="outline" size="sm">
                          {t('dashboard.settings.integrations.meta.disconnect')}
                        </Button>
                      </>
                    ) : metaStatus === 'token_expired' || metaStatus === 'permission_revoked' ? (
                      <>
                        <Button onClick={handleConnectMeta} disabled={isConnecting} size="sm">
                          {isConnecting ? '...' : t('dashboard.settings.integrations.meta.reconnect')}
                        </Button>
                        <Button onClick={handleDisconnectMeta} variant="outline" size="sm">
                          {t('dashboard.settings.integrations.meta.disconnect')}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleConnectMeta} disabled={isConnecting || metaStatus === 'loading'} size="sm">
                        {isConnecting ? '...' : t('dashboard.settings.integrations.meta.connect')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('dashboard.settings.security.title')}</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">{t('dashboard.settings.security.currentPassword')}</Label>
                    <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">{t('dashboard.settings.security.newPassword')}</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">{t('dashboard.settings.security.confirmPassword')}</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <Button onClick={handleChangePassword}>{t('dashboard.settings.security.changePassword')}</Button>
                </div>
                <div className="pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('dashboard.settings.security.twoFactor')}</Label>
                      <p className="text-sm text-muted-foreground">{t('dashboard.settings.security.twoFactorDesc')}</p>
                    </div>
                    <Button variant="outline">{t('dashboard.settings.security.setup2FA')}</Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('dashboard.settings.api.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('dashboard.settings.api.subtitle')}</p>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('dashboard.settings.api.comingSoon')}</p>
                  <p className="text-sm mt-1">{t('dashboard.settings.api.comingSoonDesc')}</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Danger Tab */}
          <TabsContent value="danger">
            <Card className="p-6 border-destructive">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-destructive">{t('dashboard.settings.danger.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('dashboard.settings.danger.subtitle')}</p>
                </div>
                <div className="space-y-4">
                  <div className="p-4 border border-destructive rounded-lg">
                    <h4 className="font-semibold mb-2">{t('dashboard.settings.danger.deleteAccount')}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{t('dashboard.settings.danger.deleteAccountDesc')}</p>
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
