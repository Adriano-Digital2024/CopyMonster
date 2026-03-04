import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DNA_LIMITS, VERSION_LIMITS } from '@/lib/dna-block-config';

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
  versionLimit: number;
  isLoading: boolean;
  checkVersionLimit: (mappingId: string) => Promise<{ canCreate: boolean; currentCount: number; limit: number }>;
}

export function useDnaGuard(): DnaGuardResult {
  const { user } = useAuth();
  const [dnaList, setDnaList] = useState<DnaProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const plan = user?.subscription_status || 'free';
  const dnaLimit = DNA_LIMITS[plan] ?? 1;
  const versionLimit = VERSION_LIMITS[plan] ?? 50;

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

  const checkVersionLimit = async (mappingId: string): Promise<{ canCreate: boolean; currentCount: number; limit: number }> => {
    if (!user) return { canCreate: false, currentCount: 0, limit: versionLimit };

    const { count } = await supabase
      .from('dna_versions')
      .select('id', { count: 'exact', head: true })
      .eq('mapping_id', mappingId)
      .eq('user_id', user.id);

    const currentCount = count || 0;
    return { canCreate: currentCount < versionLimit, currentCount, limit: versionLimit };
  };

  const dnaCount = dnaList.length;
  const hasDna = dnaCount > 0;
  const canCreateMore = dnaCount < dnaLimit;

  return {
    hasDna,
    dnaCount,
    dnaList,
    dnaLimit,
    canCreateMore,
    versionLimit,
    isLoading,
    checkVersionLimit,
  };
}
