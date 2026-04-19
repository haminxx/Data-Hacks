"use client";

import { hasEnterpriseSession } from "@/lib/enterprise-session";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EnterpriseIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // New flow (per product direction): the header Enterprise CTA
    // always lands on the login page. Authed sessions skip straight
    // to the risk-assessment console; unauthed visitors see the
    // (pre-filled) login form.
    router.replace(
      hasEnterpriseSession()
        ? "/enterprise/risk-assessment"
        : "/enterprise/login",
    );
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] text-sm text-white/45">
      Redirecting…
    </div>
  );
}
