import { useState, useEffect } from 'react';
import { TrendingUp, FileText, Star, Copy, Trash2, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface CopyResult {
  id: string;
  agent_slug: string;
  content: string;
  title: string | null;
  is_favorite: boolean;
  is_edited: boolean;
  rating: number | null;
  created_at: string;
  campaign_id: string | null;
}

export default function CopyResults() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [copyResults, setCopyResults] = useState<CopyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [editingResult, setEditingResult] = useState<CopyResult | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showDiscardAlert, setShowDiscardAlert] = useState(false);

  useEffect(() => {
    if (user) {
      loadCopyResults();
    }
  }, [user]);

  const loadCopyResults = async () => {
    try {
      const { data, error } = await supabase
        .from('copy_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCopyResults((data as CopyResult[]) || []);
    } catch (error) {
      console.error('Error loading copy results:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('copy_results')
        .update({ is_favorite: !currentFavorite })
        .eq('id', id);

      if (error) throw error;
      
      setCopyResults(copyResults.map(c => 
        c.id === id ? { ...c, is_favorite: !currentFavorite } : c
      ));
      
      toast({
        title: !currentFavorite ? t('copyResults.toast.favorited') : t('copyResults.toast.unfavorited'),
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteCopyResult = async (id: string) => {
    try {
      const { error } = await supabase
        .from('copy_results')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCopyResults(copyResults.filter(c => c.id !== id));
      
      toast({
        title: t('copyResults.toast.deleted'),
      });
    } catch (error) {
      console.error('Error deleting copy result:', error);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('copyResults.toast.copied'),
    });
  };

  const handleEditOpen = (result: CopyResult) => {
    setEditingResult(result);
    setEditContent(result.content);
  };

  const handleEditCancel = () => {
    if (editingResult && editContent !== editingResult.content) {
      setShowDiscardAlert(true);
    } else {
      setEditingResult(null);
      setEditContent('');
    }
  };

  const handleDiscardConfirm = () => {
    setShowDiscardAlert(false);
    setEditingResult(null);
    setEditContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingResult) return;

    try {
      const { error } = await supabase
        .from('copy_results')
        .update({ content: editContent, is_edited: true })
        .eq('id', editingResult.id);

      if (error) throw error;

      setCopyResults(copyResults.map(c =>
        c.id === editingResult.id ? { ...c, content: editContent, is_edited: true } : c
      ));

      toast({ title: t('copyResults.toast.edited') });
      setEditingResult(null);
      setEditContent('');
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  };

  const filteredResults = copyResults.filter(result => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return result.is_favorite;
    return result.agent_slug === filter;
  });

  const uniqueAgents = [...new Set(copyResults.map(c => c.agent_slug))];

  const slugToTranslationKey: Record<string, string> = {
    'brand-positioning-monster': 'positioner',
    'vsl-monster': 'vsl',
    'sales-page-monster': 'sales',
    'launch-monster': 'launch',
    'email-monster': 'email',
    'ads-monster': 'ads',
    'headline-monster': 'headline',
    'short-monster': 'short',
    'internal-launch-monster': 'internalLaunch',
    'flash-launch-monster': 'flashLaunch',
    'evergreen-funnel-monster': 'evergreenFunnel',
    'webinar-campaign-monster': 'webinarCampaign',
    'cart-recovery-monster': 'cartRecovery',
    'lead-nurture-monster': 'leadNurture',
    'upsell-cross-monster': 'upsellCross',
    'list-revival-monster': 'listRevival',
    'full-vsl-script-monster': 'fullVslScript',
    'whatsapp-sales-monster': 'whatsappSales',
    'high-conversion-ads-monster': 'highConversionAds',
    'strategic-stories-monster': 'strategicStories',
    'reels-tiktok-monster': 'reelsTiktok',
    'carousel-monster': 'carousel',
  };

  const getAgentLabel = (slug: string) => {
    const tKey = slugToTranslationKey[slug];
    if (tKey) {
      return t(`agents.list.${tKey}.name`);
    }
    return slug;
  };

  const stats = [
    {
      icon: FileText,
      label: t('copyResults.stats.totalCopies'),
      value: copyResults.length.toString(),
      color: '#6B46C1'
    },
    {
      icon: Star,
      label: t('copyResults.stats.favorites'),
      value: copyResults.filter(c => c.is_favorite).length.toString(),
      color: '#ECC94B'
    },
    {
      icon: TrendingUp,
      label: t('copyResults.stats.thisMonth'),
      value: copyResults.filter(c => {
        const date = new Date(c.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length.toString(),
      color: '#38A169'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('copyResults.title')}</h1>
            <p className="text-muted-foreground">
              {t('copyResults.subtitle')}
            </p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('copyResults.filter.all')}</SelectItem>
              <SelectItem value="favorites">{t('copyResults.filter.favorites')}</SelectItem>
              {uniqueAgents.map(agent => (
                <SelectItem key={agent} value={agent}>{getAgentLabel(agent)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className="space-y-3">
                  <div 
                    className="p-3 rounded-lg w-fit"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon 
                      className="h-6 w-6" 
                      style={{ color: stat.color }}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Copy Results List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : filteredResults.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('copyResults.empty.title')}
            description={t('copyResults.empty.description')}
          />
        ) : (
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <Card key={result.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">
                        {result.title || getAgentLabel(result.agent_slug)}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">{getAgentLabel(result.agent_slug)}</Badge>
                        {result.is_edited && (
                          <Badge variant="outline" className="text-xs">
                            <Pencil className="h-3 w-3 mr-1" />
                            {t('copyResults.editedBadge')}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {new Date(result.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap line-clamp-4">
                        {result.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(result.id, result.is_favorite)}
                      >
                        <Star 
                          className={`h-5 w-5 ${result.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(result.content)}
                      >
                        <Copy className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditOpen(result)}
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCopyResult(result.id)}
                      >
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingResult} onOpenChange={(open) => { if (!open) handleEditCancel(); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('copyResults.editTitle')}</DialogTitle>
            <DialogDescription>{t('copyResults.editDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[300px] resize-y [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleEditCancel}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard Confirmation */}
      <AlertDialog open={showDiscardAlert} onOpenChange={setShowDiscardAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('copyResults.discardChanges')}</AlertDialogTitle>
            <AlertDialogDescription>{t('copyResults.discardChangesDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardConfirm}>
              {t('copyResults.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
