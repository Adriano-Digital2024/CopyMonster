import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check, X, Clock, UploadCloud } from 'lucide-react';


// Affiliate/finance schemas are not present in the generated public types.
const sb = supabase as any;
const ValidationQueue = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Record<string, 'approve' | 'reject'>>({});

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await sb
        .schema('affiliate')
        .from('commissions')
        .select(`
          id,
          commission_amount,
          amount_gross,
          stripe_event_id,
          eligible_at,
          created_at,
          status,
          affiliate_id,
          affiliate:affiliate_id ( full_name, paypal_email, kyc_status )
        `)
        .eq('status', 'PENDING_VALIDATION')
        .order('eligible_at', { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (e: any) {
      toast({ title: 'Erro ao carregar fila', description: e.message, variant: 'destructive' });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (commissionId: string, action: 'approve' | 'reject', amount: number, affiliateName?: string) => {
    setPending((p) => ({ ...p, [commissionId]: action }));
    try {
      const { data, error } = await sb.functions.invoke('approve-commission', {
        body: { commissionId, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: action === 'approve' ? 'Crédito aprovado' : 'Crédito rejeitado',
        description: action === 'approve'
          ? `${affiliateName ?? 'Afiliado'} — $${Number(amount).toFixed(2)} creditados no saldo.`
          : `Comissão cancelada. Nenhum crédito foi gerado.`,
      });
      setItems((prev) => (prev ?? []).filter((c) => c.id !== commissionId));
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setPending((p) => {
        const n = { ...p };
        delete n[commissionId];
        return n;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <UploadCloud className="h-6 w-6" />
          Validação de Créditos
        </h2>
        <p className="text-muted-foreground mt-1">
          Comissões que completaram o período de retenção e aguardam validação manual.
          Aprovar credita o saldo do afiliado (grava CREDIT no ledger). Rejeitar cancela.
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-[400px] w-full" />
      ) : !items || items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
            Nenhuma comissão aguardando validação.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((c) => {
            const affiliateName = c.affiliate?.[0]?.full_name ?? c.affiliate?.full_name ?? '—';
            const affiliateEmail = c.affiliate?.[0]?.paypal_email ?? c.affiliate?.paypal_email ?? '—';
            return (
              <Card key={c.id}>
                <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {c.stripe_event_id?.slice(-12) ?? c.id.slice(0, 8)}
                      </Badge>
                      <span className="font-medium">{affiliateName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Bruto: ${(Number(c.amount_gross) || 0).toFixed(2)} ·
                      Comissão: <span className="text-emerald-600 font-semibold">${(Number(c.commission_amount) || 0).toFixed(2)}</span> ·
                      Eligível desde: {new Date(c.eligible_at).toLocaleDateString()}
                    </div>
                    {affiliateEmail !== '—' && (
                      <div className="text-xs text-muted-foreground">PayPal: {affiliateEmail}</div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => act(c.id, 'approve', Number(c.commission_amount), affiliateName)}
                      disabled={!!pending[c.id]}
                    >
                      {pending[c.id] === 'approve' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                      Aprovar crédito
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => act(c.id, 'reject', Number(c.commission_amount), affiliateName)}
                      disabled={!!pending[c.id]}
                    >
                      {pending[c.id] === 'reject' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <X className="h-4 w-4 mr-1" />}
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ValidationQueue;