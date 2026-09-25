import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { AppUser } from '../types';
import { submitContributorApplication } from '../lib/api/contributorApplications';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  signUp: (
    email: string,
    password: string,
    name?: string,
    intent?: string,
    desiredRole?: 'viewer' | 'contributor',
    contributionDetails?: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAppUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchAppUser(currentUser.id);
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchAppUser = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      setAppUser(null);
      setLoading(false);
      return;
    }

    setAppUser(data as AppUser);

    // Someone who signed up asking to be a contributor may not have had an
    // active session yet at signUp time (email confirmation pending), so
    // the contributor application couldn't be submitted then. Their intent
    // survives in auth metadata regardless of confirmation status, so once
    // they do have a session (this runs on every successful login), submit
    // it now if it hasn't already gone in.
    const authUser = (await supabase.auth.getUser()).data.user;
    const desiredRole = authUser?.user_metadata?.desired_role;
    const contributionDetails = authUser?.user_metadata?.contribution_details;
    const alreadyApplied = (data as AppUser)?.metadata?.contributor_application;
    if (desiredRole === 'contributor' && contributionDetails && !alreadyApplied) {
      submitContributorApplication(contributionDetails)
        .then(() => fetchAppUser(userId))
        .catch(() => {
          // Non-fatal: they can still apply manually from Settings.
        });
    }

    setLoading(false);
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string,
    intent?: string,
    desiredRole?: 'viewer' | 'contributor',
    contributionDetails?: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          desired_role: desiredRole || 'viewer',
          contribution_details: contributionDetails || null,
        },
      },
    });
    if (error) throw error;

    // After signup, the trigger creates public.users row. We can update extra fields.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const updates: any = {};
      if (name) updates.display_name = name;
      if (intent) updates.metadata = { intent };
      if (Object.keys(updates).length > 0) {
        await supabase.from('users').update(updates).eq('id', user.id);
      }
      // If there's already an active session (no email confirmation
      // required on this project), submit the contributor application
      // immediately rather than waiting for the next login.
      if (desiredRole === 'contributor' && contributionDetails) {
        await submitContributorApplication(contributionDetails).catch(() => {});
      }
      await fetchAppUser(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAppUser(null);
  };

  const refreshAppUser = async () => {
    if (user) await fetchAppUser(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, signUp, signIn, signOut, refreshAppUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};