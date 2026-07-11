import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, DollarSign } from "lucide-react";

const PayoutQueue = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('finance')
        .from("payout_requests")
        .select(`
          *,
          affiliate:affiliate_id (
            full_name,
            cpf_cnpj,
            paypal_email
          )
        `)
        .eq("status", "REQUESTED")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const payoutMutation = useMutation({
    mutationFn: async ({ payoutId, amount, partnerData }: any) => {
      const { data, error } = await supabase.functions.invoke("payout-executor", {
        body: { payoutId },
      });
      if (error) throw error;

      await supabase
        .schema('affiliate')
        .from("audit_logs")
        .insert({
          action: 'PAYOUT_APPROVAL',
          reason: 'Aprovação manual administrativa',
          metadata: {
            payout_id: payoutId,
            amount: amount,
            recipient: partnerData
          }
        });
      
      return data;
    },
    onSuccess: () => {
      toast.success("Pagamento aprovado!");
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Fila de Aprovação de Saques</h2>
        <p className="text-sm text-muted-foreground">Clique para enviar o pagamento ao afiliado.</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Afiliado</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>E-mail PayPal</TableHead>
            <TableHead>Risco</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts?.map((payout) => (
            <TableRow key={payout.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{payout.affiliate?.full_name || "N/A"}</span>
                  <span className="text-xs text-muted-foreground">{payout.affiliate?.cpf_cnpj}</span>
                </div>
              </TableCell>
              <TableCell className="font-bold text-green-600">${Number(payout.amount).toFixed(2)}</TableCell>
              <TableCell>{payout.paypal_email_snapshot}</TableCell>
              <TableCell>
                <Badge variant={payout.risk_score > 60 ? "destructive" : "outline"}>
                  {payout.risk_score}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  size="sm" 
                  disabled={payoutMutation.isPending}
                  onClick={() => payoutMutation.mutate({ 
                    payoutId: payout.id, 
                    amount: payout.amount,
                    partnerData: payout.affiliate 
                  })}
                >
                  {payoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4 mr-1" />}
                  Pagar
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!payouts || payouts.length === 0) && !isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Vazio.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PayoutQueue;
