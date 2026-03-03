import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DnaVersion {
  id: string;
  mapping_id: string;
  version_label: string;
  version_type: string;
  source: string;
  blocks: Record<string, string | null>;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface UseDnaVersionsResult {
  versions: DnaVersion[];
  activeVersion: DnaVersion | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useDnaVersions(mappingId: string | null): UseDnaVersionsResult {
  const { user } = useAuth();
  const [versions, setVersions] = useState<DnaVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVersions = async () => {
    if (!user || !mappingId) {
      setVersions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dna_versions')
        .select('*')
        .eq('mapping_id', mappingId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setVersions(data as unknown as DnaVersion[]);
      }
    } catch (err) {
      console.error('Error fetching DNA versions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [user, mappingId]);

  const activeVersion = versions.find(v => v.is_active) || null;

  return {
    versions,
    activeVersion,
    isLoading,
    refetch: fetchVersions,
  };
}
