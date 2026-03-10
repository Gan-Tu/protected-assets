import Link from "next/link";
import Image from "next/image";

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex cursor-pointer items-center gap-2.5 rounded-md py-1 text-sm font-bold tracking-tight text-zinc-900"
    >
      <span className="relative block size-8 shrink-0">
        <Image
          src="/logo.png"
          alt="Protected Assets Logo"
          fill
          className="object-contain"
        />
      </span>
      {!compact ? <span className="uppercase tracking-[0.1em]">Protected Assets</span> : null}
    </Link>
  );
}
