import { cn, getInitials, hashToIndex } from "@/lib/utils";

/** Soft tint + deep ink per tone; every pair clears 5.9:1. */
const tones = [
  "bg-[#e9e7fd] text-[#4336c9]",
  "bg-[#e0f0fb] text-[#0b5a8a]",
  "bg-[#dcf3ee] text-[#0e6655]",
  "bg-[#fbefd9] text-[#83460a]",
  "bg-[#fbe4e9] text-[#a3223f]",
  "bg-[#e8e9ee] text-[#3d4150]",
  "bg-[#f1e8fc] text-[#6b2fb3]",
];

/** Initials avatar with a tone that is stable per email address. */
export function InitialsAvatar({
  name,
  email,
  size = "default",
  className,
}: {
  name?: string | null;
  email: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-normal select-none",
        size === "sm" && "size-7 text-[0.6875rem]",
        size === "default" && "size-9 text-xs",
        size === "lg" && "size-11 text-sm",
        tones[hashToIndex(email.toLowerCase(), tones.length)],
        className,
      )}
    >
      {getInitials(name, email)}
    </span>
  );
}
