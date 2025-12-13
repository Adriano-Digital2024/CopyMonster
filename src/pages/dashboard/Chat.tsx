import { Card } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useTranslation } from 'react-i18next';

export default function Chat() {
  const { t } = useTranslation();
  
  const agentName = t('chat.generalAgentName', { defaultValue: 'Assistente Geral' });
  const agentDescription = t('chat.generalAgentDescription', { defaultValue: 'Chat genérico para qualquer tarefa de copywriting' });
  const systemPrompt = t('chat.generalAgentSystemPrompt', { defaultValue: 'Você é um assistente de copywriting versátil. Ajude o usuário com qualquer tarefa relacionada a criação de conteúdo, copy e marketing.' });

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full flex flex-col">
        <div>
          <h1 className="text-3xl font-bold mb-2">{agentName}</h1>
          <p className="text-muted-foreground">
            {agentDescription}
          </p>
        </div>

        <Card className="flex-1 min-h-[600px] flex flex-col">
          <ChatInterface
            agentName={agentName}
            agentColor="#6B46C1"
            systemPrompt={systemPrompt}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}