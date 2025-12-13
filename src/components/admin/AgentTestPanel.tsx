import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Play, Loader2, Trash2, Clock, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AgentTestPanelProps {
  agentConfig: {
    name: string;
    system_prompt: string;
    role_definition: string;
    core_function: string;
    expected_inputs: string;
    output_structure: string;
    quality_rules: string;
    model_id: string;
    temperature: number;
    max_tokens: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
    tone: string;
    language: string;
    persona_name: string;
    persona_backstory: string;
    min_words: number;
    max_words: number;
  };
}

interface TestResult {
  input: string;
  output: string;
  tokensUsed: number;
  responseTime: number;
  timestamp: Date;
}

export function AgentTestPanel({ agentConfig }: AgentTestPanelProps) {
  const { t } = useTranslation();
  const [testInput, setTestInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [streamingOutput, setStreamingOutput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamingOutput, testResults]);

  const buildMasterPrompt = () => {
    const parts = [];

    parts.push(`# IDENTIDADE\nVocê é o ${agentConfig.name} do CopyMonster.`);

    if (agentConfig.role_definition) {
      parts.push(`\n\n# PAPEL\n${agentConfig.role_definition}`);
    }

    if (agentConfig.persona_name && agentConfig.persona_backstory) {
      parts.push(`\n\n# PERSONA\nNome: ${agentConfig.persona_name}\n${agentConfig.persona_backstory}`);
    }

    if (agentConfig.core_function) {
      parts.push(`\n\n# FUNÇÃO CENTRAL\n${agentConfig.core_function}`);
    }

    if (agentConfig.quality_rules) {
      parts.push(`\n\n# REGRAS DE QUALIDADE\n${agentConfig.quality_rules}`);
    }

    if (agentConfig.expected_inputs) {
      parts.push(`\n\n# INPUTS ESPERADOS\n${agentConfig.expected_inputs}`);
    }

    if (agentConfig.output_structure) {
      parts.push(`\n\n# ESTRUTURA DE SAÍDA\n${agentConfig.output_structure}`);
    }

    parts.push(`\n\n# CONFIGURAÇÕES\n- Tom: ${agentConfig.tone}\n- Idioma: ${agentConfig.language}\n- Limites: ${agentConfig.min_words}-${agentConfig.max_words} palavras`);

    if (agentConfig.system_prompt) {
      parts.push(`\n\n# INSTRUÇÕES ADICIONAIS\n${agentConfig.system_prompt}`);
    }

    return parts.join('');
  };

  const handleTest = async () => {
    if (!testInput.trim()) return;

    setIsLoading(true);
    setStreamingOutput('');
    const startTime = Date.now();

    try {
      const masterPrompt = buildMasterPrompt();

      const response = await fetch(
        `https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/agent-test`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            input: testInput,
            system_prompt: masterPrompt,
            model_id: agentConfig.model_id,
            temperature: agentConfig.temperature,
            max_tokens: agentConfig.max_tokens,
            top_p: agentConfig.top_p,
            frequency_penalty: agentConfig.frequency_penalty,
            presence_penalty: agentConfig.presence_penalty,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Test failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullOutput = '';
      let tokensUsed = 0;

      if (reader) {
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullOutput += content;
                setStreamingOutput(fullOutput);
              }
              if (parsed.usage?.total_tokens) {
                tokensUsed = parsed.usage.total_tokens;
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
      }

      const responseTime = Date.now() - startTime;

      setTestResults(prev => [
        ...prev,
        {
          input: testInput,
          output: fullOutput,
          tokensUsed,
          responseTime,
          timestamp: new Date(),
        },
      ]);

      setStreamingOutput('');
      setTestInput('');
    } catch (error) {
      console.error('Test error:', error);
      setStreamingOutput('Erro ao testar o agente. Verifique as configurações.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setStreamingOutput('');
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Testar Agente
            </CardTitle>
            <CardDescription>
              Teste as configurações do agente em tempo real (não consome créditos)
            </CardDescription>
          </div>
          {testResults.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearResults}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Digite uma mensagem de teste para o agente..."
            className="min-h-[100px]"
            disabled={isLoading}
          />
          <Button 
            onClick={handleTest} 
            disabled={isLoading || !testInput.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Testar Agente
              </>
            )}
          </Button>
        </div>

        <ScrollArea className="h-[400px] border rounded-lg p-4" ref={scrollRef}>
          {streamingOutput && (
            <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">Gerando resposta...</span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {streamingOutput}
              </div>
            </div>
          )}

          {testResults.map((result, index) => (
            <div key={index} className="mb-6 last:mb-0">
              <div className="mb-2 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">Input:</p>
                <p className="text-sm">{result.input}</p>
              </div>
              <div className="p-3 bg-background border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Output:</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      {result.tokensUsed || '~'} tokens
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {(result.responseTime / 1000).toFixed(1)}s
                    </Badge>
                  </div>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {result.output}
                </div>
              </div>
            </div>
          ))}

          {!streamingOutput && testResults.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Nenhum teste realizado ainda</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
