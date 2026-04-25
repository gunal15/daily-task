"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppUser,
  clearSession,
  getStoredUser,
  register,
  signIn,
} from "@/lib/authService";
import { syncOfflineQueue } from "@/lib/taskService";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signIn: (username: string, pin: string) => Promise<void>;
  register: (username: string, pin: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/signin") router.replace("/signin");
    if (user && pathname === "/signin") router.replace("/today");
  }, [loading, pathname, router, user]);

  useEffect(() => {
    if (!user) return;

    syncOfflineQueue();
    window.addEventListener("online", syncOfflineQueue);
    return () => window.removeEventListener("online", syncOfflineQueue);
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    signIn: async (username, pin) => {
      setUser(await signIn(username, pin));
    },
    register: async (username, pin) => {
      setUser(await register(username, pin));
    },
    signOut: () => {
      clearSession();
      setUser(null);
      router.replace("/signin");
    },
  }), [loading, router, user]);

  const publicPage = pathname === "/signin";
  if (loading) return null;
  if (!user && !publicPage) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
