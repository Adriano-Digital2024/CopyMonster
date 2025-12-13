import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useModels } from '@/hooks/useModels';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ArrowLeft, Save, TestTube } from 'lucide-react';
import { AGENTS } from '@/lib/copymonster-config';
import { useToast } from '@/hooks/use-toast';

const AgentConfig = () => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const agent = AGENTS.find((a) => a.slug === slug);
  const { getActiveModels } = useModels();

  const [config, setConfig] = useState({
    systemPrompt: agent?.systemPrompt || '',
    tone: 'professional',
    model: 'google/gemini-2.5-flash',
    temperature: '0.7',
    maxTokens: '2000',
  });

  const [availableModels, setAvailableModels] = useState(getActiveModels());

  // Listen for model updates
  useEffect(() => {
    const handleUpdate = () => {
      setAvailableModels(getActiveModels());
    };
    window.addEventListener('models-updated', handleUpdate);
    return () => window.removeEventListener('models-updated', handleUpdate);
  }, [getActiveModels]);

  if (!agent) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">{t('common.notFound')}</h2>
          <Button className="mt-4" onClick={() => navigate('/admin/agents')}>
            {t('common.goBack')}
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const handleSave = () => {
    toast({
      title: t('admin.agents.configSaved'),
      description: t('admin.agents.configSavedDesc', { name: agent.name }),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => navigate('/admin/agents')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin">{t('admin.title')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin/agents">{t('admin.menu.agents')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{agent.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div>
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              <p className="text-muted-foreground mt-2">{agent.description}</p>
            </div>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {t('admin.agents.saveConfig')}
          </Button>
        </div>

        <Tabs defaultValue="prompt" className="space-y-4">
          <TabsList>
            <TabsTrigger value="prompt">{t('admin.agents.systemPrompt')}</TabsTrigger>
            <TabsTrigger value="behavior">{t('admin.agents.behavior')}</TabsTrigger>
            <TabsTrigger value="model">{t('admin.agents.model')}</TabsTrigger>
            <TabsTrigger value="advanced">{t('admin.agents.advanced')}</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.agents.systemPromptTitle')}</CardTitle>
                <CardDescription>{t('admin.agents.systemPromptDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={config.systemPrompt}
                  onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                  placeholder={t('admin.agents.systemPromptPlaceholder')}
                  className="min-h-[400px] font-mono"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.agents.behaviorTitle')}</CardTitle>
                <CardDescription>{t('admin.agents.behaviorDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="tone">{t('admin.agents.toneLabel')}</Label>
                  <Select value={config.tone} onValueChange={(value) => setConfig({ ...config, tone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">{t('admin.agents.professional')}</SelectItem>
                      <SelectItem value="friendly">{t('admin.agents.friendly')}</SelectItem>
                      <SelectItem value="formal">{t('admin.agents.formal')}</SelectItem>
                      <SelectItem value="casual">{t('admin.agents.casual')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="model">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.agents.modelTitle')}</CardTitle>
                <CardDescription>{t('admin.agents.modelDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="model">{t('admin.agents.modelLabel')}</Label>
                  <Select value={config.model} onValueChange={(value) => setConfig({ ...config, model: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.agents.selectModel')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.length === 0 ? (
                        <SelectItem value="no-models" disabled>
                          {t('admin.agents.noModels')}
                        </SelectItem>
                      ) : (
                        availableModels.map((model) => (
                          <SelectItem key={model.id} value={model.modelId}>
                            {model.name} ({model.provider})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {availableModels.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t('admin.agents.noModelsDesc')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.agents.advancedTitle')}</CardTitle>
                <CardDescription>{t('admin.agents.advancedDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">{t('admin.agents.temperature')}</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={config.temperature}
                      onChange={(e) => setConfig({ ...config, temperature: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">{t('admin.agents.maxTokens')}</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={config.maxTokens}
                      onChange={(e) => setConfig({ ...config, maxTokens: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AgentConfig;
