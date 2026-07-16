import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://copymonster.me';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 1. AUTHENTICATE USER
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      console.error('[admin-users] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // 2. VERIFY ADMIN ROLE
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: authUser.id, _role: 'admin' });

    if (roleError || !isAdmin) {
      console.error('[admin-users] Access denied - not admin:', authUser.id);
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin role required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log(`[admin-users] Admin authenticated: ${authUser.email}`);

    // 3. PARSE REQUEST
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const body = req.method !== 'GET' ? await req.json() : {};

    // 4. HANDLE ACTIONS
    switch (action) {
      case 'create': {
        const { email, password, firstName } = body;
        
        if (!email || !password || !firstName) {
          return new Response(
            JSON.stringify({ error: 'Email, password and firstName are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Validate password length
        if (password.length < 8) {
          return new Response(
            JSON.stringify({ error: 'Password must be at least 8 characters' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Create user via Admin API (requires service role key)
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          user_metadata: { first_name: firstName },
          email_confirm: true
        });

        if (createError) {
          console.error('[admin-users] Create user error:', createError);
          return new Response(
            JSON.stringify({ error: createError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log(`[admin-users] User created: ${email} by admin ${authUser.email}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: { 
              id: newUser.user.id, 
              email: newUser.user.email 
            } 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
        );
      }

      case 'delete': {
        const { userId } = body;
        
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'userId is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Prevent self-deletion
        if (userId === authUser.id) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete your own account' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Delete user via Admin API
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

        if (deleteError) {
          console.error('[admin-users] Delete user error:', deleteError);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log(`[admin-users] User deleted: ${userId} by admin ${authUser.email}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 'update-plan': {
        const { userId, plan, credits } = body;
        
        if (!userId || !plan) {
          return new Response(
            JSON.stringify({ error: 'userId and plan are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const validPlans = ['free', 'starter', 'pro', 'legend'];
        if (!validPlans.includes(plan)) {
          return new Response(
            JSON.stringify({ error: 'Invalid plan' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const updateData: Record<string, any> = {
          subscription_status: plan,
          updated_at: new Date().toISOString()
        };

        if (typeof credits === 'number' && credits >= 0) {
          updateData.credits = credits;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        if (updateError) {
          console.error('[admin-users] Update plan error:', updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log(`[admin-users] Plan updated for ${userId}: ${plan} by admin ${authUser.email}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: create, delete, or update-plan' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

  } catch (error) {
    console.error('[admin-users] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
