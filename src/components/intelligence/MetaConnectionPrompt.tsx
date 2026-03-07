import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, RefreshCw, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MetaConnectionPromptProps {
  isConnected: boolean;
  hasData: boolean;
  isSynced?: boolean;
}

export function MetaConnectionPrompt({ isConnected, hasData, isSynced }: MetaConnectionPromptProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isConnected && hasData) return null;

  // Connected + synced but no data found
  const noDataAfterSync = isConnected && isSynced && !hasData;

  return (
    <Card className="p-8 text-center space-y-4">
      <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        {noDataAfterSync ? (
          <SearchX className="h-7 w-7 text-primary" />
        ) : isConnected ? (
          <RefreshCw className="h-7 w-7 text-primary" />
        ) : (
          <Link2 className="h-7 w-7 text-primary" />
        )}
      </div>
      <div>
        <h3 className="font-semibold text-lg">
          {noDataAfterSync
            ? t('intelligence.metaPrompt.noDataTitle', 'Nenhum dado encontrado')
            : isConnected
              ? t('intelligence.metaPrompt.syncTitle', 'Sincronize seus dados')
              : t('intelligence.metaPrompt.connectTitle', 'Conecte sua conta Meta')}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          {noDataAfterSync
            ? t('intelligence.metaPrompt.noDataDesc', 'Sua conta Meta está conectada e sincronizada, mas nenhum dado de anúncio foi encontrado nos últimos 90 dias. Verifique se a conta de anúncios possui campanhas ativas ou recentes.')
            : isConnected
              ? t('intelligence.metaPrompt.syncDesc', 'Sua conta Meta está conectada! Vá em Configurações → Integrações e clique em "Sincronizar" para importar seus dados de anúncios.')
              : t('intelligence.metaPrompt.connectDesc', 'Para visualizar seus dados de performance, conecte sua conta Meta Ads em Configurações → Integrações.')}
        </p>
      </div>
      {!noDataAfterSync && (
        <Button onClick={() => navigate('/dashboard/settings?tab=integrations')} variant="default">
          {isConnected
            ? t('intelligence.metaPrompt.goSync', 'Ir para Sincronizar')
            : t('intelligence.metaPrompt.goConnect', 'Conectar Meta Ads')}
        </Button>
      )}
    </Card>
  );
}
