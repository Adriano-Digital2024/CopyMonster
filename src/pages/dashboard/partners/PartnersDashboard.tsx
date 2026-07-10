import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Wallet, Timer, CheckCircle, ShieldAlert, Loader2 } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { toast } from "sonner";

const PartnersDashboard = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // 1. Perfil e KYC
  const { data: profile } = useQuery({
    queryKey: ["partner-profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliate.profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // 2. Regra Atual (Saque Mínimo)
  const { data: rule } = useQuery({
    queryKey: ["current-rule"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliate.commission_rules").select("*").eq("is_current", true).single();
      if (error) throw error;
      return data;
    },
  });

  // 3. Saldo Real via Ledger
  const { data: financialData } = useQuery({
    queryKey: ["partner-financials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("finance.ledger_entries").select("amount, entry_type, reference_type");
      if (error) throw error;
      const available = data.reduce((acc, entry) => entry.entry_type === "CREDIT" ? acc + Number(entry.amount) : acc - Number(entry.amount), 0);
      const paid = data.filter(e => e.entry_type === "DEBIT" && e.reference_type === "PAYOUT").reduce((acc, e) => acc + Number(e.amount), 0);
      return { available, paid };
    },
  });

  // 4. Todas as Comissões (Transparência)
  const { data: commissions } = useQuery({
    queryKey: ["partner-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliate.commissions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // 5. Solicitação de Saque
  const payoutMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.paypal_email) throw new Error("PayPal email not configured");
      const { error } = await supabase.from("finance.payout_requests").insert({
        affiliate_id: profile.id,
        amount: financialData?.available || 0,
        paypal_email_snapshot: profile.paypal_email,
        status: "REQUESTED"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação de saque enviada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["partner-financials"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const canWithdraw = (financialData?.available || 0) >= (rule?.min_payout_amount || 100) && profile?.kyc_status === "APPROVED";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold">{t("dashboard.partners.title")}</h1>
          <Button 
            onClick={() => payoutMutation.mutate()} 
            disabled={!canWithdraw || payoutMutation.isPending}
            className="w-full md:w-auto"
          >
            {payoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("dashboard.partners.wallet.withdraw")} (Min ${Number(rule?.min_payout_amount || 100).toFixed(2)})
          </Button>
        </div>

        {(!profile || profile.kyc_status !== "APPROVED") && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>KYC Required</AlertTitle>
            <AlertDescription>{t("dashboard.partners.kyc_alert")}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.partners.stats.holding")}</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${commissions?.filter(c => c.status === 'HOLDING').reduce((acc, c) => acc + Number(c.commission_amount), 0).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.partners.stats.available")}</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${(financialData?.available || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.partners.stats.paid")}</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">${(financialData?.paid || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.partners.transparency.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("dashboard.partners.transparency.description")}</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.partners.transparency.col_date")}</TableHead>
                  <TableHead>{t("dashboard.partners.transparency.col_amount")}</TableHead>
                  <TableHead>{t("dashboard.partners.transparency.col_status")}</TableHead>
                  <TableHead className="w-[200px]">{t("dashboard.partners.transparency.col_release")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions?.map((commission) => {
                  const daysLeft = Math.max(0, differenceInDays(parseISO(commission.eligible_at), new Date()));
                  const progress = ((45 - daysLeft) / 45) * 100;
                  return (
                    <TableRow key={commission.id}>
                      <TableCell>{format(parseISO(commission.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="font-medium">${Number(commission.commission_amount).toFixed(2)}</TableCell>
                      <TableCell>
                        {commission.status === "HOLDING" ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">{t("dashboard.partners.transparency.days_left", { days: daysLeft })}</span>
                            <Progress value={progress} className="h-1 w-24" />
                          </div>
                        ) : (
                          <span className="text-primary font-semibold">{t("dashboard.partners.transparency.ready")}</span>
                        )}
                      </TableCell>
                      <TableCell>{format(parseISO(commission.eligible_at), "dd/MM/yyyy")}</TableCell>
                    </TableRow>
                  );
                })}
                {(!commissions || commissions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PartnersDashboard;
