import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Target, Sparkles, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ChatInterface, Message } from '@/components/chat/ChatInterface';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useDnaGuard } from '@/hooks/useDnaGuard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgentSelectionModal } from '@/components/positioning/AgentSelectionModal';
import { ExportDocumentModal } from '@/components/positioning/ExportDocumentModal';
import { CompletionPanel } from '@/components/positioning/CompletionPanel';
import { extractBlocksFromConversation } from '@/lib/positioning-extractor';

const AGENT_CONFIG = {
  slug: 'brand-positioning-monster',
  name: 'Brand Positioning Monster (DNA)',
  color: '#6B46C1',
  tKey: 'positioner'
};

export default function Positioning() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { canCreateMore, dnaCount, dnaLimit, isLoading: dnaLoading } = useDnaGuard();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mappingTitle, setMappingTitle] = useState('');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFlowComplete, setIsFlowComplete] = useState(false);
  const [savedMappingId, setSavedMappingId] = useState<string | null>(null);
  const [showCompletionPanel, setShowCompletionPanel] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Check for mapping to continue from library
  useEffect(() => {
    const continueId = localStorage.getItem('continue_mapping_id');
    if (continueId && user) {
      localStorage.removeItem('continue_mapping_id');
      loadExistingMapping(continueId);
    } else if (!continueId && !dnaLoading && !canCreateMore && !savedMappingId) {
      // User is starting a new DNA but has hit the limit
      setShowLimitModal(true);
    }
  }, [user, dnaLoading, canCreateMore, savedMappingId]);

  const loadExistingMapping = async (mappingId: string) => {
    try {
      const { data, error } = await supabase
        .from('positioning_mappings')
        .select('*')
        .eq('id', mappingId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setSavedMappingId(data.id);
        setMappingTitle(data.title);
        // Restore conversation
        if (data.conversation && Array.isArray(data.conversation)) {
          const restoredMessages = data.conversation.map((msg: any, index: number) => ({
            id: String(index),
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.timestamp || Date.now())
          }));
          setMessages(restoredMessages);
        }
      }
    } catch (error) {
      console.error('Error loading mapping:', error);
    }
  };

  const handleMessagesChange = useCallback((newMessages: Message[]) => {
    setMessages(newMessages);
    
    // Detect flow completion by checking for completion indicators
    const lastMessage = newMessages[newMessages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.content) {
      const content = lastMessage.content.toLowerCase();
      const completionIndicators = [
        'mapeamento estratégico está completo',
        'strategic mapping is complete',
        'mapeo estratégico está completo',
        'qual agente você gostaria',
        'which agent would you like',
        'qué agente te gustaría',
        'mapeamento estratégico completo',
        'strategic mapping complete',
        'mapeo estratégico completo',
      ];
      
      if (completionIndicators.some(indicator => content.includes(indicator))) {
        setIsFlowComplete(true);
        setShowCompletionPanel(true);
      }
    }
  }, []);

  // Auto-save when flow completes
  useEffect(() => {
    if (isFlowComplete && !savedMappingId && user && messages.length > 0) {
      autoSaveMapping();
    }
  }, [isFlowComplete]);

  const countCompletedBlocks = (msgs: Message[]): number => {
    // Count user messages as completed blocks (each user response = 1 block completed)
    const userMessages = msgs.filter(m => m.role === 'user');
    return Math.min(userMessages.length, 12);
  };

  const autoSaveMapping = async () => {
    if (!user || messages.length === 0 || savedMappingId) return;
    
    try {
      const completedBlocks = countCompletedBlocks(messages);
      const autoTitle = `${t('positioning.title')} ${new Date().toLocaleDateString(i18n.language)}`;
      
      // Prepare conversation data
      const conversationData = messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString()
      }));

      // Extract blocks from conversation
      const extractedBlocks = extractBlocksFromConversation(messages);

      const { data, error } = await supabase
        .from('positioning_mappings')
        .insert({
          user_id: user.id,
          title: autoTitle,
          status: 'completed',
          conversation: conversationData,
          completed_blocks: completedBlocks,
          ...extractedBlocks,
        })
        .select('id')
        .single();

      if (error) throw error;

      setSavedMappingId(data.id);
      setMappingTitle(autoTitle);
      
      toast({
        title: t('positioning.autoSaveSuccessTitle', 'Mapeamento salvo automaticamente'),
        description: t('positioning.autoSaveSuccessDesc', 'Seu posicionamento foi salvo com sucesso'),
      });
    } catch (error: any) {
      console.error('Error auto-saving mapping:', error);
    }
  };

  const handleSave = useCallback((msgs: Message[]) => {
    setMappingTitle(`${t('positioning.title')} ${new Date().toLocaleDateString(i18n.language)}`);
    setIsSaveDialogOpen(true);
  }, []);

  const confirmSave = async () => {
    if (!user || messages.length === 0) return;
    
    setIsSaving(true);
    
    try {
      const completedBlocks = countCompletedBlocks(messages);
      const isCompleted = completedBlocks >= 12;
      
      // Prepare conversation data
      const conversationData = messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString()
      }));

      // If already saved, update instead
      if (savedMappingId) {
        const { error } = await supabase
          .from('positioning_mappings')
          .update({
            title: mappingTitle || `${t('positioning.title')} ${new Date().toLocaleDateString(i18n.language)}`,
            status: isCompleted ? 'completed' : 'in_progress',
            conversation: conversationData,
            completed_blocks: completedBlocks,
          })
          .eq('id', savedMappingId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('positioning_mappings')
          .insert({
            user_id: user.id,
            title: mappingTitle || `${t('positioning.title')} ${new Date().toLocaleDateString(i18n.language)}`,
            status: isCompleted ? 'completed' : 'in_progress',
            conversation: conversationData,
            completed_blocks: completedBlocks,
          })
          .select('id')
          .single();

        if (error) throw error;
        setSavedMappingId(data.id);
      }
      
      toast({
        title: t('positioning.saveSuccessTitle'),
        description: t('positioning.saveSuccessDesc', { blocks: completedBlocks }),
      });
      
      setIsSaveDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving mapping:', error);
      toast({
        title: t('positioning.saveErrorTitle'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewMapping = () => {
    setIsExportModalOpen(true);
  };

  const handleCreateCopys = () => {
    setIsAgentModalOpen(true);
  };

  const completedBlocks = countCompletedBlocks(messages);

  return (
    <DashboardLayout>
      <div className="space-y-4 h-full flex flex-col">
        {/* Header with Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div 
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: `${AGENT_CONFIG.color}20` }}
            >
              <Target 
                className="h-5 w-5" 
                style={{ color: AGENT_CONFIG.color }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{t(`agents.list.${AGENT_CONFIG.tKey}.name`)}</h1>
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Sparkles className="h-3 w-3" />
                  {t('positioning.guided')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{t('positioning.subtitle')}</p>
            </div>
          </div>
          
          {/* Progress and Save */}
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {completedBlocks}/12 {t('positioning.blocksCompleted')}
                  </p>
                  <div className="w-32 h-2 bg-muted rounded-full mt-1">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(completedBlocks / 12) * 100}%`,
                        backgroundColor: AGENT_CONFIG.color 
                      }}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave(messages)}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {t('positioning.save')}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Chat Interface - Full Height with Auto-Start */}
        <Card className="flex-1 min-h-[600px] flex flex-col overflow-hidden">
          <ChatInterface
            agentName={t(`agents.list.${AGENT_CONFIG.tKey}.name`)}
            agentColor={AGENT_CONFIG.color}
            agentSlug={AGENT_CONFIG.slug}
            autoStart={true}
            showSaveButton={false}
            onMessagesChange={handleMessagesChange}
            onSave={handleSave}
          />
        </Card>

        {/* Completion Panel - Shows inline when flow is complete */}
        {showCompletionPanel && (
          <CompletionPanel
            onViewMapping={handleViewMapping}
            onCreateCopys={handleCreateCopys}
            agentColor={AGENT_CONFIG.color}
          />
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('positioning.saveDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('positioning.saveDialogDesc', { blocks: completedBlocks })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="mappingTitle">{t('positioning.mappingTitle')}</Label>
            <Input
              id="mappingTitle"
              value={mappingTitle}
              onChange={(e) => setMappingTitle(e.target.value)}
              placeholder={t('positioning.mappingTitlePlaceholder')}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('positioning.saving')}
                </>
              ) : (
                t('positioning.confirmSave')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DNA Limit Modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dna.limit.reached.title')}</DialogTitle>
            <DialogDescription>
              {t('dna.limit.reached.message', { count: dnaCount, limit: dnaLimit, plan: user?.subscription_status || 'free' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowLimitModal(false); navigate('/dashboard/library'); }}>
              {t('dna.limit.reached.stay')}
            </Button>
            <Button onClick={() => navigate('/dashboard/billing')}>
              {t('dna.limit.reached.upgrade')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent Selection Modal */}
      <AgentSelectionModal
        open={isAgentModalOpen}
        onOpenChange={setIsAgentModalOpen}
        mappingId={savedMappingId || undefined}
      />

      {/* Export Document Modal */}
      <ExportDocumentModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        messages={messages}
        title={mappingTitle || t('positioning.exportDocument', 'Strategic Mapping')}
      />
    </DashboardLayout>
  );
}
