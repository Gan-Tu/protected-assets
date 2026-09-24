"use client";

/**
 * One interval for every live timestamp on the page, however many rows
 * subscribe. It starts with the first subscriber and stops with the last.
 *
 * Consumers pass `useSyncExternalStore` a snapshot that returns the *formatted
 * string*, so React only re-renders a row when its visible text changes (a
 * "3h ago" label re-renders about once an hour, not every second).
 */
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

export function subscribeToClock(listener: () => void) {
  listeners.add(listener);

  if (!timer) {
    timer = setInterval(() => {
      listeners.forEach((notify) => notify());
    }, 1000);
  }

  return () => {
    listeners.delete(listener);

    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** For values that never change after hydration. */
export const subscribeNever = () => () => {};
