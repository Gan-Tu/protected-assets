import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";

import { LogoMark } from "@/components/app/logo-mark";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white px-6 text-center">
      <LogoMark />
      <div className="flex size-12 items-center justify-center rounded-full bg-zinc-50 text-zinc-400">
        <FileQuestionIcon className="size-6" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          Not found
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-600">
          This page does not exist, or the protected asset it pointed to has been
          removed by its owner.
        </p>
      </div>
      <Link
        href="/"
        className="text-sm font-medium text-zinc-900 underline underline-offset-4"
      >
        Go home
      </Link>
    </main>
  );
}
