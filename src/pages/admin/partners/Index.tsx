import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PayoutQueue from "./PayoutQueue";
import RuleEngine from "./RuleEngine";
import KycApproval from "./KycApproval";
import AffiliatesList from "./AffiliatesList";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Banknote, Settings2, UserCheck, Users } from "lucide-react";
import { AdminLayout } from "@/components/layouts/AdminLayout";

const AdminPartners = () => {
  const { t } = useTranslation();

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Partners Management
          </h1>
          <p className="text-muted-foreground">Monitor financial exposure, approve payouts, and manage commission strategies.</p>
        </div>

        <Tabs defaultValue="kyc" className="space-y-4">
          <TabsList>
            <TabsTrigger value="affiliates" className="gap-2">
              <Users className="h-4 w-4" />
              Afiliados
            </TabsTrigger>
            <TabsTrigger value="kyc" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Aprovação KYC
            </TabsTrigger>
            <TabsTrigger value="payouts" className="gap-2">
              <Banknote className="h-4 w-4" />
              Fila de Saques
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Motor de Regras
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="affiliates" className="space-y-4">
            <AffiliatesList />
          </TabsContent>

          <TabsContent value="kyc" className="space-y-4">
            <KycApproval />
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            <PayoutQueue />
          </TabsContent>
          
          <TabsContent value="rules" className="space-y-4">
            <RuleEngine />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminPartners;
