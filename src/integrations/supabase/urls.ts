// Centralized Edge Function URL builder.
// Avoids hardcoding the Supabase project URL across the frontend
// (which broke chat silently on any project migration in the past).

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;

if (!SUPABASE_URL) {
  throw new Error(
    'Missing VITE_SUPABASE_URL. Set it in your .env file.'
  );
}

/** Returns the full URL for a Supabase Edge Function by name. */
export const edgeFunctionUrl = (name: string): string =>
  `${SUPABASE_URL}/functions/v1/${name}`;

/** Returns the Supabase dashboard URL for the configured project. */
export const supabaseDashboardUrl = (path: string): string =>
  `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/${path}`;