import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Wallet, Timer, CheckCircle, ShieldAlert, Loader2, UserPlus, Copy } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { toast } from "sonner";

const PartnersDashboard = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // 1. Perfil e KYC
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["partner-profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliate.profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // 2. Criar Perfil (Cadastrar-se)
  const createProfileMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("affiliate.profiles").insert({
        user_id: user.id,
        kyc_status: "PENDING",
        active: true
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação enviada!");
      queryClient.invalidateQueries({ queryKey: ["partner-profile"] });
    },
    onError: (err: any) => toast.error(`Erro ao se cadastrar: ${err.message}`),
  });

  // 3. Regra Atual
  const { data: rule } = useQuery({
    queryKey: ["current-rule"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliate.commission_rules").select("*").eq("is_current", true).single();
      if (error) throw error;
      return data;
    },
  });

  // 4. Saldo Real
  const { data: financialData } = useQuery({
    queryKey: ["partner-financials"],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase.from("finance.ledger_entries").select("amount, entry_type, reference_type");
      if (error) throw error;
      const available = data.reduce((acc, entry) => entry.entry_type === "CREDIT" ? acc + Number(entry.amount) : acc - Number(entry.amount), 0);
      const paid = data.filter(e => e.entry_type === "DEBIT" && e.reference_type === "PAYOUT").reduce((acc, e) => acc + Number(e.amount), 0);
      return { available, paid };
    },
  });

  // 5. Comissões
  const { data: commissions } = useQuery({
    queryKey: ["partner-commissions"],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliate.commissions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const copyReferralLink = () => {
    const link = `${window.location.origin}/chat?ref=${profile?.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  if (isLoadingProfile) return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;

  // TELA DE CADASTRO (Se não for parceiro ainda)
  if (!profile) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight">{t("partners.registration.title")}</h1>
            <p className="text-xl text-muted-foreground">{t("partners.registration.subtitle")}</p>
          </div>
          
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>{t("partners.registration.why_join")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-left">
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                <p dangerouslySetInnerHTML={{ __html: t("partners.registration.benefit_comm", { percent: rule?.percentage || 30 }) }} />
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                <p dangerouslySetInnerHTML={{ __html: t("partners.registration.benefit_payout") }} />
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                <p dangerouslySetInnerHTML={{ __html: t("partners.registration.benefit_dash") }} />
              </div>
            </CardContent>
          </Card>

          <Button size="lg" className="px-12 h-14 text-lg" onClick={() => createProfileMutation.mutate()} disabled={createProfileMutation.isPending}>
            {createProfileMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
            {t("partners.registration.cta")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // TELA DO DASHBOARD REAL (Se já for parceiro)
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t("dashboard.partners.title")}</h1>
            <p className="text-muted-foreground">ID: {profile.id}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none" onClick={copyReferralLink}>
              <Copy className="mr-2 h-4 w-4" /> {t("partners.transparency.title")} Link
            </Button>
            <Button disabled={(financialData?.available || 0) < (rule?.min_payout_amount || 100) || profile.kyc_status !== "APPROVED"}>
              {t("partners.wallet.withdraw")}
            </Button>
          </div>
        </div>

        {profile.kyc_status !== "APPROVED" && (
          <Alert variant="destructive" className="bg-destructive/10">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>{t("partners.registration.pending_title")}</AlertTitle>
            <AlertDescription>{t("partners.registration.pending_desc")}</AlertDescription>
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
          <CardHeader><CardTitle>{t("dashboard.partners.transparency.title")}</CardTitle><p className="text-sm text-muted-foreground">{t("dashboard.partners.transparency.description")}</p></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>{t("dashboard.partners.transparency.col_date")}</TableHead><TableHead>{t("dashboard.partners.transparency.col_amount")}</TableHead><TableHead>{t("dashboard.partners.transparency.col_status")}</TableHead><TableHead className="w-[200px] text-right">{t("dashboard.partners.transparency.col_release")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {commissions?.map((commission) => {
                  const daysLeft = Math.max(0, differenceInDays(parseISO(commission.eligible_at), new Date()));
                  const progress = ((45 - daysLeft) / 45) * 100;
                  return (
                    <TableRow key={commission.id}>
                      <TableCell>{format(parseISO(commission.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="font-medium">${Number(commission.commission_amount).toFixed(2)}</TableCell>
                      <TableCell>{commission.status === "HOLDING" ? (<div className="flex flex-col gap-1"><span className="text-xs text-muted-foreground">{t("dashboard.partners.transparency.days_left", { days: daysLeft })}</span><Progress value={progress} className="h-1 w-24" /></div>) : (<span className="text-primary font-semibold">{t("dashboard.partners.transparency.ready")}</span>)}</TableCell>
                      <TableCell className="text-right">{format(parseISO(commission.eligible_at), "dd/MM/yyyy")}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PartnersDashboard;
