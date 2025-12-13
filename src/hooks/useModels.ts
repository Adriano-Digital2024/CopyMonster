import { useState, useEffect } from 'react';

export interface AIModel {
  id: string;
  modelId: string;
  name: string;
  description: string;
  provider: string;
  active: boolean;
  maxTokens: string;
  contextWindow: string;
  costPer1k: string;
  status: 'operational' | 'available' | 'maintenance';
}

const STORAGE_KEY = 'copymonster_models';

const DEFAULT_MODELS: AIModel[] = [
  {
    id: '1',
    modelId: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Balanced choice under Gemini: less cost & latency than Pro',
    provider: 'Google',
    active: true,
    maxTokens: '8192',
    contextWindow: '1000000',
    costPer1k: '0.000',
    status: 'operational',
  },
  {
    id: '2',
    modelId: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Top-tier in Gemini family. Strongest at handling complex reasoning',
    provider: 'Google',
    active: true,
    maxTokens: '8192',
    contextWindow: '2000000',
    costPer1k: '0.000',
    status: 'operational',
  },
  {
    id: '3',
    modelId: 'openai/gpt-5',
    name: 'GPT-5',
    description: 'Powerful all-rounder. Excellent reasoning, long context',
    provider: 'OpenAI',
    active: true,
    maxTokens: '16384',
    contextWindow: '128000',
    costPer1k: '0.000',
    status: 'operational',
  },
];

export const useModels = () => {
  const [models, setModels] = useState<AIModel[]>(() => {
    // Initialize from localStorage or use defaults
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored models:', e);
        return DEFAULT_MODELS;
      }
    }
    return DEFAULT_MODELS;
  });

  // Sync to localStorage whenever models change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
    // Dispatch custom event to sync across components
    window.dispatchEvent(new CustomEvent('models-updated', { detail: models }));
  }, [models]);

  // Listen for updates from other components
  useEffect(() => {
    const handleUpdate = (e: CustomEvent) => {
      setModels(e.detail);
    };
    window.addEventListener('models-updated', handleUpdate as EventListener);
    return () => window.removeEventListener('models-updated', handleUpdate as EventListener);
  }, []);

  const addModel = (model: Omit<AIModel, 'id'>) => {
    const newModel: AIModel = {
      ...model,
      id: Date.now().toString(),
    };
    setModels([...models, newModel]);
    return newModel;
  };

  const updateModel = (id: string, updates: Partial<AIModel>) => {
    setModels(models.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteModel = (id: string) => {
    setModels(models.filter(m => m.id !== id));
  };

  const toggleModel = (id: string) => {
    setModels(models.map(m => 
      m.id === id ? { ...m, active: !m.active } : m
    ));
  };

  const getActiveModels = () => {
    return models.filter(m => m.active);
  };

  return {
    models,
    addModel,
    updateModel,
    deleteModel,
    toggleModel,
    getActiveModels,
  };
};
