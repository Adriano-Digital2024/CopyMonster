import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Download, Trash2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  agentName: string;
  agentColor: string;
  systemPrompt?: string;
  agentSlug?: string;
  autoStart?: boolean;
  showSaveButton?: boolean;
  positioningMappingId?: string;
  onCreditsUpdate?: (newCredits: number) => void;
  onMessagesChange?: (messages: Message[]) => void;
  onSave?: (messages: Message[]) => void;
}

export function ChatInterface({ 
  agentName, 
  agentColor, 
  systemPrompt, 
  agentSlug, 
  autoStart = false,
  showSaveButton = false,
  positioningMappingId,
  onCreditsUpdate,
  onMessagesChange,
  onSave
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Notify parent of messages changes
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  // Auto-start effect for guided agents
  useEffect(() => {
    if (autoStart && !hasAutoStarted && messages.length === 0 && user) {
      setHasAutoStarted(true);
      handleAutoStart();
    }
  }, [autoStart, hasAutoStarted, messages.length, user]);

  // Handle API errors
  const handleApiError = (response: Response, errorData: any) => {
    if (response.status === 402) {
      // Credits depleted or trial expired
      if (errorData.code === 'TRIAL_EXPIRED') {
        toast({
          title: t('trial.expired.title'),
          description: t('trial.expired.description'),
          variant: 'destructive'
        });
      } else {
        toast({
          title: t('chat.insufficientCreditsTitle'),
          description: t('chat.insufficientCreditsDesc'),
          variant: 'destructive'
        });
      }
      navigate('/dashboard/billing');
      return true;
    }
    
    if (response.status === 429) {
      toast({
        title: t('chat.rateLimitTitle'),
        description: t('chat.rateLimitDesc'),
        variant: 'destructive'
      });
      return true;
    }
    
    return false;
  };

  // Update credits from response header
  const updateCreditsFromResponse = (response: Response) => {
    const creditsHeader = response.headers.get('X-Credits-Remaining');
    if (creditsHeader !== null) {
      const newCredits = parseInt(creditsHeader, 10);
      if (!isNaN(newCredits)) {
        updateUser({ credits: newCredits });
        if (onCreditsUpdate) {
          onCreditsUpdate(newCredits);
        }
      }
    }
  };

  const handleAutoStart = async () => {
    if (!user || user.credits <= 0) {
      toast({
        title: t('chat.insufficientCreditsTitle'),
        description: t('chat.insufficientCreditsDesc'),
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    const assistantMessageId = Date.now().toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages([assistantMessage]);

    try {
      const response = await fetch(
        `https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/chat-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: '__auto_start__' }],
            system_prompt: systemPrompt,
            agent_slug: agentSlug,
            auto_start: true,
            positioning_mapping_id: positioningMappingId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (handleApiError(response, errorData)) {
          setMessages([]);
          return;
        }
        throw new Error(errorData.error || 'Failed to get response from AI');
      }

      // Update credits from header
      updateCreditsFromResponse(response);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response stream');
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullContent }
                    : msg
                )
              );
            }
          } catch (e) {
            // Ignore parsing errors for incomplete JSON chunks
          }
        }
      }

      toast({
        title: t('chat.creditUsedTitle'),
        description: t('chat.creditUsedDesc', { credits: user.credits - 1 })
      });

    } catch (error: any) {
      console.error('Auto-start error:', error);
      const errorMessage = t('chat.errorMessage', { error: error.message });
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: errorMessage }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    if (!user || user.credits <= 0) {
      toast({
        title: t('chat.insufficientCreditsTitle'),
        description: t('chat.insufficientCreditsDesc'),
        variant: 'destructive'
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const messagesPayload = currentMessages
        .filter(({ role, content }) => role !== 'assistant' || content.trim() !== '')
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch(
        `https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/chat-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            messages: messagesPayload,
            system_prompt: systemPrompt,
            agent_slug: agentSlug,
            positioning_mapping_id: positioningMappingId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (handleApiError(response, errorData)) {
          // Remove the empty assistant message
          setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
          return;
        }
        throw new Error(errorData.error || 'Failed to get response from AI');
      }

      // Update credits from header
      updateCreditsFromResponse(response);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response stream');
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullContent }
                    : msg
                )
              );
            }
          } catch (e) {
            // Ignore parsing errors for incomplete JSON chunks
          }
        }
      }
      
      toast({
        title: t('chat.creditUsedTitle'),
        description: t('chat.creditUsedDesc', { credits: user.credits - 1 })
      });

    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = t('chat.errorMessage', { error: error.message });
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: errorMessage }
            : msg
        )
      );
      toast({
        title: t('chat.errorTitle'),
        description: t('chat.errorDesc'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = messages.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agentName.replace(/\s/g, '-')}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: t('chat.exportSuccessTitle'),
      description: t('chat.exportSuccessDesc')
    });
  };

  const handleClear = () => {
    setMessages([]);
    setHasAutoStarted(false);
    toast({
      title: t('chat.clearSuccessTitle'),
      description: t('chat.clearSuccessDesc')
    });
  };

  const handleSave = useCallback(() => {
    if (onSave && messages.length > 0) {
      onSave(messages);
    }
  }, [messages, onSave]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: agentColor }}
          />
          <span className="font-medium">{agentName}</span>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              {showSaveButton && onSave && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  title={t('chat.saveMapping')}
                  className="text-primary"
                >
                  <Save className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                title="Exportar conversa"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                title="Limpar histórico"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            {autoStart ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-lg font-medium mb-2">{t('chat.startingGuide')}</p>
                <p className="text-sm">{t('chat.preparingQuestions')}</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">
                  {t(`chat.welcome.${agentSlug?.replace(/-/g, '_')}.title`, { defaultValue: t('chat.startConversation', { agentName }) })}
                </p>
                <p className="text-sm max-w-md">
                  {t(`chat.welcome.${agentSlug?.replace(/-/g, '_')}.description`, { defaultValue: t('chat.startConversationDesc') })}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg p-4',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
             {isLoading && messages.length > 0 && messages[messages.length - 1]?.content === '' && (
              <div className="flex justify-start mt-4">
                <div className="bg-muted rounded-lg p-4 inline-flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t('chat.inputPlaceholder')}
            className="min-h-[60px] max-h-[200px]"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {t('chat.creditsAvailable', { credits: user?.credits ?? 0 })}
        </p>
      </div>
    </div>
  );
}
