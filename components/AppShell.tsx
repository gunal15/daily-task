"use client";

import { usePathname } from "next/navigation";
import AuthProvider from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import PwaRegister from "@/components/PwaRegister";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = pathname !== "/signin";

  return (
    <AuthProvider>
      <PwaRegister />
      {children}
      {showNav && <BottomNav />}
    </AuthProvider>
  );
}
