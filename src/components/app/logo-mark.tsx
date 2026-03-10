import Link from "next/link";

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-white/10 bg-white/70 px-3 py-2 text-sm font-medium tracking-tight text-slate-900 backdrop-blur-sm"
    >
      <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-full bg-slate-950 text-white">
        <svg
          viewBox="0 0 48 48"
          className="absolute inset-0 size-full"
          aria-hidden="true"
        >
          <path
            d="M8 26C8 14.954 16.954 6 28 6h12v12c0 11.046-8.954 20-20 20H8V26Z"
            fill="url(#logo-gradient)"
          />
          <defs>
            <linearGradient id="logo-gradient" x1="8" y1="6" x2="40" y2="38">
              <stop stopColor="#7dd3fc" />
              <stop offset="1" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
        <span className="relative text-xs font-semibold">PA</span>
      </span>
      {!compact ? <span>Protected Assets</span> : null}
    </Link>
  );
}
