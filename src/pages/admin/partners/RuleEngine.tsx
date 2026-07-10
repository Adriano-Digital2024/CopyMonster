import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

const RuleEngine = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  const { data: rules } = useQuery({
    queryKey: ["admin-commission-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate.commission_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (values: any) => {
      // Step A: Set current to false
      await supabase
        .from("affiliate.commission_rules")
        .update({ is_current: false })
        .eq("is_current", true);
      
      // Step B: Insert new rule
      const { data: newRule, error: ruleError } = await supabase.from("affiliate.commission_rules").insert({
        version_name: values.version_name,
        percentage: Number(values.percentage),
        retention_days: Number(values.retention_days),
        is_current: true
      }).select().single();
      
      if (ruleError) throw ruleError;

      // Step C: Auditoria (Regra de Ouro)
      await supabase.from("affiliate.audit_logs").insert({
        action: 'RULE_CHANGE',
        reason: `Nova estratégia publicada: ${values.version_name}`,
        metadata: { 
          version: values.version_name, 
          percentage: values.percentage, 
          retention: values.retention_days 
        }
      });
    },
    onSuccess: () => {
      toast.success(t("admin.partners.rule_engine.success_publish"));
      queryClient.invalidateQueries({ queryKey: ["admin-commission-rules"] });
      reset();
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.partners.rule_engine.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("admin.partners.rule_engine.description")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((v) => publishMutation.mutate(v))} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("admin.partners.rule_engine.form_version")}</label>
              <Input {...register("version_name", { required: true })} placeholder="e.g. v2 - 2026 Strategy" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.partners.rule_engine.form_percent")}</label>
                <Input type="number" {...register("percentage", { required: true })} placeholder="30" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.partners.rule_engine.form_retention")}</label>
                <Input type="number" {...register("retention_days", { required: true })} placeholder="45" />
              </div>
            </div>
            <Button className="w-full" type="submit" disabled={publishMutation.isPending}>
              {publishMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.partners.rule_engine.btn_publish")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.partners.rule_engine.history")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules?.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.version_name}</TableCell>
                  <TableCell>{Number(rule.percentage).toFixed(0)}%</TableCell>
                  <TableCell>{rule.retention_days}</TableCell>
                  <TableCell>
                    {rule.is_current ? (
                      <Badge className="bg-primary">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Legacy</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RuleEngine;
