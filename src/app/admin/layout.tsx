import type { ReactNode } from "react";
import AdminLayoutShell from "@/components/layout/AdminLayout";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
