import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Type, Search, Heart, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Headline {
  id: string;
  content: string;
  category: string | null;
  tags: string[] | null;
  is_favorite: boolean;
  created_at: string;
  user_id: string;
  profiles?: { email: string; first_name: string };
}

const AdminHeadlines = () => {
  const { t } = useTranslation();
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHeadlines();
  }, []);

  const fetchHeadlines = async () => {
    setLoading(true);
    const { data: headlinesData, error } = await supabase
      .from('headlines')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (!error && headlinesData) {
      // Fetch user profiles separately
      const userIds = [...new Set(headlinesData.map(h => h.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, first_name')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const enrichedHeadlines = headlinesData.map(h => ({
        ...h,
        profiles: profilesMap.get(h.user_id)
      }));
      
      setHeadlines(enrichedHeadlines as Headline[]);
    }
    setLoading(false);
  };

  const filteredHeadlines = headlines.filter(h =>
    h.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalHeadlines = headlines.length;
  const favoriteHeadlines = headlines.filter(h => h.is_favorite).length;
  const categorizedHeadlines = headlines.filter(h => h.category).length;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Headlines</h1>
          <p className="text-muted-foreground mt-2">
            Visualize todas as headlines geradas pelos usuários
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Headlines</CardTitle>
              <Type className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHeadlines}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Favoritas</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{favoriteHeadlines}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categorizadas</CardTitle>
              <Tag className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{categorizedHeadlines}</div>
            </CardContent>
          </Card>
        </div>

        {/* Headlines Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Headlines</CardTitle>
            <CardDescription>Todas as headlines criadas na plataforma</CardDescription>
            <div className="flex items-center gap-2 mt-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por conteúdo, usuário ou categoria..."
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
            ) : filteredHeadlines.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma headline encontrada.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Headline</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHeadlines.map((headline) => (
                    <TableRow key={headline.id}>
                      <TableCell className="font-medium max-w-[400px]">
                        <p className="line-clamp-2">{headline.content}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{headline.profiles?.first_name}</p>
                          <p className="text-sm text-muted-foreground">{headline.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {headline.category ? (
                          <Badge variant="outline">{headline.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {headline.tags?.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {headline.tags && headline.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{headline.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {headline.is_favorite && (
                          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(headline.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminHeadlines;
