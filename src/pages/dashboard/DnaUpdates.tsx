import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, GitBranch, CheckCircle, XCircle, Clock, Sparkles, RotateCcw, Shield, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useDnaVersions } from '@/hooks/useDnaVersions';
import { useDnaGuard } from '@/hooks/useDnaGuard';
import { isStructuralBlock, getBlockMeta } from '@/lib/dna-block-config';

interface DnaSuggestion {
  id: string;
  mapping_id: string;
  block_key: string;
  current_value: string | null;
  suggested_value: string;
  justification: string;
  impact_estimate: string;
  data_source: string;
  status: string;
  created_at: string;
}

export default function DnaUpdates() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { dnaList, checkVersionLimit } = useDnaGuard();
  const [suggestions, setSuggestions] = useState<DnaSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [reverting, setReverting] = useState<string | null>(null);
  const [generatingSmartVersion, setGeneratingSmartVersion] = useState(false);

  const activeDna = dnaList.length > 0 ? dnaList[0] : null;
  const { versions, refetch: refetchVersions } = useDnaVersions(activeDna?.id || null);

  useEffect(() => {
    if (!user) return;
    const fetchSuggestions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('dna_update_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const filtered = (data as unknown as DnaSuggestion[]).filter(s => !isStructuralBlock(s.block_key));
        setSuggestions(filtered);
      }
      setLoading(false);
    };
    fetchSuggestions();
  }, [user]);

  const handleApply = async (suggestion: DnaSuggestion) => {
    if (!user || !activeDna) return;
    if (isStructuralBlock(suggestion.block_key)) {
      toast.error(t('dna.updates.structuralBlocked'));
      return;
    }
    const { canCreate, currentCount, limit } = await checkVersionLimit(suggestion.mapping_id);
    if (!canCreate) {
      toast.error(t('dna.updates.versionLimitReached', { count: currentCount, limit }));
      return;
    }

    setApplying(suggestion.id);
    try {
      const { data: mapping } = await supabase
        .from('positioning_mappings')
        .select('*')
        .eq('id', suggestion.mapping_id)
        .single();

      if (!mapping) throw new Error('Mapping not found');

      const blocks: Record<string, string | null> = {};
      for (let i = 1; i <= 12; i++) {
        const key = i === 10 ? 'block_10_transformation' :
                    i === 11 ? 'block_11_voice' :
                    i === 12 ? 'block_12_promises' :
                    `block_${i}_${['audience','pain_points','solution','differentiators','awareness_stage','urgency','social_proof','objections','emotional_connection'][i-1]}`;
        blocks[key] = (mapping as Record<string, unknown>)[key] as string | null;
      }
      blocks[suggestion.block_key] = suggestion.suggested_value;

      const nextLabel = versions.length === 0 ? '1.1' : `1.${versions.length + 1}`;

      await supabase.from('dna_versions').update({ is_active: false }).eq('mapping_id', suggestion.mapping_id).eq('user_id', user.id);
      await supabase.from('dna_versions').insert([{
        mapping_id: suggestion.mapping_id,
        user_id: user.id,
        version_label: nextLabel,
        version_type: 'market_update',
        source: 'intelligence_suggestion',
        blocks: blocks as unknown as import('@/integrations/supabase/types').Json,
        is_active: true,
        notes: suggestion.justification,
      }]);
      await supabase.from('dna_update_suggestions').update({ status: 'applied' }).eq('id', suggestion.id);

      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      refetchVersions();
      toast.success(t('dna.updates.applied'));
    } catch (err) {
      console.error('Error applying suggestion:', err);
    } finally {
      setApplying(null);
    }
  };

  const handleDismiss = async (suggestionId: string) => {
    await supabase.from('dna_update_suggestions').update({ status: 'dismissed' }).eq('id', suggestionId);
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    toast.success(t('dna.updates.dismissed'));
  };

  const handleRevert = async (versionId: string, mappingId: string) => {
    if (!user) return;
    setReverting(versionId);
    try {
      await supabase.from('dna_versions').update({ is_active: false }).eq('mapping_id', mappingId).eq('user_id', user.id);
      await supabase.from('dna_versions').update({ is_active: true }).eq('id', versionId).eq('user_id', user.id);
      refetchVersions();
      toast.success(t('dna.versions.activated'));
    } catch (err) {
      console.error('Error reverting version:', err);
    } finally {
      setReverting(null);
    }
  };

  const handleGenerateSmartVersion = async () => {
    if (!user || !activeDna || suggestions.length === 0) return;

    const mappingId = suggestions[0].mapping_id;
    const { canCreate, currentCount, limit } = await checkVersionLimit(mappingId);
    if (!canCreate) {
      toast.error(t('dna.updates.versionLimitReached', { count: currentCount, limit }));
      return;
    }

    setGeneratingSmartVersion(true);
    try {
      const { data: mapping } = await supabase
        .from('positioning_mappings')
        .select('*')
        .eq('id', mappingId)
        .single();

      if (!mapping) throw new Error('Mapping not found');

      const blocks: Record<string, string | null> = {};
      for (let i = 1; i <= 12; i++) {
        const key = i === 10 ? 'block_10_transformation' :
                    i === 11 ? 'block_11_voice' :
                    i === 12 ? 'block_12_promises' :
                    `block_${i}_${['audience','pain_points','solution','differentiators','awareness_stage','urgency','social_proof','objections','emotional_connection'][i-1]}`;
        blocks[key] = (mapping as Record<string, unknown>)[key] as string | null;
      }

      // Apply all pending suggestions (adaptive only)
      for (const suggestion of suggestions) {
        if (!isStructuralBlock(suggestion.block_key)) {
          blocks[suggestion.block_key] = suggestion.suggested_value;
        }
      }

      const nextLabel = `1.${(versions.length || 0) + 1}`;

      await supabase.from('dna_versions').update({ is_active: false }).eq('mapping_id', mappingId).eq('user_id', user.id);
      await supabase.from('dna_versions').insert([{
        mapping_id: mappingId,
        user_id: user.id,
        version_label: nextLabel,
        version_type: 'ai_generated',
        source: 'intelligence_engine',
        blocks: blocks as unknown as import('@/integrations/supabase/types').Json,
        is_active: true,
        notes: `Smart version with ${suggestions.length} intelligence suggestions applied.`,
      }]);

      // Mark all suggestions as applied
      const ids = suggestions.map(s => s.id);
      for (const id of ids) {
        await supabase.from('dna_update_suggestions').update({ status: 'applied' }).eq('id', id);
      }

      setSuggestions([]);
      refetchVersions();
      toast.success(t('intelligence.engine.smartVersionCreated'));
    } catch (err) {
      console.error('Error generating smart version:', err);
      toast.error('Failed to generate smart version');
    } finally {
      setGeneratingSmartVersion(false);
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return <Badge variant="destructive">{t('dna.updates.impactHigh')}</Badge>;
      case 'medium': return <Badge variant="secondary">{t('dna.updates.impactMedium')}</Badge>;
      case 'low': return <Badge variant="outline">{t('dna.updates.impactLow')}</Badge>;
      default: return null;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'meta_ads': return t('dna.updates.sourceMetaAds');
      case 'instagram': return t('dna.updates.sourceInstagram');
      case 'market_analysis': return t('dna.updates.sourceMarket');
      default: return source;
    }
  };

  const getBlockLabel = (blockKey: string) => {
    const meta = getBlockMeta(blockKey);
    if (meta) return t(meta.labelKey);
    return blockKey;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('dna.updates.title')}</h1>
            <p className="text-muted-foreground">{t('dna.updates.subtitle')}</p>
          </div>
          {suggestions.length > 0 && (
            <Button
              onClick={handleGenerateSmartVersion}
              disabled={generatingSmartVersion}
              className="gap-2"
            >
              {generatingSmartVersion ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {t('intelligence.engine.generateSmartVersion')}
            </Button>
          )}
        </div>

        {/* Pending Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('dna.updates.pendingUpdates')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="font-medium">{t('dna.updates.noPending')}</p>
                <p className="text-sm text-muted-foreground">{t('dna.updates.noPendingDesc')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {getBlockLabel(suggestion.block_key)}
                          </Badge>
                          {getImpactBadge(suggestion.impact_estimate)}
                          <Badge variant="secondary">{getSourceLabel(suggestion.data_source)}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(suggestion.created_at).toLocaleDateString(i18n.language)}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">{t('dna.updates.currentValue')}</p>
                          <p className="text-sm bg-muted p-3 rounded-md">{suggestion.current_value || '—'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-primary">{t('dna.updates.suggestedValue')}</p>
                          <p className="text-sm bg-primary/5 border border-primary/20 p-3 rounded-md">{suggestion.suggested_value}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{t('dna.updates.justification')}</p>
                        <p className="text-sm text-muted-foreground">{suggestion.justification}</p>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleDismiss(suggestion.id)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          {t('dna.updates.dismiss')}
                        </Button>
                        <Button size="sm" onClick={() => handleApply(suggestion)} disabled={applying === suggestion.id}>
                          {applying === suggestion.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          {t('dna.updates.applyAsNewVersion')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Version History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              {t('dna.updates.versionHistory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {versions.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Clock className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="font-medium">{t('dna.versions.noVersions')}</p>
                <p className="text-sm text-muted-foreground">{t('dna.versions.noVersionsDesc')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div key={version.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium">v{version.version_label}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(version.created_at).toLocaleDateString(i18n.language)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {version.version_type === 'original' ? t('dna.versions.original') :
                         version.version_type === 'market_update' ? t('dna.versions.marketUpdate') :
                         version.version_type === 'ai_generated' ? t('intelligence.engine.aiGenerated') :
                         t('dna.versions.experimental')}
                      </Badge>
                      {version.is_active ? (
                        <Badge className="bg-primary">{t('dna.versions.active')}</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-xs" disabled={reverting === version.id}
                          onClick={() => handleRevert(version.id, version.mapping_id)}>
                          {reverting === version.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <RotateCcw className="h-3 w-3 mr-1" />
                          )}
                          {t('dna.versions.revert')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
