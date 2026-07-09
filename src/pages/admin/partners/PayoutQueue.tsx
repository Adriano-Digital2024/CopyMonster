import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

const PayoutQueue = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance.payout_requests")
        .select(`
          *,
          affiliate:affiliate_id (
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
    mutationFn: async (payoutId: string) => {
      const { data, error } = await supabase.functions.invoke("payout-executor", {
        body: { payoutId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(t("admin.partners.payout_queue.success_payout"));
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (err: any) => {
      toast.error(`Payout Failed: ${err.message}`);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{t("admin.partners.payout_queue.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("admin.partners.payout_queue.description")}</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.partners.payout_queue.col_affiliate")}</TableHead>
            <TableHead>{t("admin.partners.payout_queue.col_amount")}</TableHead>
            <TableHead>{t("admin.partners.payout_queue.col_paypal")}</TableHead>
            <TableHead>{t("admin.partners.payout_queue.col_risk")}</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts?.map((payout) => (
            <TableRow key={payout.id}>
              <TableCell className="font-mono text-xs">{payout.affiliate_id.slice(0, 8)}...</TableCell>
              <TableCell className="font-bold">${Number(payout.amount).toFixed(2)}</TableCell>
              <TableCell>{payout.paypal_email_snapshot}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className={payout.risk_score > 60 ? "text-destructive font-bold" : ""}>
                    {payout.risk_score}
                  </span>
                  {payout.risk_score > 60 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {t("admin.partners.payout_queue.high_risk")}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  size="sm" 
                  disabled={payoutMutation.isPending}
                  onClick={() => payoutMutation.mutate(payout.id)}
                >
                  {payoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("admin.partners.payout_queue.btn_approve")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!payouts || payouts.length === 0) && !isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No pending payout requests.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PayoutQueue;
