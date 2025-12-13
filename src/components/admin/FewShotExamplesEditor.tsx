import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface FewShotExample {
  id: string;
  input: string;
  output: string;
}

interface FewShotExamplesEditorProps {
  examples: FewShotExample[];
  onChange: (examples: FewShotExample[]) => void;
}

export function FewShotExamplesEditor({ examples, onChange }: FewShotExamplesEditorProps) {
  const addExample = () => {
    const newExample: FewShotExample = {
      id: crypto.randomUUID(),
      input: '',
      output: '',
    };
    onChange([...examples, newExample]);
  };

  const updateExample = (id: string, field: 'input' | 'output', value: string) => {
    onChange(
      examples.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  };

  const removeExample = (id: string) => {
    onChange(examples.filter((ex) => ex.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Exemplos Few-Shot</Label>
        <Button type="button" variant="outline" size="sm" onClick={addExample}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Exemplo
        </Button>
      </div>

      {examples.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground text-sm">
            Nenhum exemplo adicionado. Exemplos few-shot melhoram significativamente a qualidade das respostas.
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={addExample} className="mt-2">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar primeiro exemplo
          </Button>
        </div>
      )}

      {examples.map((example, index) => (
        <Card key={example.id} className="relative">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                Exemplo {index + 1}
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => removeExample(example.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Input do Usuário</Label>
              <Textarea
                value={example.input}
                onChange={(e) => updateExample(example.id, 'input', e.target.value)}
                placeholder="Ex: Crie uma headline para um curso de inglês online..."
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Output Esperado</Label>
              <Textarea
                value={example.output}
                onChange={(e) => updateExample(example.id, 'output', e.target.value)}
                placeholder="Ex: 'Fale Inglês Fluente em 90 Dias Sem Sair de Casa — Mesmo que Você Nunca Tenha Estudado Antes'"
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {examples.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Dica: Forneça 2-3 exemplos de alta qualidade para os melhores resultados. Os exemplos devem refletir o tom e a estrutura desejados.
        </p>
      )}
    </div>
  );
}
