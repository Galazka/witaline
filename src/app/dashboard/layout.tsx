import type { ReactNode } from "react";
import DashboardLayoutShell from "@/components/layout/DashboardLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <DashboardLayoutShell>{children}</DashboardLayoutShell>;
}
