import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 pb-24 pt-28 text-center text-white">
      <p className="text-sm font-medium text-white/50">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        This page could not be found.
      </h1>
      <p className="mt-3 max-w-md text-sm text-white/60">
        If you opened{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-[13px]">
          localhost:8000
        </code>
        , that is the API. Use the Next.js URL from{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-[13px]">
          npm run dev
        </code>{" "}
        (often port 3000).
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-[#1A56DB] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1647b3]"
        >
          Home
        </Link>
        <Link
          href="/risk"
          className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-white/90 hover:bg-white/5"
        >
          Risk Assessment
        </Link>
      </div>
    </div>
  );
}
