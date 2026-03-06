import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type MetaStatus = 'disconnected' | 'connected' | 'token_expired' | 'permission_revoked' | 'rate_limited' | 'error' | 'loading';

interface MetaIntegrationResult {
  status: MetaStatus;
  isConnected: boolean;
  hasData: boolean;
  isLoading: boolean;
  lastSyncedAt: string | null;
  refetch: () => Promise<void>;
}

export function useMetaIntegration(): MetaIntegrationResult {
  const { user } = useAuth();
  const [status, setStatus] = useState<MetaStatus>('loading');
  const [hasData, setHasData] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const [integrationRes, adsCountRes] = await Promise.all([
      supabase
        .from('user_integrations')
        .select('status, last_synced_at')
        .eq('provider', 'meta')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('ads_data')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    if (integrationRes.data) {
      const s = integrationRes.data.status as MetaStatus;
      setStatus(['connected', 'token_expired', 'permission_revoked', 'rate_limited', 'error'].includes(s) ? s : 'disconnected');
      setLastSyncedAt(integrationRes.data.last_synced_at);
    } else {
      setStatus('disconnected');
    }

    setHasData((adsCountRes.count || 0) > 0);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    status,
    isConnected: status === 'connected',
    hasData,
    isLoading,
    lastSyncedAt,
    refetch: fetch,
  };
}
