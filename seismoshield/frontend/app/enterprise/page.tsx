"use client";

import { hasEnterpriseSession } from "@/lib/enterprise-session";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EnterpriseIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(
      hasEnterpriseSession() ? "/enterprise/dashboard" : "/enterprise/login",
    );
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] text-sm text-white/45">
      Redirecting…
    </div>
  );
}
