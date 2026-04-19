"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EnterpriseIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // The Enterprise CTA ALWAYS lands on the login form — even for
    // authed sessions — because the product narrative requires the
    // viewer to explicitly click "Sign in" before entering the
    // console. The form just auto-fills credentials so the click is
    // a single gesture.
    router.replace("/enterprise/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] text-sm text-white/45">
      Redirecting…
    </div>
  );
}
