import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@/types/models";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveUser = useCallback(async (userData: User | null) => {
    try {
      if (userData) {
        await AsyncStorage.setItem("user", JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem("user");
      }
      setUser(userData);
    } catch (error) {
      console.error("Failed to save user:", error);
    }
  }, []);

  const loadUserFromSession = useCallback(async (authUser: any) => {
    try {
      const role = authUser.user_metadata?.role || 'client';
      
      if (role === 'barber') {
        const { data: barberData, error: barberError } = await supabase
          .from('barbers')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (barberError) {
          console.error('Error fetching barber record in AuthProvider:', {
            message: barberError.message,
            code: barberError.code,
            details: barberError.details,
            hint: barberError.hint,
            userId: authUser.id
          });
          return;
        }

        if (barberData) {
          const user: User = {
            id: authUser.id,
            role: 'barber',
            name: barberData.name,
            phone: barberData.phone,
            email: authUser.email || '',
          };
          await saveUser(user);
        }
      } else {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (clientError) {
          console.error('Error fetching client record in AuthProvider:', {
            message: clientError.message,
            code: clientError.code,
            details: clientError.details,
            hint: clientError.hint,
            userId: authUser.id
          });
          return;
        }

        if (clientData) {
          const user: User = {
            id: authUser.id,
            role: 'client',
            name: clientData.name,
            phone: clientData.phone,
            email: authUser.email || '',
          };
          await saveUser(user);
        }
      }
    } catch (error) {
      console.error('Failed to load user from session:', error);
    }
  }, [saveUser]);

  const loadStoredUser = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load stored user:", error);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      await saveUser(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
      // Still clear local state even if Supabase signout fails
      await saveUser(null);
    }
  }, [saveUser]);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          await loadUserFromSession(session.user);
        } else if (mounted) {
          // Fallback to stored user for offline support
          await loadStoredUser();
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id);
          
          if (mounted) {
            if (session?.user) {
              await loadUserFromSession(session.user);
            } else {
              await saveUser(null);
            }
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [loadUserFromSession, loadStoredUser, saveUser]);

  const contextValue = useMemo(() => ({
    user,
    setUser: saveUser,
    signOut,
    isLoading,
  }), [user, saveUser, signOut, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}