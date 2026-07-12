import type { ReactNode } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import DashboardLayoutShell from "@/components/layout/DashboardLayout";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    },
  );
  const { data: { session } } = await supabase.auth.getSession();
  const sessionJson = JSON.stringify(session);

  return (
    <>
      <script id="witaline-session-data" type="application/json" dangerouslySetInnerHTML={{ __html: sessionJson }} />
      <DashboardLayoutShell sessionJson={sessionJson}>{children}</DashboardLayoutShell>
    </>
  );
}
