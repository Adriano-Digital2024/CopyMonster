import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    platformName: 'CopyMonster',
    supportEmail: 'support@copymonster.com',
    maintenanceMode: false,
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
  });

  const handleSave = () => {
    toast({
      title: t('admin.settings.saved'),
      description: t('admin.settings.savedDesc'),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('admin.settings.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('admin.settings.subtitle')}</p>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {t('common.save')}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">{t('admin.settings.general')}</TabsTrigger>
            <TabsTrigger value="integrations">{t('admin.settings.integrations')}</TabsTrigger>
            <TabsTrigger value="email">{t('admin.settings.email')}</TabsTrigger>
            <TabsTrigger value="security">{t('admin.settings.security')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.settings.generalTitle')}</CardTitle>
                <CardDescription>{t('admin.settings.generalDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="platformName">{t('admin.settings.platformName')}</Label>
                  <Input
                    id="platformName"
                    value={settings.platformName}
                    onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">{t('admin.settings.supportEmail')}</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenance"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                  />
                  <Label htmlFor="maintenance">{t('admin.settings.maintenanceMode')}</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.settings.integrationsTitle')}</CardTitle>
                <CardDescription>{t('admin.settings.integrationsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">{t('admin.settings.openRouterKey')}</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Chave de API do OpenRouter (configurada no Supabase)
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('https://supabase.com/dashboard/project/bcatupltfvgwelhzeznk/settings/vault/secrets', '_blank')}
                    >
                      Configurar no Supabase
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">{t('admin.settings.stripeKey')}</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Chaves do Stripe (configuradas no Supabase)
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => window.open('https://supabase.com/dashboard/project/bcatupltfvgwelhzeznk/settings/vault/secrets', '_blank')}
                    >
                      Configurar no Supabase
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.settings.emailTitle')}</CardTitle>
                <CardDescription>{t('admin.settings.emailDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">{t('admin.settings.smtpHost')}</Label>
                    <Input
                      id="smtpHost"
                      value={settings.smtpHost}
                      onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">{t('admin.settings.smtpPort')}</Label>
                    <Input
                      id="smtpPort"
                      value={settings.smtpPort}
                      onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                      placeholder="587"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">{t('admin.settings.smtpUser')}</Label>
                  <Input
                    id="smtpUser"
                    type="email"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.settings.securityTitle')}</CardTitle>
                <CardDescription>{t('admin.settings.securityDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('admin.settings.securityPlaceholder')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
