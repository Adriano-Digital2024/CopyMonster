import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  Sparkles, 
  Target,
  CheckCircle2,
  Clock,
  Calendar,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AgentSelectionModal } from '@/components/positioning/AgentSelectionModal';
import { ExportDocumentModal } from '@/components/positioning/ExportDocumentModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface PositioningMapping {
  id: string;
  title: string;
  status: string;
  completed_blocks: number;
  conversation: any;
  created_at: string;
  updated_at: string;
}

export default function Library() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [mappings, setMappings] = useState<PositioningMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMapping, setSelectedMapping] = useState<PositioningMapping | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [mappingToRename, setMappingToRename] = useState<PositioningMapping | null>(null);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (user) {
      loadMappings();
    }
  }, [user]);

  const loadMappings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('positioning_mappings')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setMappings(data || []);
    } catch (error) {
      console.error('Error loading mappings:', error);
      toast({
        title: t('common.error'),
        description: t('library.loadError', 'Erro ao carregar posicionamentos'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!mappingToDelete) return;
    
    try {
      const { error } = await supabase
        .from('positioning_mappings')
        .delete()
        .eq('id', mappingToDelete);

      if (error) throw error;
      
      setMappings(prev => prev.filter(m => m.id !== mappingToDelete));
      toast({
        title: t('common.success'),
        description: t('library.deleteSuccess', 'Posicionamento excluído com sucesso'),
      });
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast({
        title: t('common.error'),
        description: t('library.deleteError', 'Erro ao excluir posicionamento'),
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setMappingToDelete(null);
    }
  };

  const handleRename = async () => {
    if (!mappingToRename || !newTitle.trim()) return;
    
    try {
      const { error } = await supabase
        .from('positioning_mappings')
        .update({ title: newTitle.trim() })
        .eq('id', mappingToRename.id);

      if (error) throw error;
      
      setMappings(prev => prev.map(m => 
        m.id === mappingToRename.id ? { ...m, title: newTitle.trim() } : m
      ));
      toast({
        title: t('common.success'),
        description: t('library.renameSuccess', 'Título atualizado com sucesso'),
      });
    } catch (error) {
      console.error('Error renaming mapping:', error);
      toast({
        title: t('common.error'),
        description: t('library.renameError', 'Erro ao renomear posicionamento'),
        variant: 'destructive'
      });
    } finally {
      setRenameDialogOpen(false);
      setMappingToRename(null);
      setNewTitle('');
    }
  };

  const handleCreateCopy = (mapping: PositioningMapping) => {
    setSelectedMapping(mapping);
    setIsAgentModalOpen(true);
  };

  const handleViewMapping = (mapping: PositioningMapping) => {
    setSelectedMapping(mapping);
    setIsExportModalOpen(true);
  };

  const handleContinueMapping = (mapping: PositioningMapping) => {
    // Store mapping id to continue
    localStorage.setItem('continue_mapping_id', mapping.id);
    navigate('/dashboard/positioning');
  };

  const filteredMappings = mappings.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const completedMappings = mappings.filter(m => m.status === 'completed');
  const inProgressMappings = mappings.filter(m => m.status === 'in_progress');

  // Convert conversation array to Message[] format for ExportDocumentModal
  const getMessagesFromConversation = (conversation: any[]) => {
    if (!conversation || !Array.isArray(conversation)) return [];
    return conversation.map((msg, index) => ({
      id: String(index),
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.timestamp || Date.now())
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              {t('library.title', 'Minha Biblioteca')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('library.subtitle', 'Seus posicionamentos estratégicos de marca')}
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard/positioning')} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('library.newPositioning', 'Novo Posicionamento')}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mappings.length}</p>
              <p className="text-sm text-muted-foreground">{t('library.totalMappings', 'Total')}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedMappings.length}</p>
              <p className="text-sm text-muted-foreground">{t('library.completed', 'Completos')}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgressMappings.length}</p>
              <p className="text-sm text-muted-foreground">{t('library.inProgress', 'Em Progresso')}</p>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder={t('library.searchPlaceholder', 'Buscar posicionamentos...')} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : filteredMappings.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={search 
              ? t('library.empty.searchTitle', 'Nenhum resultado encontrado')
              : t('library.empty.title', 'Nenhum posicionamento ainda')
            }
            description={search 
              ? t('library.empty.searchDesc', 'Tente buscar por outro termo')
              : t('library.empty.defaultDesc', 'Crie seu primeiro mapeamento estratégico de marca')
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMappings.map((mapping) => (
              <Card 
                key={mapping.id} 
                className="p-5 hover:shadow-lg transition-all duration-200 group relative overflow-hidden"
              >
                {/* Status indicator */}
                <div className="absolute top-0 left-0 right-0 h-1" 
                  style={{ 
                    background: mapping.status === 'completed' 
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)' 
                      : 'linear-gradient(90deg, #f59e0b, #d97706)' 
                  }} 
                />

                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold line-clamp-1">{mapping.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={mapping.status === 'completed' ? 'default' : 'secondary'}
                            className={mapping.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}
                          >
                            {mapping.status === 'completed' 
                              ? t('library.statusCompleted', 'Completo')
                              : t('library.statusInProgress', 'Em Progresso')
                            }
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewMapping(mapping)}>
                          <Eye className="h-4 w-4 mr-2" />
                          {t('library.view', 'Visualizar')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setMappingToRename(mapping);
                          setNewTitle(mapping.title);
                          setRenameDialogOpen(true);
                        }}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          {t('library.rename', 'Renomear')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            setMappingToDelete(mapping.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('library.delete', 'Excluir')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">{t('library.progress', 'Progresso')}</span>
                      <span className="font-medium">{mapping.completed_blocks}/12</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(mapping.completed_blocks / 12) * 100}%`,
                          background: mapping.status === 'completed' 
                            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                            : 'linear-gradient(90deg, #f59e0b, #d97706)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(mapping.updated_at).toLocaleDateString(i18n.language, {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {mapping.status === 'completed' ? (
                      <Button 
                        className="flex-1 gap-2"
                        onClick={() => handleCreateCopy(mapping)}
                      >
                        <Sparkles className="h-4 w-4" />
                        {t('library.createCopy', 'Criar Copy')}
                      </Button>
                    ) : (
                      <Button 
                        className="flex-1 gap-2"
                        variant="secondary"
                        onClick={() => handleContinueMapping(mapping)}
                      >
                        <Clock className="h-4 w-4" />
                        {t('library.continue', 'Continuar')}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleViewMapping(mapping)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Agent Selection Modal */}
      <AgentSelectionModal
        open={isAgentModalOpen}
        onOpenChange={setIsAgentModalOpen}
        mappingId={selectedMapping?.id}
      />

      {/* Export/View Modal */}
      {selectedMapping && (
        <ExportDocumentModal
          open={isExportModalOpen}
          onOpenChange={setIsExportModalOpen}
          messages={getMessagesFromConversation(selectedMapping.conversation)}
          title={selectedMapping.title}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('library.deleteConfirmTitle', 'Excluir posicionamento?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('library.deleteConfirmDesc', 'Esta ação não pode ser desfeita. O posicionamento será permanentemente excluído.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('library.delete', 'Excluir')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('library.renameTitle', 'Renomear Posicionamento')}</DialogTitle>
            <DialogDescription>
              {t('library.renameDesc', 'Digite um novo título para o posicionamento')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newTitle">{t('library.titleLabel', 'Título')}</Label>
            <Input
              id="newTitle"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t('library.titlePlaceholder', 'Ex: Posicionamento Produto X')}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleRename} disabled={!newTitle.trim()}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
