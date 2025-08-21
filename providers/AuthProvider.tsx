import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { ensureProfiles } from "@/lib/profileBootstrap";

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
      // Check if Supabase is properly configured
      if (!isSupabaseConfigured()) {
        console.log('Supabase not configured, creating fallback user profile');
        const fallbackUser: User = {
          id: authUser.id,
          role: authUser.user_metadata?.role || 'client',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          phone: authUser.user_metadata?.phone || '',
          email: authUser.email || '',
        };
        await saveUser(fallbackUser);
        return;
      }
      
      // Ensure profiles exist in database
      await ensureProfiles();
      
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
            userId: authUser.id,
            fullError: barberError
          });
          
          // Handle missing table error (42P01)
          if (barberError.code === '42P01') {
            console.log('Barbers table does not exist yet, creating fallback profile for user:', authUser.id);
            const user: User = {
              id: authUser.id,
              role: 'barber',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Barber',
              phone: authUser.user_metadata?.phone || '',
              email: authUser.email || '',
            };
            await saveUser(user);
            return;
          }
          
          // If barber record doesn't exist (PGRST116 = no rows returned)
          if (barberError.code === 'PGRST116') {
            console.log('Barber record not found, creating basic profile for user:', authUser.id);
            const user: User = {
              id: authUser.id,
              role: 'barber',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Barber',
              phone: authUser.user_metadata?.phone || '',
              email: authUser.email || '',
            };
            await saveUser(user);
            return;
          }
          
          // For other database errors, create fallback profile
          console.log('Database error, creating fallback profile for barber:', authUser.id);
          const user: User = {
            id: authUser.id,
            role: 'barber',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Barber',
            phone: authUser.user_metadata?.phone || '',
            email: authUser.email || '',
          };
          await saveUser(user);
          return;
        }

        if (barberData) {
          const user: User = {
            id: authUser.id,
            role: 'barber',
            name: barberData.name,
            phone: barberData.phone_e164 || barberData.phone || '',
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
            userId: authUser.id,
            fullError: clientError
          });
          
          // Handle missing table error (42P01)
          if (clientError.code === '42P01') {
            console.log('Clients table does not exist yet, creating fallback profile for user:', authUser.id);
            const user: User = {
              id: authUser.id,
              role: 'client',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Client',
              phone: authUser.user_metadata?.phone || '',
              email: authUser.email || '',
            };
            await saveUser(user);
            return;
          }
          
          // If client record doesn't exist (PGRST116 = no rows returned)
          if (clientError.code === 'PGRST116') {
            console.log('Client record not found, creating basic profile for user:', authUser.id);
            const user: User = {
              id: authUser.id,
              role: 'client',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Client',
              phone: authUser.user_metadata?.phone || '',
              email: authUser.email || '',
            };
            await saveUser(user);
            return;
          }
          
          // For other database errors, create fallback profile
          console.log('Database error, creating fallback profile for client:', authUser.id);
          const user: User = {
            id: authUser.id,
            role: 'client',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Client',
            phone: authUser.user_metadata?.phone || '',
            email: authUser.email || '',
          };
          await saveUser(user);
          return;
        }

        if (clientData) {
          const user: User = {
            id: authUser.id,
            role: 'client',
            name: clientData.name,
            phone: clientData.phone_e164 || clientData.phone || '',
            email: authUser.email || '',
          };
          await saveUser(user);
        }
      }
    } catch (error) {
      console.error('Failed to load user from session:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        userId: authUser.id,
        userRole: authUser.user_metadata?.role
      });
      // Create a fallback user profile to prevent app crashes
      const fallbackUser: User = {
        id: authUser.id,
        role: authUser.user_metadata?.role || 'client',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        phone: authUser.user_metadata?.phone || '',
        email: authUser.email || '',
      };
      await saveUser(fallbackUser);
    }
  }, [saveUser]);

  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const loadStoredUser = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        // Validate that the user ID is a proper UUID
        if (userData.id && !isValidUUID(userData.id)) {
          console.log('Invalid user ID format detected, clearing stored user:', userData.id);
          await AsyncStorage.removeItem("user");
          return;
        }
        setUser(userData);
      }
    } catch (error) {
      console.error("Failed to load stored user:", error);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Only attempt Supabase signout if properly configured
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
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
        // Check if Supabase is properly configured
        if (!isSupabaseConfigured()) {
          console.log('Supabase not configured, using offline mode');
          // Just load stored user and skip Supabase operations
          if (mounted) {
            await loadStoredUser();
          }
          return;
        }
        
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
              // Ensure profiles exist after sign-in/sign-up
              if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await ensureProfiles();
              }
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
        console.error('Failed to initialize auth:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        // Fallback to stored user on any error
        if (mounted) {
          await loadStoredUser();
        }
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