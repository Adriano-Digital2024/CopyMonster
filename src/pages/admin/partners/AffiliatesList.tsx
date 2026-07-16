import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  APPROVED: 'default',
  PENDING: 'secondary',
  REJECTED: 'destructive',
};

const AffiliatesList = () => {
  const { data: affiliates, isLoading } = useQuery({
    queryKey: ["admin-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('affiliate')
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{affiliates?.length || 0} afiliados cadastrados</span>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>E-mail PayPal</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliates?.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.full_name || '-'}</TableCell>
                  <TableCell>{a.cpf_cnpj || '-'}</TableCell>
                  <TableCell>{a.paypal_email || '-'}</TableCell>
                  <TableCell>{a.address_city && a.address_state ? `${a.address_city}/${a.address_state}` : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[a.kyc_status] || 'outline'}>
                      {a.kyc_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {(!affiliates || affiliates.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum afiliado cadastrado.
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

export default AffiliatesList;
