import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "owner" | "scaffolder" | "engineer";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string;
  business_address: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role?: string, businessAddress?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signingOut: boolean;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const fetchProfileAndRole = async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    ]);
    if (profileRes.error) console.error("[Auth] Profile fetch failed:", profileRes.error.message);
    if (roleRes.error) console.error("[Auth] Role fetch failed:", roleRes.error.message);
    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (roleRes.data) setRole(roleRes.data.role as AppRole);
  };

  const refreshRole = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (data) setRole(data.role as AppRole);
  };

  useEffect(() => {
    let cancelled = false;
    const forceDone = setTimeout(() => { if (!cancelled) setLoading(false); }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          try { await fetchProfileAndRole(session.user.id); } catch (err) {
            console.error("[Auth] Profile/role load failed on auth change:", err);
          }
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        try { await fetchProfileAndRole(session.user.id); } catch (err) {
          console.error("[Auth] Profile/role load failed on init:", err);
        }
      }
      setLoading(false);
    }).catch((err) => {
      console.error("[Auth] getSession failed:", err);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      clearTimeout(forceDone);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, role?: string, businessAddress?: string) => {
    const selectedRole = (role || "owner") as AppRole;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName, signup_role: selectedRole } },
    });
    if (!error && data.user) {
      // DB trigger handle_new_user reads signup_role from metadata — role is already correct
      setRole(selectedRole);
      // Update business address via edge function if provided (best-effort)
      if (businessAddress && data.session) {
        supabase.functions.invoke("update-signup-role", {
          body: { user_id: data.user.id, role: selectedRole, business_address: businessAddress },
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        }).catch(() => {});
      }
    }
    return { error: error as Error | null };
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
      ]);
    } catch (e) {
      console.warn("[Auth] signOut call did not complete normally, forcing cleanup:", e);
    }
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setSigningOut(false);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signingOut, signIn, signUp, signOut, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
