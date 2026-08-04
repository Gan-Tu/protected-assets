/**
 * Decorative background for the auth pages.
 *
 * Previously this pulled in framer-motion (~50 KB) to rotate an SVG and pulse
 * three dots. CSS keyframes do the same thing with no JavaScript at all, so
 * this is now a server component. Both animations respect prefers-reduced-motion.
 */
export function AmbientOrbits() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 600 600"
        className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 opacity-80 motion-safe:animate-[orbit-spin_30s_linear_infinite]"
        style={{ transformOrigin: "center" }}
      >
        <circle
          cx="300"
          cy="300"
          r="180"
          fill="none"
          stroke="rgba(148,163,184,0.18)"
        />
        <circle
          cx="300"
          cy="300"
          r="230"
          fill="none"
          stroke="rgba(125,211,252,0.16)"
        />
        <circle
          cx="300"
          cy="300"
          r="110"
          fill="none"
          stroke="rgba(249,115,22,0.18)"
        />
        <circle
          cx="300"
          cy="120"
          r="12"
          fill="#0f172a"
          className="motion-safe:animate-[orbit-pulse_2.4s_ease-in-out_infinite]"
          style={{ transformOrigin: "300px 120px" }}
        />
        <circle
          cx="124"
          cy="300"
          r="8"
          fill="#7dd3fc"
          className="motion-safe:animate-[orbit-pulse_2.8s_ease-in-out_infinite]"
          style={{ transformOrigin: "124px 300px", animationDelay: "0.4s" }}
        />
        <circle
          cx="460"
          cy="300"
          r="9"
          fill="#f97316"
          className="motion-safe:animate-[orbit-pulse_3.1s_ease-in-out_infinite]"
          style={{ transformOrigin: "460px 300px", animationDelay: "0.8s" }}
        />
      </svg>
    </div>
  );
}
