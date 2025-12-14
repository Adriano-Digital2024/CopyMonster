import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

const AGENT_CONFIG = {
  slug: 'brand-positioning-monster',
  name: 'Brand Positioning Monster (DNA)',
  color: '#6B46C1',
  tKey: 'positioner'
};

export default function Positioning() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mappingTitle, setMappingTitle] = useState('');

  const handleMessagesChange = useCallback((newMessages: Message[]) => {
    setMessages(newMessages);
  }, []);

  const countCompletedBlocks = (msgs: Message[]): number => {
    // Count user messages as completed blocks (each user response = 1 block completed)
    const userMessages = msgs.filter(m => m.role === 'user');
    return Math.min(userMessages.length, 12);
  };

  const handleSave = useCallback((msgs: Message[]) => {
    setMappingTitle(`Posicionamento ${new Date().toLocaleDateString('pt-BR')}`);
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

      const { error } = await supabase
        .from('positioning_mappings')
        .insert({
          user_id: user.id,
          title: mappingTitle || `Posicionamento ${new Date().toLocaleDateString('pt-BR')}`,
          status: isCompleted ? 'completed' : 'in_progress',
          conversation: conversationData,
          completed_blocks: completedBlocks,
        });

      if (error) throw error;

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
            showSaveButton={true}
            onMessagesChange={handleMessagesChange}
            onSave={handleSave}
          />
        </Card>
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
    </DashboardLayout>
  );
}
