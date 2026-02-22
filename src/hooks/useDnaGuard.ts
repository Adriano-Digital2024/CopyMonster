import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DnaProject {
  id: string;
  title: string;
  status: string;
  completed_blocks: number;
  created_at: string;
  updated_at: string;
}

interface DnaGuardResult {
  hasDna: boolean;
  dnaCount: number;
  dnaList: DnaProject[];
  dnaLimit: number;
  canCreateMore: boolean;
  isLoading: boolean;
}

const DNA_LIMITS: Record<string, number> = {
  free: 1,
  starter: 1,
  pro: 10,
  legend: 50,
};

export function useDnaGuard(): DnaGuardResult {
  const { user } = useAuth();
  const [dnaList, setDnaList] = useState<DnaProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const plan = user?.subscription_status || 'free';
  const dnaLimit = DNA_LIMITS[plan] ?? 1;

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchDna = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('positioning_mappings')
          .select('id, title, status, completed_blocks, created_at, updated_at')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('updated_at', { ascending: false });

        if (!error && data) {
          setDnaList(data);
        }
      } catch (err) {
        console.error('Error fetching DNA projects:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDna();
  }, [user]);

  const dnaCount = dnaList.length;
  const hasDna = dnaCount > 0;
  const canCreateMore = dnaCount < dnaLimit;

  return {
    hasDna,
    dnaCount,
    dnaList,
    dnaLimit,
    canCreateMore,
    isLoading,
  };
}
