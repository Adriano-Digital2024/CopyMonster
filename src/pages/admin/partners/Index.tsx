import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PayoutQueue from "./PayoutQueue";
import RuleEngine from "./RuleEngine";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Banknote, Settings2 } from "lucide-react";

const AdminPartners = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-primary" />
          Partners Management
        </h1>
        <p className="text-muted-foreground">Monitor financial exposure, approve payouts, and manage commission strategies.</p>
      </div>

      <Tabs defaultValue="payouts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payouts" className="gap-2">
            <Banknote className="h-4 w-4" />
            Payout Queue
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Rule Engine
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="payouts" className="space-y-4">
          <PayoutQueue />
        </TabsContent>
        
        <TabsContent value="rules" className="space-y-4">
          <RuleEngine />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPartners;
