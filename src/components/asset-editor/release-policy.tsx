"use client";

import { useState } from "react";
import { CircleAlertIcon, TimerIcon } from "lucide-react";

import { EditorCard } from "@/components/asset-editor/editor-card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/lib/limits";
import { cn, formatRelativeWindow } from "@/lib/utils";

const UNITS = [
  { key: "days", name: "auto_approve_days", label: "Days", max: 365, seconds: 86400 },
  { key: "hours", name: "auto_approve_hours", label: "Hours", max: 23, seconds: 3600 },
  { key: "minutes", name: "auto_approve_minutes", label: "Minutes", max: 59, seconds: 60 },
  { key: "seconds", name: "auto_approve_seconds", label: "Seconds", max: 59, seconds: 1 },
] as const;

type UnitKey = (typeof UNITS)[number]["key"];
/** Strings, so a field can be empty mid-edit without snapping back to 0. */
type DelayDraft = Record<UnitKey, string>;

const PRESETS = [
  { label: "1 hour", seconds: 60 * 60 },
  { label: "1 day", seconds: 24 * 60 * 60 },
  { label: "3 days", seconds: 3 * 24 * 60 * 60 },
  { label: "7 days", seconds: 7 * 24 * 60 * 60 },
] as const;

const ERROR_ID = "auto_approve_days-error";
const MAX_WINDOW_LABEL = formatRelativeWindow(LIMITS.maxAutoReleaseSeconds, {
  verbose: true,
});

function splitDelay(totalSeconds: number): DelayDraft {
  return {
    days: String(Math.floor(totalSeconds / 86400)),
    hours: String(Math.floor((totalSeconds % 86400) / 3600)),
    minutes: String(Math.floor((totalSeconds % 3600) / 60)),
    seconds: String(totalSeconds % 60),
  };
}

function toSeconds(draft: DelayDraft) {
  return UNITS.reduce((sum, unit) => {
    const value = Math.floor(Number(draft[unit.key]));
    return sum + (Number.isFinite(value) && value > 0 ? value * unit.seconds : 0);
  }, 0);
}

/**
 * Auto-release switch plus the delay it uses. The four inputs are controlled
 * so presets and the live summary stay in sync, and they are `disabled` while
 * auto-release is off so the form posts exactly what it did before.
 */
export function ReleasePolicy({
  defaultEnabled,
  defaultDelaySeconds,
  defaultNote,
  error,
  onEdit,
}: {
  defaultEnabled: boolean;
  defaultDelaySeconds: number;
  defaultNote: string;
  /** Server message for `autoApproveDays` (the total-window check). */
  error?: string;
  /** Called for edits that don't fire an input event (presets). */
  onEdit?: () => void;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  // Only animate the editor in after a toggle, not on every page load.
  const [toggled, setToggled] = useState(false);
  const [delay, setDelay] = useState(() => splitDelay(defaultDelaySeconds));

  const total = toSeconds(delay);
  const overLimit = total > LIMITS.maxAutoReleaseSeconds;
  const windowLabel = formatRelativeWindow(total, { verbose: true });

  function applyPreset(seconds: number) {
    setDelay(splitDelay(seconds));
    onEdit?.();
  }

  return (
    <EditorCard
      title="Release policy"
      description="What happens if you don’t respond."
    >
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-0.5">
            <Label htmlFor="auto_approve_enabled">Auto-release</Label>
            <p
              id="auto_approve_enabled-hint"
              className="text-[0.8125rem] leading-5 text-pretty text-muted-foreground"
            >
              Release automatically if you don’t respond. Up to 7 days.
            </p>
          </div>
          <Switch
            id="auto_approve_enabled"
            name="auto_approve_enabled"
            defaultChecked={defaultEnabled}
            onChange={(event) => {
              setEnabled(event.target.checked);
              setToggled(true);
            }}
            aria-describedby="auto_approve_enabled-hint"
            className="mt-0.5"
          />
        </div>

        <fieldset
          hidden={!enabled}
          disabled={!enabled}
          className={cn(
            "grid gap-3 rounded-xl bg-canvas p-3",
            toggled && "animate-fade-up",
          )}
        >
          <legend className="sr-only">Release after</legend>

          <div className="@container">
            <div className="grid grid-cols-2 gap-2 @3xs:grid-cols-4">
              {UNITS.map((unit) => {
                const invalid = unit.key === "days" && Boolean(error);

                return (
                  <div key={unit.key} className="grid gap-1">
                    <Input
                      id={unit.name}
                      name={unit.name}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max={unit.max}
                      step="1"
                      value={delay[unit.key]}
                      onChange={(event) =>
                        setDelay((current) => ({
                          ...current,
                          [unit.key]: event.target.value,
                        }))
                      }
                      disabled={!enabled}
                      aria-invalid={invalid || undefined}
                      aria-describedby={invalid ? ERROR_ID : undefined}
                      className="px-1.5 text-center font-medium tabular [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <label
                      htmlFor={unit.name}
                      className="text-center text-xs leading-4 text-muted-foreground"
                    >
                      {unit.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div role="group" aria-label="Presets" className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => {
              const active = total === preset.seconds;

              return (
                <button
                  key={preset.seconds}
                  type="button"
                  aria-pressed={active}
                  onClick={() => applyPreset(preset.seconds)}
                  className={cn(
                    "inline-flex h-8 cursor-pointer items-center rounded-full border px-3 text-xs font-medium outline-none select-none sm:h-7 sm:px-2.5",
                    "transition-[color,background-color,border-color,transform] duration-150 ease-out-soft active:scale-[0.97]",
                    "focus-visible:ring-4 focus-visible:ring-primary/25 disabled:pointer-events-none",
                    active
                      ? "border-primary/30 bg-primary-subtle text-primary-subtle-foreground"
                      : "border-border bg-card text-foreground hover:border-border-strong hover:bg-[#fafafa]",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <p
            aria-live="polite"
            className={cn(
              "flex items-start gap-1.5 text-[0.8125rem] leading-5",
              overLimit ? "text-danger" : "text-muted-foreground",
            )}
          >
            {overLimit ? (
              <CircleAlertIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            ) : (
              <TimerIcon
                className="mt-0.5 size-3.5 shrink-0 text-subtle-foreground"
                aria-hidden
              />
            )}
            <span className="min-w-0 text-pretty">
              {overLimit ? (
                <>
                  {windowLabel} is too long. The maximum is {MAX_WINDOW_LABEL}.
                </>
              ) : total > 0 ? (
                <>
                  Releases after{" "}
                  <span className="font-medium text-foreground">{windowLabel}</span>
                </>
              ) : (
                "Releases as soon as a request comes in"
              )}
            </span>
          </p>
        </fieldset>

        {error ? (
          <p
            id={ERROR_ID}
            className="flex items-start gap-1.5 text-[0.8125rem] leading-5 text-danger"
          >
            <CircleAlertIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
      </div>

      <Field
        id="release_note"
        label="Release note"
        optional
        hint={
          enabled
            ? "Added to every approval and auto-release email."
            : "Only saved while auto-release is on."
        }
      >
        <Textarea
          id="release_note"
          name="release_note"
          defaultValue={defaultNote}
          placeholder="e.g. Thanks for your interest. Reply with any questions."
          rows={3}
          maxLength={LIMITS.note}
          aria-describedby="release_note-hint"
          className="max-h-60 resize-none"
        />
      </Field>
    </EditorCard>
  );
}
