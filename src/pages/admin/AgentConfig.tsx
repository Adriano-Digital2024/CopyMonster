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
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgents, Agent } from '@/hooks/useAgents';
import { AgentTestPanel } from '@/components/admin/AgentTestPanel';
import { FewShotExamplesEditor } from '@/components/admin/FewShotExamplesEditor';
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ArrowLeft, Save, Loader2, Settings, FileText, GraduationCap, Cpu, UserCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const ICON_OPTIONS = [
  'Target', 'Video', 'FileText', 'Rocket', 'Mail', 'Megaphone', 'Type', 'MessageSquare',
  'Zap', 'Star', 'Heart', 'Brain', 'Lightbulb', 'Sparkles', 'Wand2', 'Pencil'
];

const CATEGORY_OPTIONS = [
  { value: 'copywriting', label: 'Copywriting' },
  { value: 'sales', label: 'Vendas' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'social', label: 'Redes Sociais' },
  { value: 'email', label: 'Email Marketing' },
  { value: 'ads', label: 'Anúncios' },
];

const TONE_OPTIONS = [
  { value: 'professional', label: 'Profissional' },
  { value: 'friendly', label: 'Amigável' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'creative', label: 'Criativo' },
  { value: 'persuasive', label: 'Persuasivo' },
];

const LANGUAGE_OPTIONS = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
];

const MODEL_OPTIONS = [
  { value: 'mistralai/mistral-large-latest', label: 'Mistral Large', provider: 'Mistral' },
  { value: 'mistralai/mistral-medium-latest', label: 'Mistral Medium', provider: 'Mistral' },
  { value: 'mistralai/mistral-small-latest', label: 'Mistral Small', provider: 'Mistral' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'OpenRouter' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'OpenRouter' },
  { value: 'openai/gpt-4o', label: 'GPT-4o', provider: 'OpenRouter' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenRouter' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', provider: 'OpenRouter' },
];

