import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wallet, Timer, CheckCircle, ShieldAlert } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

const PartnersDashboard = () => {
  const { t } = useTranslation();

  // 1. Fetch KYC Status & Profile
  const { data: profile } = useQuery({
    queryKey: ["partner-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate.profiles")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch Ledger Balance (Available + Paid)
  const { data: financialData } = useQuery({
    queryKey: ["partner-financials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance.ledger_entries")
        .select("amount, entry_type, reference_type");
      if (error) throw error;
      
      const available = data.reduce((acc, entry) => {
        return entry.entry_type === "CREDIT" ? acc + Number(entry.amount) : acc - Number(entry.amount);
      }, 0);

      const paid = data
        .filter(e => e.entry_type === "DEBIT" && e.reference_type === "PAYOUT")
        .reduce((acc, e) => acc + Number(e.amount), 0);

      return { available, paid };
    },
  });

  // 3. Fetch Transparency Table (Commissions)
  const { data: commissions } = useQuery({
    queryKey: ["partner-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate.commissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{t("partners.title")}</h1>
      </div>

      {(!profile || profile.kyc_status !== "APPROVED") && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>KYC Required</AlertTitle>
          <AlertDescription>{t("partners.kyc_alert")}</AlertDescription>
        </Alert>
      )}

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("partners.stats.holding")}</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${commissions?.filter(c => c.status === 'HOLDING').reduce((acc, c) => acc + Number(c.commission_amount), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("partners.stats.available")}</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${(financialData?.available || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("partners.stats.paid")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">${(financialData?.paid || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transparency Center */}
      <Card>
        <CardHeader>
          <CardTitle>{t("partners.transparency.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("partners.transparency.description")}</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("partners.transparency.col_date")}</TableHead>
                <TableHead>{t("partners.transparency.col_amount")}</TableHead>
                <TableHead>{t("partners.transparency.col_status")}</TableHead>
                <TableHead className="w-[200px]">{t("partners.transparency.col_release")}</TableHead>
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
                          <span className="text-xs text-muted-foreground">
                            {t("partners.transparency.days_left", { days: daysLeft })}
                          </span>
                          <Progress value={progress} className="h-1 w-24" />
                        </div>
                      ) : (
                        <span className="text-primary font-semibold">{t("partners.transparency.ready")}</span>
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
  );
};

export default PartnersDashboard;
