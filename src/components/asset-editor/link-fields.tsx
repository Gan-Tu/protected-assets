"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlertIcon, LinkIcon, PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LIMITS } from "@/lib/limits";
import { cn } from "@/lib/utils";

type LinkRow = { id: number; value: string };

const ERROR_ID = "links-error";

/**
 * Repeating `link_url` inputs. Rows carry stable ids so removing one from the
 * middle never shifts focus or values into its neighbour, and focus follows
 * the action (new row on add, neighbour on remove) for keyboard users.
 */
export function LinkFields({
  initialLinks,
  error,
  invalidEntry,
  onEdit,
}: {
  initialLinks: string[];
  /** Server message for `links` or `links.N`. */
  error?: string;
  /**
   * The server validates only non-empty links, so `links.N` is the Nth
   * non-empty row, not the Nth input.
   */
  invalidEntry?: number;
  onEdit?: () => void;
}) {
  const [rows, setRows] = useState<LinkRow[]>(() =>
    (initialLinks.length ? initialLinks : [""]).map((value, index) => ({
      id: index,
      value,
    })),
  );
  const nextId = useRef(initialLinks.length + 1);
  const inputs = useRef(new Map<number, HTMLInputElement>());
  const focusRequest = useRef<number | null>(null);

  useEffect(() => {
    const target = focusRequest.current;
    if (target === null) return;
    focusRequest.current = null;
    inputs.current.get(target)?.focus();
  }, [rows]);

  let invalidRowId: number | null = null;
  if (invalidEntry !== undefined) {
    let seen = -1;
    for (const row of rows) {
      if (!row.value.trim()) continue;
      seen += 1;
      if (seen === invalidEntry) {
        invalidRowId = row.id;
        break;
      }
    }
  }
  const invalidRowIndex = rows.findIndex((row) => row.id === invalidRowId);
  const atLimit = rows.length >= LIMITS.linksPerAsset;

  function update(id: number, value: string) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, value } : row)),
    );
  }

  function add() {
    const id = nextId.current;
    nextId.current += 1;
    focusRequest.current = id;
    setRows((current) => [...current, { id, value: "" }]);
    onEdit?.();
  }

  function remove(id: number) {
    if (rows.length === 1) {
      focusRequest.current = id;
      setRows([{ id, value: "" }]);
    } else {
      const index = rows.findIndex((row) => row.id === id);
      const neighbour = rows[index - 1] ?? rows[index + 1];
      focusRequest.current = neighbour?.id ?? null;
      setRows(rows.filter((row) => row.id !== id));
    }
    onEdit?.();
  }

  return (
    <section aria-labelledby="links-heading" className="grid gap-3">
      <div className="grid gap-0.5">
        <h3
          id="links-heading"
          className="text-sm leading-5 font-medium text-foreground"
        >
          Links
        </h3>
        <p className="text-[0.8125rem] leading-5 text-pretty text-muted-foreground">
          Sent in the release email, alongside any files.
        </p>
      </div>

      <ul className="grid gap-2">
        {rows.map((row, index) => {
          const invalid = row.id === invalidRowId;
          const isOnlyEmptyRow = rows.length === 1 && !row.value;

          return (
            <li key={row.id} className="flex items-center gap-1.5">
              <div className="relative min-w-0 flex-1">
                <LinkIcon
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2",
                    invalid ? "text-danger" : "text-subtle-foreground",
                  )}
                />
                <Input
                  ref={(node) => {
                    if (node) inputs.current.set(row.id, node);
                    else inputs.current.delete(row.id);
                  }}
                  name="link_url"
                  type="url"
                  inputMode="url"
                  value={row.value}
                  onChange={(event) => update(row.id, event.target.value)}
                  placeholder="https://…"
                  maxLength={LIMITS.url}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-label={`Link ${index + 1}`}
                  aria-invalid={invalid || undefined}
                  aria-describedby={error ? ERROR_ID : undefined}
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(row.id)}
                aria-label={`Remove link ${index + 1}`}
                title="Remove link"
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  // Nothing to remove yet; keep the slot so the row doesn't reflow.
                  isOnlyEmptyRow && "invisible",
                )}
              >
                <XIcon aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>

      {error ? (
        <p
          id={ERROR_ID}
          className="flex items-start gap-1.5 text-[0.8125rem] leading-5 text-danger"
        >
          <CircleAlertIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {invalidRowIndex >= 0 ? `Link ${invalidRowIndex + 1}: ` : null}
            {error}
          </span>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={add}
          disabled={atLimit}
          className="-ml-2 text-primary hover:bg-primary-subtle hover:text-primary-subtle-foreground"
        >
          <PlusIcon aria-hidden />
          Add link
        </Button>
        {atLimit ? (
          <span className="text-[0.8125rem] text-muted-foreground">
            Up to {LIMITS.linksPerAsset} links per asset.
          </span>
        ) : null}
      </div>
    </section>
  );
}
