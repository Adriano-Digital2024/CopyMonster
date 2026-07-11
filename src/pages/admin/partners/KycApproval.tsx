import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const KycApproval = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // 1. Buscar parceiros pendentes
  const { data: pendingPartners, isLoading } = useQuery({
    queryKey: ["admin-pending-kyc"],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('affiliate')
        .from("profiles")
        .select("*")
        .eq("kyc_status", "PENDING")
        .eq("active", true);
      if (error) throw error;
      return data;
    },
  });

  // 2. Mutação para Aprovar/Rejeitar
  const kycMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: 'APPROVED' | 'REJECTED'; reason: string }) => {
      const { error: profileError } = await supabase
        .schema('affiliate')
        .from("profiles")
        .update({ kyc_status: status })
        .eq("id", id);
      if (profileError) throw profileError;

      await supabase
        .schema('affiliate')
        .from("audit_logs")
        .insert({
          action: status === 'APPROVED' ? 'KYC_APPROVAL' : 'KYC_REJECTION',
          reason: reason,
          metadata: { profile_id: id }
        });
    },
    onSuccess: (_, variables) => {
      toast.success(`Parceiro ${variables.status === 'APPROVED' ? 'aprovado' : 'rejeitado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["admin-pending-kyc"] });
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Aprovação de Parceiros (KYC)</h2>
        <p className="text-sm text-muted-foreground">Revise os dados fiscais antes de autorizar a geração de comissões.</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome Completo</TableHead>
            <TableHead>CPF/CNPJ</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>E-mail PayPal</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingPartners?.map((partner) => (
            <TableRow key={partner.id}>
              <TableCell className="font-medium">{partner.full_name || "Não preenchido"}</TableCell>
              <TableCell>{partner.cpf_cnpj || "Não preenchido"}</TableCell>
              <TableCell>{partner.address_city} / {partner.address_state}</TableCell>
              <TableCell>{partner.paypal_email}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  disabled={kycMutation.isPending}
                  onClick={() => kycMutation.mutate({ id: partner.id, status: 'REJECTED', reason: 'Dados inconsistentes' })}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                </Button>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={kycMutation.isPending}
                  onClick={() => kycMutation.mutate({ id: partner.id, status: 'APPROVED', reason: 'Documentação validada' })}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Aprovar
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!pendingPartners || pendingPartners.length === 0) && !isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Nenhum parceiro aguardando aprovação.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default KycApproval;
