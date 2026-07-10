import type { ReactNode } from "react";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default function LoginLayout({ children }: { children: ReactNode }) {
  cookies();
  return <>{children}</>;
}
