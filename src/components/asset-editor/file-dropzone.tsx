"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
} from "react";
import { UploadCloudIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function carriesFiles(dataTransfer: DataTransfer | null) {
  return Boolean(dataTransfer && Array.from(dataTransfer.types).includes("Files"));
}

/**
 * Files from a drop, minus folders: browsers hand folders over as empty File
 * objects that would only fail to upload. Must run synchronously in the event.
 */
function readDroppedFiles(dataTransfer: DataTransfer) {
  const items = Array.from(dataTransfer.items ?? []);
  if (!items.length) {
    return { files: Array.from(dataTransfer.files), folders: 0 };
  }

  const files: File[] = [];
  let folders = 0;

  for (const item of items) {
    if (item.kind !== "file") continue;
    if (item.webkitGetAsEntry?.()?.isDirectory) {
      folders += 1;
      continue;
    }
    const file = item.getAsFile();
    if (file) files.push(file);
  }

  return { files, folders };
}

/**
 * Drag-and-drop target wrapped around a visually hidden `<input type="file">`.
 * The input keeps keyboard and screen-reader access (Tab, then Space); the
 * zone draws its focus ring. "browse" is the input's label, stretched over the
 * whole zone so a click anywhere opens the picker.
 */
export function FileDropzone({
  id = "files",
  onFiles,
  onReject,
  hint,
  disabled = false,
  disabledMessage = "File limit reached",
  forceDragOver = false,
  className,
}: {
  id?: string;
  onFiles: (files: File[]) => void;
  onReject?: (message: string) => void;
  hint?: React.ReactNode;
  disabled?: boolean;
  disabledMessage?: React.ReactNode;
  /** Renders the drag-over state without a real drag (fixtures). */
  forceDragOver?: boolean;
  className?: string;
}) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const dragDepth = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const hintId = `${id}-hint`;
  const active = !disabled && (forceDragOver || isDragOver);

  // A file dropped beside the zone would make the browser open it, navigating
  // away from the form and abandoning every upload in progress.
  useEffect(() => {
    function guard(event: DragEvent) {
      if (!carriesFiles(event.dataTransfer)) return;
      if (zoneRef.current?.contains(event.target as Node)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
    }

    window.addEventListener("dragover", guard);
    window.addEventListener("drop", guard);
    return () => {
      window.removeEventListener("dragover", guard);
      window.removeEventListener("drop", guard);
    };
  }, []);

  // enter/leave also fire for every child, so count depth instead of toggling.
  function handleDragEnter(event: ReactDragEvent<HTMLDivElement>) {
    if (!carriesFiles(event.dataTransfer)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setIsDragOver(true);
  }

  function handleDragOver(event: ReactDragEvent<HTMLDivElement>) {
    if (!carriesFiles(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = disabled ? "none" : "copy";
  }

  function handleDragLeave(event: ReactDragEvent<HTMLDivElement>) {
    if (!carriesFiles(event.dataTransfer)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragOver(false);
  }

  function handleDrop(event: ReactDragEvent<HTMLDivElement>) {
    if (!carriesFiles(event.dataTransfer)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragOver(false);
    if (disabled) return;

    const { files, folders } = readDroppedFiles(event.dataTransfer);
    if (!files.length && folders) {
      onReject?.("Folders can’t be uploaded. Drop the files inside them instead.");
      return;
    }

    onFiles(files);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Reset so choosing the same file again still fires `change`.
    event.target.value = "";
    onFiles(files);
  }

  return (
    <div
      ref={zoneRef}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-drag-over={active || undefined}
      className={cn(
        "group/dropzone relative flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface-subtle px-6 py-7 text-center",
        "transition-[border-color,background-color,box-shadow] duration-150 ease-out-soft",
        "has-[input:focus-visible]:border-primary has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-primary/15",
        disabled
          ? "cursor-not-allowed"
          : "hover:border-input-hover hover:bg-canvas",
        active &&
          "border-primary bg-primary-subtle/40 hover:border-primary hover:bg-primary-subtle/40",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-11 items-center justify-center rounded-xl border border-border bg-card shadow-xs transition-transform duration-200 ease-out-soft",
          active && "-translate-y-0.5",
        )}
      >
        <UploadCloudIcon
          className={cn(
            "size-5 transition-colors duration-150 ease-out-soft",
            active ? "text-primary" : "text-subtle-foreground",
          )}
        />
      </span>

      <div className="grid gap-1">
        <p className="text-sm font-medium text-foreground">
          {disabled ? (
            disabledMessage
          ) : active ? (
            "Drop to upload"
          ) : (
            <>
              Drop files here or{" "}
              <label
                htmlFor={id}
                className="cursor-pointer text-primary underline-offset-4 group-hover/dropzone:underline after:absolute after:inset-0 after:rounded-xl after:content-['']"
              >
                browse
              </label>
            </>
          )}
        </p>
        {hint ? (
          <p id={hintId} className="text-[0.8125rem] leading-5 text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>

      <input
        id={id}
        type="file"
        multiple
        disabled={disabled}
        onChange={handleChange}
        aria-label="Browse files to upload"
        aria-describedby={hint ? hintId : undefined}
        className="sr-only"
      />
    </div>
  );
}
