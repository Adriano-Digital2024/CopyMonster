import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  phone: string | null;
  credits: number;
  subscription_status: 'free' | 'starter' | 'pro' | 'legend';
  xp: number;
  level: number;
  trial_expires_at: string | null;
}

interface User extends UserProfile {
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isTrialExpired: boolean;
  canUseAgents: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

interface SignupData {
  firstName: string;
  email: string;
  password: string;
  phone: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Computed properties for trial status
  const isTrialExpired = React.useMemo(() => {
    if (!user) return false;
    if (user.subscription_status !== 'free') return false;
    if (!user.trial_expires_at) return false;
    return new Date(user.trial_expires_at) < new Date();
  }, [user]);

  const canUseAgents = React.useMemo(() => {
    if (!user) return false;
    
    // ADMINS HAVE UNLIMITED ACCESS - bypass all checks
    if (user.isAdmin) return true;
    
    // Paid users can always use if they have credits
    if (user.subscription_status !== 'free') {
      return user.credits > 0;
    }
    
    // Free users: check trial and credits
    const hasCredits = user.credits > 0;
    const trialValid = !user.trial_expires_at || new Date(user.trial_expires_at) > new Date();
    
    return hasCredits && trialValid;
  }, [user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Update session state synchronously
        setSession(session);
        
        if (session?.user) {
          // Defer Supabase queries to avoid deadlock
          setTimeout(async () => {
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileError) throw profileError;

              const { data: roles, error: rolesError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .eq('role', 'admin');

              if (rolesError) throw rolesError;

              setUser({
                id: profile.id,
                email: profile.email,
                first_name: profile.first_name,
                phone: profile.phone,
                credits: profile.credits,
                subscription_status: profile.subscription_status as 'free' | 'starter' | 'pro' | 'legend',
                xp: profile.xp,
                level: profile.level,
                trial_expires_at: profile.trial_expires_at,
                isAdmin: roles && roles.length > 0,
              });
              
              setIsLoading(false);
            } catch (error) {
              console.error('Error loading user profile:', error);
              toast.error("Houve um problema ao carregar seu perfil. Por favor, faça login novamente.");
              await supabase.auth.signOut();
              setUser(null);
              setIsLoading(false);
            }
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (data: SignupData) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { first_name: data.firstName, phone: data.phone },
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    isTrialExpired,
    canUseAgents,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
