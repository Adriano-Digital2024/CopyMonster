import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { edgeFunctionUrl } from '@/integrations/supabase/urls';
import type { Database } from '@/integrations/supabase/types';
import { Save, Loader2, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';

// Must stay in sync with supabase/migrations/20260812000000_llm_config.sql
type Provider = 'mistral' | 'openrouter' | 'deepseek' | 'ollama';

const PROVIDER_MODELS: Record<Provider, { value: string; label: string }[]> = {
  mistral: [
    { value: 'mistralai/mistral-large-latest', label: 'Mistral Large' },
    { value: 'mistralai/mistral-medium-latest', label: 'Mistral Medium' },
    { value: 'mistralai/mistral-small-latest', label: 'Mistral Small' },
  ],
  openrouter: [
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
  ],
  deepseek: [
    { value: 'deepseek/deepseek-v4-flash', label: 'DeepSeek V4 Flash (rápido, econômico)' },
    { value: 'deepseek/deepseek-v4-pro', label: 'DeepSeek V4 Pro (reasoning)' },
  ],
  ollama: [
    { value: 'ollama/llama3.1', label: 'Llama 3.1 (Ollama local)' },
    { value: 'ollama/qwen2.5', label: 'Qwen 2.5 (Ollama local)' },
  ],
};

const PROVIDER_LABELS: Record<Provider, string> = {
  mistral: 'Mistral',
  openrouter: 'OpenRouter',
  deepseek: 'DeepSeek',
  ollama: 'Ollama (self-hosted)',
};

// Row type from the generated Supabase schema (llm_config table).
type LlmConfig = Database['public']['Tables']['llm_config']['Row'];

const AdminProviders = () => {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<LlmConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [form, setForm] = useState({
    // Default to DeepSeek: it is the only LLM secret configured in
    // production Supabase Edge Function Secrets. An admin who opens the
    // page with no active row otherwise sees Mistral, which would fail
    // "Testar conexão" with "Mistral API not configured".
    provider: 'deepseek' as Provider,
    default_model: 'deepseek/deepseek-v4-flash',
    fallback_provider: '' as Provider | '',
    fallback_model: '',
    notes: '',
  });

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('llm_config')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setConfigs((data as LlmConfig[]) || []);
      const active = (data as LlmConfig[])?.find((c) => c.is_active);
      if (active) {
        setForm({
          provider: active.provider as Provider,
          default_model: active.default_model,
          fallback_provider: (active.fallback_provider as Provider | '') || '',
          fallback_model: active.fallback_model || '',
          notes: active.notes || '',
        });
      }
    } catch (e: any) {
      toast({
        title: 'Erro ao carregar configurações',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Atomic swap: deactivate all, then insert new active row.
      // We insert a new row (audit trail) instead of updating, so the
      // admin can rollback by re-activating an older row.
      const { error: deactivateError } = await supabase
        .from('llm_config')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('is_active', true);
      if (deactivateError) throw deactivateError;

      const { error: insertError } = await supabase
        .from('llm_config')
        .insert({
          provider: form.provider,
          default_model: form.default_model,
          fallback_provider: form.fallback_provider || null,
          fallback_model: form.fallback_model || null,
          is_active: true,
          notes: form.notes || null,
          updated_at: new Date().toISOString(),
        });
      if (insertError) throw insertError;

      toast({
        title: 'Provedor atualizado',
        description: 'A nova configuração está ativa para todos os agentes.',
      });
      await fetchConfigs();
    } catch (e: any) {
      toast({
        title: 'Erro ao salvar',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(edgeFunctionUrl('agent-test'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          input: 'ping',
          system_prompt: 'Reply with the word: pong',
          model_id: form.default_model,
          max_tokens: 10,
        }),
      });
      if (res.ok) {
        setTestResult({ ok: true, message: `Conexão OK com ${PROVIDER_LABELS[form.provider]} / ${form.default_model}` });
      } else {
        const err = await res.json().catch(() => ({}));
        setTestResult({ ok: false, message: err.error || `Erro ${res.status}` });
      }
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message });
    } finally {
      setTesting(false);
    }
  };

  const activateConfig = async (cfg: LlmConfig) => {
    try {
      await supabase.from('llm_config').update({ is_active: false, updated_at: new Date().toISOString() }).eq('is_active', true);
      const { error } = await supabase
        .from('llm_config')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', cfg.id);
      if (error) throw error;
      toast({ title: 'Configuração reativada', description: `${PROVIDER_LABELS[cfg.provider]} / ${cfg.default_model}` });
      await fetchConfigs();
    } catch (e: any) {
      toast({ title: 'Erro ao reativar', description: e.message, variant: 'destructive' });
    }
  };

  const modelOptions = PROVIDER_MODELS[form.provider] || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Cpu className="h-7 w-7" />
            Provedores de IA
          </h1>
          <p className="text-muted-foreground mt-2">
            Defina o provedor padrão usado por todos os agentes e um fallback automático.
            Agente com <code>model_id</code> próprio continua usando o modelo individual.
          </p>
        </div>

        {loading ? (
          <Skeleton className="h-[600px] w-full" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Nova configuração ativa</CardTitle>
                <CardDescription>
                  Salvar desativa a configuração atual e cria uma nova versão (auditoria).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Provedor principal</Label>
                    <Select
                      value={form.provider}
                      onValueChange={(v) => {
                        const provider = v as Provider;
                        const first = PROVIDER_MODELS[provider]?.[0]?.value || '';
                        setForm((f) => ({ ...f, provider, default_model: first }));
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
                          <SelectItem key={p} value={p}>{PROVIDER_LABELS[p]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo principal</Label>
                    <Select
                      value={form.default_model}
                      onValueChange={(v) => setForm((f) => ({ ...f, default_model: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {modelOptions.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Provedor de fallback (opcional)</Label>
                    <Select
                      value={form.fallback_provider || '__none__'}
                      onValueChange={(v) => {
                        const provider = v === '__none__' ? '' : (v as Provider | '');
                        const first = provider ? PROVIDER_MODELS[provider]?.[0]?.value || '' : '';
                        setForm((f) => ({ ...f, fallback_provider: provider, fallback_model: first }));
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
                          <SelectItem key={p} value={p}>{PROVIDER_LABELS[p]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo de fallback</Label>
                    <Select
                      value={form.fallback_model || '__none__'}
                      onValueChange={(v) => setForm((f) => ({ ...f, fallback_model: v === '__none__' ? '' : v }))}
                      disabled={!form.fallback_provider}
                    >
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
                        {(PROVIDER_MODELS[form.fallback_provider as Provider] || []).map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas (auditoria)</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Ex: troca para DeepSeek em 12/08, validar qualidade"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Ativar configuração
                  </Button>
                  <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
                    {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Cpu className="mr-2 h-4 w-4" />}
                    Testar conexão
                  </Button>
                  {testResult && (
                    <div className={`flex items-center gap-2 text-sm ${testResult.ok ? 'text-emerald-600' : 'text-destructive'}`}>
                      {testResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      {testResult.message}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
                  <p className="font-medium mb-1">Chaves de API</p>
                  <p className="text-muted-foreground">
                    As chaves (<code>MISTRAL_API_KEY</code>, <code>OPENROUTER_API_KEY</code>,
                    <code>DEEPSEEK_API_KEY</code>) são definidas em
                    Supabase → Edge Function Secrets. Nunca as escreva no código.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico</CardTitle>
                <CardDescription>Configurações anteriores (auditoria)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {configs.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma configuração.</p>
                )}
                {configs.map((cfg) => (
                  <div key={cfg.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={cfg.is_active ? 'default' : 'outline'}>
                        {cfg.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(cfg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div><strong>{PROVIDER_LABELS[cfg.provider]}</strong> · {cfg.default_model}</div>
                      {cfg.fallback_model && (
                        <div className="text-xs text-muted-foreground">
                          Fallback: {cfg.fallback_provider} / {cfg.fallback_model}
                        </div>
                      )}
                      {cfg.notes && <div className="text-xs text-muted-foreground mt-1">{cfg.notes}</div>}
                    </div>
                    {!cfg.is_active && (
                      <Button size="sm" variant="ghost" onClick={() => activateConfig(cfg)}>
                        Reativar
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProviders;