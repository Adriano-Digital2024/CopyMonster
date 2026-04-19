import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Handles Supabase auth callbacks that land on any route via URL hash.
 * Supabase appends hash params (#access_token=... or #error=...) when
 * the configured Redirect URL falls back to the Site URL.
 *
 * - On success (access_token present): finalize the session and send
 *   the user to /dashboard.
 * - On error (otp_expired, access_denied, etc.): show a clear message
 *   and route to /auth so the user can request a new link.
 */
export function AuthHashHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const params = new URLSearchParams(hash.substring(1));
    const error = params.get('error');
    const errorCode = params.get('error_code');
    const errorDescription = params.get('error_description');
    const accessToken = params.get('access_token');
    const type = params.get('type');

    // Error case (expired/used link)
    if (error) {
      const isExpired = errorCode === 'otp_expired';
      toast.error(
        isExpired
          ? 'Este link de verificação expirou ou já foi usado. Faça login ou solicite um novo link.'
          : decodeURIComponent(errorDescription || 'Erro de autenticação'),
        { duration: 8000 }
      );
      // Clean hash and route to auth page
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      navigate('/auth', { replace: true });
      return;
    }

    // Success case (verification or magic link)
    if (accessToken) {
      // Supabase JS will pick up the hash automatically and fire
      // onAuthStateChange. We just need to clear the URL and route
      // to the dashboard once the session is established.
      supabase.auth.getSession().then(({ data }) => {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        if (data.session) {
          if (type === 'recovery') {
            navigate('/update-password', { replace: true });
          } else {
            toast.success('Email verificado com sucesso!');
            navigate('/dashboard', { replace: true });
          }
        }
      });
    }
  }, [navigate, location.pathname]);

  return null;
}
