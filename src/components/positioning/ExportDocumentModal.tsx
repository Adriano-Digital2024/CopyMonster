import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, FileDown, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/components/chat/ChatInterface';

interface ExportDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
  title?: string;
}

function cleanMarkdown(text: string): string {
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove bold/italic markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove excessive emojis but keep some
    .replace(/([✅❌🎯📋🚀💡🎁👉📧📱🎬📄]){2,}/g, '$1')
    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function generateCleanDocument(messages: Message[], title: string): string {
  const assistantMessages = messages
    .filter(m => m.role === 'assistant' && m.content.trim())
    .map(m => cleanMarkdown(m.content));

  const userMessages = messages
    .filter(m => m.role === 'user' && m.content.trim() && m.content !== '__auto_start__')
    .map(m => m.content);

  // Try to find the final mapping document
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1] || '';
  
  // Check if it contains the complete mapping
  if (lastAssistantMessage.includes('MAPEAMENTO ESTRATÉGICO') || 
      lastAssistantMessage.includes('STRATEGIC MAPPING')) {
    return `${title}\n${'='.repeat(title.length)}\n\n${lastAssistantMessage}`;
  }

  // Otherwise, compile from all messages
  let document = `${title}\n${'='.repeat(title.length)}\n\n`;
  document += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
  document += '---\n\n';

  // Interleave Q&A format
  for (let i = 0; i < Math.max(assistantMessages.length, userMessages.length); i++) {
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
}: ExportDocumentModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const cleanDocument = generateCleanDocument(messages, title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanDocument);
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
    const blob = new Blob([cleanDocument], { type: 'text/plain;charset=utf-8' });
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {t('positioning.exportDocument', 'Exportar Documento')}
          </DialogTitle>
          <DialogDescription>
            {t('positioning.exportDocumentDesc', 'Documento limpo e formatado para uso profissional')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] rounded-md border p-4">
          <pre className="text-sm whitespace-pre-wrap font-sans">
            {cleanDocument}
          </pre>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('positioning.copied', 'Copiado')}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                {t('positioning.copyDocument', 'Copiar')}
              </>
            )}
          </Button>
          <Button onClick={handleDownload}>
            <FileDown className="h-4 w-4 mr-2" />
            {t('positioning.downloadDocument', 'Baixar .txt')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
