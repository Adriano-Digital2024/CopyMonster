import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, FileDown, Check, FileText, Sparkles, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/components/chat/ChatInterface';
import { cn } from '@/lib/utils';

const MAX_CHARS = 2000;

interface ExportDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
  title?: string;
  documentContent?: string;
  isEdited?: boolean;
  onSaveEdit?: (content: string) => void;
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/([✅❌🎯📋🚀💡🎁👉📧📱🎬📄]){2,}/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function generateCleanDocument(messages: Message[], title: string): string {
  const assistantMessages = messages
    .filter(m => m.role === 'assistant' && m.content.trim())
    .map(m => cleanMarkdown(m.content));

  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1] || '';
  
  if (lastAssistantMessage.includes('MAPEAMENTO ESTRATÉGICO') || 
      lastAssistantMessage.includes('STRATEGIC MAPPING') ||
      lastAssistantMessage.includes('MAPEO ESTRATÉGICO')) {
    return `${title}\n${'='.repeat(title.length)}\n\n${new Date().toLocaleDateString()}\n\n---\n\n${lastAssistantMessage}`;
  }

  let document = `${title}\n${'='.repeat(title.length)}\n\n`;
  document += `${new Date().toLocaleDateString()}\n\n`;
  document += '---\n\n';

  for (let i = 0; i < assistantMessages.length; i++) {
    if (assistantMessages[i]) {
      document += assistantMessages[i] + '\n\n';
    }
  }

  return document;
}

export function ExportDocumentModal({
  open,
  onOpenChange,
  messages,
  title = 'Mapeamento Estratégico',
  documentContent,
  isEdited = false,
  onSaveEdit,
}: ExportDocumentModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [showDiscardAlert, setShowDiscardAlert] = useState(false);

  const cleanDocument = documentContent || generateCleanDocument(messages, title);

  const handleStartEdit = () => {
    setEditableContent(cleanDocument);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (editableContent !== cleanDocument) {
      setShowDiscardAlert(true);
    } else {
      setIsEditing(false);
      setEditableContent('');
    }
  };

  const handleDiscardConfirm = () => {
    setShowDiscardAlert(false);
    setIsEditing(false);
    setEditableContent('');
  };

  const handleSaveEdit = () => {
    if (onSaveEdit) {
      onSaveEdit(editableContent);
    }
    setIsEditing(false);
    setEditableContent('');
  };

  const displayContent = isEditing ? editableContent : cleanDocument;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayContent);
      setCopied(true);
      toast({
        title: t('positioning.copiedTitle', 'Copiado!'),
        description: t('positioning.copiedDesc', 'Documento copiado para a área de transferência'),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: t('positioning.copyErrorTitle', 'Erro ao copiar'),
        description: t('positioning.copyErrorDesc', 'Não foi possível copiar o documento'),
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    
    setTimeout(() => {
      const blob = new Blob([displayContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: t('positioning.downloadedTitle', 'Download Iniciado'),
        description: t('positioning.downloadedDesc', 'Seu documento foi baixado'),
      });
      
      setDownloading(false);
    }, 500);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => {
        if (!o && isEditing) {
          handleCancelEdit();
          return;
        }
        onOpenChange(o);
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh]">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl">
                    {t('positioning.exportDocument', 'Mapeamento Estratégico')}
                  </DialogTitle>
                  {isEdited && !isEditing && (
                    <Badge variant="outline" className="text-xs">
                      <Pencil className="h-3 w-3 mr-1" />
                      {t('positioning.editedBadge')}
                    </Badge>
                  )}
                </div>
                <DialogDescription>
                  {t('positioning.exportDocumentDesc', 'Documento profissional pronto para uso')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Document Preview / Edit */}
          <div className="relative">
            {!isEditing && (
              <div className="absolute top-3 right-3 z-10">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 border">
                  <Sparkles className="h-3 w-3" />
                  <span>{t('positioning.cleanFormat', 'Formato limpo')}</span>
                </div>
              </div>
            )}
            
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  className="min-h-[400px] resize-y font-sans text-sm leading-relaxed"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={editableContent.length > MAX_CHARS ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                    {t('copyResults.charCount', { count: editableContent.length, max: MAX_CHARS })}
                  </span>
                  {editableContent.length > MAX_CHARS && (
                    <span className="text-destructive">{t('copyResults.charLimitWarning')}</span>
                  )}
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[400px] rounded-xl border bg-muted/20 p-6">
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground/90">
                  {cleanDocument}
                </pre>
              </ScrollArea>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="lg" onClick={handleCancelEdit} className="min-w-[140px]">
                  {t('common.cancel')}
                </Button>
                <Button size="lg" onClick={handleSaveEdit} className="min-w-[140px]">
                  {t('common.save')}
                </Button>
              </>
            ) : (
              <>
                {onSaveEdit && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleStartEdit}
                    className="gap-2 min-w-[140px]"
                  >
                    <Pencil className="h-4 w-4" />
                    {t('positioning.editDocument', 'Editar Documento')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCopy}
                  className={cn(
                    'gap-2 min-w-[140px] transition-all duration-200',
                    copied && 'bg-green-500/10 border-green-500/50 text-green-600'
                  )}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Check className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Copy className="h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {copied ? t('positioning.copied', 'Copiado!') : t('positioning.copyDocument', 'Copiar Texto')}
                </Button>
                
                <Button
                  size="lg"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="gap-2 min-w-[160px]"
                >
                  {downloading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <FileDown className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  {downloading ? t('positioning.downloading', 'Baixando...') : t('positioning.downloadDocument', 'Baixar Documento')}
                </Button>
              </>
            )}
          </div>
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
    </>
  );
}
