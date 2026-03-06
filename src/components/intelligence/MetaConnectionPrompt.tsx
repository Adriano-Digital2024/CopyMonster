import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MetaConnectionPromptProps {
  isConnected: boolean;
  hasData: boolean;
}

export function MetaConnectionPrompt({ isConnected, hasData }: MetaConnectionPromptProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isConnected && hasData) return null;

  return (
    <Card className="p-8 text-center space-y-4">
      <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        {isConnected ? (
          <RefreshCw className="h-7 w-7 text-primary" />
        ) : (
          <Link2 className="h-7 w-7 text-primary" />
        )}
      </div>
      <div>
        <h3 className="font-semibold text-lg">
          {isConnected
            ? t('intelligence.metaPrompt.syncTitle', 'Sincronize seus dados')
            : t('intelligence.metaPrompt.connectTitle', 'Conecte sua conta Meta')}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          {isConnected
            ? t('intelligence.metaPrompt.syncDesc', 'Sua conta Meta está conectada! Vá em Configurações → Integrações e clique em "Sincronizar" para importar seus dados de anúncios.')
            : t('intelligence.metaPrompt.connectDesc', 'Para visualizar seus dados de performance, conecte sua conta Meta Ads em Configurações → Integrações.')}
        </p>
      </div>
      <Button onClick={() => navigate('/dashboard/settings?tab=integrations')} variant="default">
        {isConnected
          ? t('intelligence.metaPrompt.goSync', 'Ir para Sincronizar')
          : t('intelligence.metaPrompt.goConnect', 'Conectar Meta Ads')}
      </Button>
    </Card>
  );
}
