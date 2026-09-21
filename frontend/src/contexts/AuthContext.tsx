import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { AppUser } from '../types';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  signUp: (email: string, password: string, name?: string, intent?: string) => Promise<void>;
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
    } else {
      setAppUser(data as AppUser);
    }
    setLoading(false);
  };

  const signUp = async (email: string, password: string, name?: string, intent?: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
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