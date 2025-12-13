import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export interface Agent {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  is_public: boolean;
  is_featured: boolean;
  system_prompt: string;
  role_definition: string | null;
  core_function: string | null;
  expected_inputs: string | null;
  output_structure: string | null;
  quality_rules: string | null;
  few_shot_examples: Json;
  knowledge_base_ids: Json;
  model_id: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  tone: string;
  language: string;
  persona_name: string | null;
  persona_backstory: string | null;
  min_words: number;
  max_words: number;
  max_characters: number | null;
  created_at: string;
  updated_at: string;
}

export interface AgentFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  is_public: boolean;
  is_featured: boolean;
  system_prompt: string;
  role_definition: string;
  core_function: string;
  expected_inputs: string;
  output_structure: string;
  quality_rules: string;
  few_shot_examples: Json;
  knowledge_base_ids: Json;
  model_id: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  tone: string;
  language: string;
  persona_name: string;
  persona_backstory: string;
  min_words: number;
  max_words: number;
  max_characters: number | null;
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setAgents((data as Agent[]) || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: 'Erro ao carregar agentes',
        description: 'Não foi possível carregar a lista de agentes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getAgentBySlug = useCallback(async (slug: string): Promise<Agent | null> => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as Agent;
    } catch (error) {
      console.error('Error fetching agent:', error);
      return null;
    }
  }, []);

  const updateAgent = useCallback(async (id: string, updates: Partial<AgentFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Agente atualizado',
        description: 'As configurações do agente foram salvas com sucesso.',
      });

      await fetchAgents();
      return true;
    } catch (error) {
      console.error('Error updating agent:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações do agente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchAgents, toast]);

  const createAgent = useCallback(async (agentData: AgentFormData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('agents')
        .insert([agentData]);

      if (error) throw error;

      toast({
        title: 'Agente criado',
        description: 'O novo agente foi criado com sucesso.',
      });

      await fetchAgents();
      return true;
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: 'Erro ao criar',
        description: 'Não foi possível criar o agente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchAgents, toast]);

  const deleteAgent = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Agente excluído',
        description: 'O agente foi excluído com sucesso.',
      });

      await fetchAgents();
      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o agente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchAgents, toast]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    loading,
    fetchAgents,
    getAgentBySlug,
    updateAgent,
    createAgent,
    deleteAgent,
  };
}
