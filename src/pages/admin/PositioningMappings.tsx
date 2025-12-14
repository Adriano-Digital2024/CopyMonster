import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Target, Search, Eye, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface PositioningMapping {
  id: string;
  user_id: string;
  title: string;
  status: string;
  completed_blocks: number;
  created_at: string;
  updated_at: string;
  block_1_audience: string | null;
  block_2_pain_points: string | null;
  block_3_solution: string | null;
  block_4_differentiators: string | null;
  block_5_awareness_stage: string | null;
  block_6_urgency: string | null;
  block_7_social_proof: string | null;
  block_8_objections: string | null;
  block_9_emotional_connection: string | null;
  block_10_transformation: string | null;
  block_11_voice: string | null;
  block_12_promises: string | null;
  profiles?: { email: string; first_name: string };
}

const PositioningMappings = () => {
  const { t } = useTranslation();
  const [mappings, setMappings] = useState<PositioningMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMapping, setSelectedMapping] = useState<PositioningMapping | null>(null);

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    setLoading(true);
    const { data: mappingsData, error } = await supabase
      .from('positioning_mappings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && mappingsData) {
      // Fetch user profiles separately
      const userIds = [...new Set(mappingsData.map(m => m.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, first_name')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const enrichedMappings = mappingsData.map(m => ({
        ...m,
        profiles: profilesMap.get(m.user_id)
      }));
      
      setMappings(enrichedMappings as PositioningMapping[]);
    }
    setLoading(false);
  };

  const filteredMappings = mappings.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMappings = mappings.length;
  const completedMappings = mappings.filter(m => m.status === 'completed').length;
  const inProgressMappings = mappings.filter(m => m.status === 'in_progress').length;

  const blockLabels = [
    'Público-Alvo',
    'Dores e Frustrações',
    'Solução/Benefícios',
    'Diferenciais',
    'Nível de Consciência',
    'Urgência/Escassez',
    'Prova Social',
    'Objeções',
    'Conexão Emocional',
    'Transformação',
    'Voz do Público',
    'Promessas'
  ];

  const getBlockValue = (mapping: PositioningMapping, index: number) => {
    const blockKey = `block_${index + 1}_${['audience', 'pain_points', 'solution', 'differentiators', 'awareness_stage', 'urgency', 'social_proof', 'objections', 'emotional_connection', 'transformation', 'voice', 'promises'][index]}`;
    return (mapping as any)[blockKey];
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Mapeamentos de Posicionamento</h1>
          <p className="text-muted-foreground mt-2">
            Visualize os mapeamentos estratégicos criados pelos usuários
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Mapeamentos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMappings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedMappings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{inProgressMappings}</div>
            </CardContent>
          </Card>
        </div>

        {/* Mappings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Mapeamentos</CardTitle>
            <CardDescription>Todos os mapeamentos de posicionamento estratégico</CardDescription>
            <div className="flex items-center gap-2 mt-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Blocos</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell className="font-medium">{mapping.title}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{mapping.profiles?.first_name}</p>
                          <p className="text-sm text-muted-foreground">{mapping.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {mapping.status === 'completed' ? (
                          <Badge className="bg-green-500">Completo</Badge>
                        ) : (
                          <Badge variant="outline">Em Progresso</Badge>
                        )}
                      </TableCell>
                      <TableCell>{mapping.completed_blocks}/12</TableCell>
                      <TableCell>
                        {format(new Date(mapping.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMapping(mapping)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedMapping} onOpenChange={() => setSelectedMapping(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedMapping?.title}</DialogTitle>
              <DialogDescription>
                Por {selectedMapping?.profiles?.first_name} ({selectedMapping?.profiles?.email})
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {blockLabels.map((label, index) => {
                  const value = selectedMapping ? getBlockValue(selectedMapping, index) : null;
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                        Bloco {index + 1}: {label}
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">
                        {value || <span className="text-muted-foreground italic">Não preenchido</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default PositioningMappings;
