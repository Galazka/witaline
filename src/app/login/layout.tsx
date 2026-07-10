import type { ReactNode } from "react";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function LoginLayout({ children }: { children: ReactNode }) {
  await cookies();
  return <>{children}</>;
}
