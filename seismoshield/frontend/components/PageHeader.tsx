import Link from "next/link";

type Crumb = { href: string; label: string };

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumbs?: Crumb[];
};

export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className="mb-8 space-y-3">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="text-xs text-white/45" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            {breadcrumbs.map((c, i) => (
              <li key={c.href} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="text-white/25" aria-hidden>
                    /
                  </span>
                )}
                {i < breadcrumbs.length - 1 ? (
                  <Link
                    href={c.href}
                    className="transition hover:text-[#93c5fd]"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-white/55">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1A56DB]">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
