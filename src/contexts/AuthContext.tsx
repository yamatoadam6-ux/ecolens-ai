import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  profile: any | null;
  authError: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any; message?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: any; message?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const formatAuthError = (error: any) => {
    const message = error?.message || "Authentication failed.";
    if (message.toLowerCase().includes("failed to fetch")) {
      return "Cannot reach the authentication server. Lovable Cloud is paused or temporarily unavailable.";
    }
    return message;
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) console.error("Profile fetch failed:", error.message);
    setProfile(data ?? null);
  };

  const checkAdmin = async (userId: string) => {
    const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (error) console.error("Admin role check failed:", error.message);
    setIsAdmin(!!data);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await checkAdmin(user.id);
    }
  };

  useEffect(() => {
    const loadUserData = async (currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser) {
        setAuthError(null);
        await Promise.all([fetchProfile(currentUser.id), checkAdmin(currentUser.id)]);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      window.setTimeout(() => void loadUserData(currentUser), 0);
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) setAuthError(formatAuthError(error));
      const currentUser = session?.user ?? null;
      void loadUserData(currentUser);
    }).catch((error) => {
      setAuthError(formatAuthError(error));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setAuthError(null);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin },
      });
      if (error) setAuthError(formatAuthError(error));
      return { error, message: error ? formatAuthError(error) : undefined };
    } catch (error) {
      const message = formatAuthError(error);
      setAuthError(message);
      return { error, message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(formatAuthError(error));
      return { error, message: error ? formatAuthError(error) : undefined };
    } catch (error) {
      const message = formatAuthError(error);
      setAuthError(message);
      return { error, message };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, profile, authError, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