const AgentConfig = () => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { getAgentBySlug, updateAgent } = useAgents();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'Target',
    color: 'from-violet-500 to-purple-600',
    category: 'copywriting',
    sort_order: 0,
    is_active: true,
    is_public: true,
    is_featured: false,
    system_prompt: '',
    role_definition: '',
    core_function: '',
    expected_inputs: '',
    output_structure: '',
    quality_rules: '',
    few_shot_examples: [] as any[],
    knowledge_base_ids: [] as string[],
    model_id: 'mistralai/mistral-large-latest',
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0,
    tone: 'professional',
    language: 'pt-BR',
    persona_name: '',
    persona_backstory: '',
    min_words: 100,
    max_words: 2000,
    max_characters: null as number | null,
  });

  useEffect(() => {
    const loadAgent = async () => {
      if (!slug) return;
      setLoading(true);
      const data = await getAgentBySlug(slug);
      if (data) {
        setAgent(data);
        setFormData({
          name: data.name,
          slug: data.slug,
          description: data.description,
          icon: data.icon,
          color: data.color,
          category: data.category || 'copywriting',
          sort_order: data.sort_order || 0,
          is_active: data.is_active,
          is_public: data.is_public ?? true,
          is_featured: data.is_featured ?? false,
          system_prompt: data.system_prompt || '',
          role_definition: data.role_definition || '',
          core_function: data.core_function || '',
          expected_inputs: data.expected_inputs || '',
          output_structure: data.output_structure || '',
          quality_rules: data.quality_rules || '',
          few_shot_examples: Array.isArray(data.few_shot_examples) ? data.few_shot_examples : [],
          knowledge_base_ids: Array.isArray(data.knowledge_base_ids) ? (data.knowledge_base_ids as string[]) : [],
          model_id: data.model_id || 'mistralai/mistral-large-latest',
          temperature: data.temperature ?? 0.7,
          max_tokens: data.max_tokens ?? 4096,
          top_p: data.top_p ?? 0.9,
          frequency_penalty: data.frequency_penalty ?? 0,
          presence_penalty: data.presence_penalty ?? 0,
          tone: data.tone || 'professional',
          language: data.language || 'pt-BR',
          persona_name: data.persona_name || '',
          persona_backstory: data.persona_backstory || '',
          min_words: data.min_words ?? 100,
          max_words: data.max_words ?? 2000,
          max_characters: data.max_characters,
        });
      }
      setLoading(false);
    };
    loadAgent();
  }, [slug, getAgentBySlug]);

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    await updateAgent(agent.id, formData);
    setSaving(false);
  };

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!agent) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Agente não encontrado</h2>
          <Button className="mt-4" onClick={() => navigate('/admin/agents')}>
            Voltar para Agentes
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => navigate('/admin/agents')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin/agents">Agentes</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{formData.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${formData.color} flex items-center justify-center text-white`}>
                {renderIcon(formData.icon)}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{formData.name}</h1>
                <p className="text-muted-foreground">{formData.description}</p>
              </div>
              <div className="flex gap-2 ml-4">
                {formData.is_active && <Badge variant="default">Ativo</Badge>}
                {formData.is_featured && <Badge variant="secondary">Destaque</Badge>}
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Configurações
          </Button>
        </div>

        {/* Main Content */}
        <ResizablePanelGroup direction="horizontal" className="min-h-[800px] rounded-lg border">
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full overflow-auto p-6">
              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Básico
                  </TabsTrigger>
                  <TabsTrigger value="prompt" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Prompt
                  </TabsTrigger>
                  <TabsTrigger value="training" className="gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Treinamento
                  </TabsTrigger>
                  <TabsTrigger value="model" className="gap-2">
                    <Cpu className="h-4 w-4" />
                    Modelo
                  </TabsTrigger>
                  <TabsTrigger value="behavior" className="gap-2">
                    <UserCircle className="h-4 w-4" />
                    Comportamento
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Básico */}
                <TabsContent value="basic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações Básicas</CardTitle>
                      <CardDescription>Configure a identificação e visibilidade do agente</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Nome do Agente</Label>
                          <Input
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            placeholder="Ex: Monster Positioner"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Slug (URL)</Label>
                          <Input
                            value={formData.slug}
                            onChange={(e) => updateField('slug', e.target.value)}
                            placeholder="Ex: monster-positioner"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => updateField('description', e.target.value)}
                          placeholder="Descrição curta do agente..."
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label>Ícone</Label>
                          <Select value={formData.icon} onValueChange={(v) => updateField('icon', v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ICON_OPTIONS.map((icon) => (
                                <SelectItem key={icon} value={icon}>
                                  <div className="flex items-center gap-2">
                                    {renderIcon(icon)}
                                    {icon}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Categoria</Label>
                          <Select value={formData.category} onValueChange={(v) => updateField('category', v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORY_OPTIONS.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Ordem</Label>
                          <Input
                            type="number"
                            value={formData.sort_order}
                            onChange={(e) => updateField('sort_order', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border rounded-lg p-4">
                        <div className="space-y-1">
                          <Label>Agente Ativo</Label>
                          <p className="text-sm text-muted-foreground">Agentes inativos não aparecem para usuários</p>
                        </div>
                        <Switch
                          checked={formData.is_active}
                          onCheckedChange={(v) => updateField('is_active', v)}
                        />
                      </div>

                      <div className="flex items-center justify-between border rounded-lg p-4">
                        <div className="space-y-1">
                          <Label>Público</Label>
                          <p className="text-sm text-muted-foreground">Visível para todos os usuários</p>
                        </div>
                        <Switch
                          checked={formData.is_public}
                          onCheckedChange={(v) => updateField('is_public', v)}
                        />
                      </div>

                      <div className="flex items-center justify-between border rounded-lg p-4">
                        <div className="space-y-1">
                          <Label>Destaque</Label>
                          <p className="text-sm text-muted-foreground">Aparece em destaque na página inicial</p>
                        </div>
                        <Switch
                          checked={formData.is_featured}
                          onCheckedChange={(v) => updateField('is_featured', v)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Prompt */}
                <TabsContent value="prompt" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Prompt</CardTitle>
                      <CardDescription>Instruções gerais que definem o comportamento do agente</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={formData.system_prompt}
                        onChange={(e) => updateField('system_prompt', e.target.value)}
                        placeholder="Você é o [Nome], especialista em..."
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Definição de Papel</CardTitle>
                      <CardDescription>Quem é este agente? Qual sua expertise?</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={formData.role_definition}
                        onChange={(e) => updateField('role_definition', e.target.value)}
                        placeholder="Você é um especialista de classe mundial em..."
                        className="min-h-[150px] font-mono text-sm"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Função Central</CardTitle>
                      <CardDescription>O que este agente faz? Qual sua missão principal?</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={formData.core_function}
                        onChange={(e) => updateField('core_function', e.target.value)}
                        placeholder="Analisar, criar, otimizar..."
                        className="min-h-[100px] font-mono text-sm"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Estrutura de Saída</CardTitle>
                      <CardDescription>Como a resposta deve ser formatada? (Markdown)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={formData.output_structure}
                        onChange={(e) => updateField('output_structure', e.target.value)}
                        placeholder="## Título Principal&#10;### Seção 1&#10;[Conteúdo]&#10;..."
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Regras de Qualidade</CardTitle>
                      <CardDescription>Restrições e diretrizes que o agente deve seguir</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={formData.quality_rules}
                        onChange={(e) => updateField('quality_rules', e.target.value)}
                        placeholder="- Nunca use clichês&#10;- Seja específico&#10;- Foque no cliente..."
                        className="min-h-[150px] font-mono text-sm"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Treinamento */}
                <TabsContent value="training" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Inputs Esperados</CardTitle>
                      <CardDescription>Quais informações o usuário deve fornecer?</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={formData.expected_inputs}
                        onChange={(e) => updateField('expected_inputs', e.target.value)}
                        placeholder="- Nome do produto&#10;- Público-alvo&#10;- Objetivo..."
                        className="min-h-[150px] font-mono text-sm"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Exemplos Few-Shot</CardTitle>
                      <CardDescription>Exemplos de entrada/saída para melhorar a qualidade</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FewShotExamplesEditor
                        examples={formData.few_shot_examples}
                        onChange={(examples) => updateField('few_shot_examples', examples)}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Modelo */}
                <TabsContent value="model" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Modelo de IA</CardTitle>
                      <CardDescription>Selecione o modelo e configure os parâmetros</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Modelo</Label>
                        <Select value={formData.model_id} onValueChange={(v) => updateField('model_id', v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MODEL_OPTIONS.map((model) => (
                              <SelectItem key={model.value} value={model.value}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{model.label}</span>
                                  <Badge variant="outline" className="ml-2 text-xs">{model.provider}</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Temperature: {formData.temperature.toFixed(2)}</Label>
                            <span className="text-xs text-muted-foreground">Mais criativo ↔ Mais preciso</span>
                          </div>
                          <Slider
                            value={[formData.temperature]}
                            onValueChange={([v]) => updateField('temperature', v)}
                            min={0}
                            max={2}
                            step={0.05}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Top P: {formData.top_p.toFixed(2)}</Label>
                          </div>
                          <Slider
                            value={[formData.top_p]}
                            onValueChange={([v]) => updateField('top_p', v)}
                            min={0}
                            max={1}
                            step={0.05}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Max Tokens</Label>
                            <Input
                              type="number"
                              value={formData.max_tokens}
                              onChange={(e) => updateField('max_tokens', parseInt(e.target.value) || 4096)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Frequency Penalty</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.frequency_penalty}
                              onChange={(e) => updateField('frequency_penalty', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Presence Penalty</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.presence_penalty}
                            onChange={(e) => updateField('presence_penalty', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Comportamento */}
                <TabsContent value="behavior" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tom e Estilo</CardTitle>
                      <CardDescription>Configure como o agente se comunica</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Tom de Voz</Label>
                          <Select value={formData.tone} onValueChange={(v) => updateField('tone', v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TONE_OPTIONS.map((tone) => (
                                <SelectItem key={tone.value} value={tone.value}>{tone.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Idioma</Label>
                          <Select value={formData.language} onValueChange={(v) => updateField('language', v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LANGUAGE_OPTIONS.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Persona (Opcional)</CardTitle>
                      <CardDescription>Dê uma identidade específica ao agente</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome da Persona</Label>
                        <Input
                          value={formData.persona_name}
                          onChange={(e) => updateField('persona_name', e.target.value)}
                          placeholder="Ex: Carlos, o Copywriter"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>História de Fundo</Label>
                        <Textarea
                          value={formData.persona_backstory}
                          onChange={(e) => updateField('persona_backstory', e.target.value)}
                          placeholder="Descreva a história e personalidade da persona..."
                          className="min-h-[100px]"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Limites de Conteúdo</CardTitle>
                      <CardDescription>Defina os limites para as respostas geradas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Mínimo de Palavras</Label>
                          <Input
                            type="number"
                            value={formData.min_words}
                            onChange={(e) => updateField('min_words', parseInt(e.target.value) || 100)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Máximo de Palavras</Label>
                          <Input
                            type="number"
                            value={formData.max_words}
                            onChange={(e) => updateField('max_words', parseInt(e.target.value) || 2000)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Máx. Caracteres (opcional)</Label>
                          <Input
                            type="number"
                            value={formData.max_characters || ''}
                            onChange={(e) => updateField('max_characters', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Sem limite"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full p-6 bg-muted/20">
              <AgentTestPanel agentConfig={formData} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </AdminLayout>
  );
};

export default AgentConfig;
