"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { hasEnterpriseSession } from "@/lib/enterprise-session";

export function EnterpriseAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasEnterpriseSession()) {
      router.replace("/enterprise/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A] text-sm text-white/55">
        Loading enterprise console…
      </div>
    );
  }

  return <>{children}</>;
}
