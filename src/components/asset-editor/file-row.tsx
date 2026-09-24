import {
  CheckIcon,
  CircleAlertIcon,
  FileArchiveIcon,
  FileAudioIcon,
  FileCodeIcon,
  FileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileVideoIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn, compactFileSize } from "@/lib/utils";

type FileKind =
  | "document"
  | "spreadsheet"
  | "archive"
  | "code"
  | "image"
  | "video"
  | "audio"
  | "other";

const KIND_BY_EXTENSION: Record<string, FileKind> = {
  pdf: "document",
  doc: "document",
  docx: "document",
  txt: "document",
  md: "document",
  rtf: "document",
  pages: "document",
  ppt: "document",
  pptx: "document",
  key: "document",
  csv: "spreadsheet",
  xls: "spreadsheet",
  xlsx: "spreadsheet",
  numbers: "spreadsheet",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  json: "code",
  html: "code",
  js: "code",
  ts: "code",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  mov: "video",
  mp4: "video",
  webm: "video",
  mp3: "audio",
  wav: "audio",
  m4a: "audio",
};

function fileKindFor(
  fileName: string,
  contentType?: string | null,
): FileKind {
  const type = contentType ?? "";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";

  const extension = fileName.includes(".")
    ? (fileName.split(".").pop() ?? "").toLowerCase()
    : "";

  return KIND_BY_EXTENSION[extension] ?? "other";
}

function FileKindIcon({ kind, className }: { kind: FileKind; className?: string }) {
  switch (kind) {
    case "document":
      return <FileTextIcon className={className} aria-hidden />;
    case "spreadsheet":
      return <FileSpreadsheetIcon className={className} aria-hidden />;
    case "archive":
      return <FileArchiveIcon className={className} aria-hidden />;
    case "code":
      return <FileCodeIcon className={className} aria-hidden />;
    case "image":
      return <FileImageIcon className={className} aria-hidden />;
    case "video":
      return <FileVideoIcon className={className} aria-hidden />;
    case "audio":
      return <FileAudioIcon className={className} aria-hidden />;
    default:
      return <FileIcon className={className} aria-hidden />;
  }
}

export type FileRowStatus = "stored" | "uploading" | "done" | "error";

/**
 * One file in a bordered list: type icon, name, size and state. Uploads show
 * live progress; stored files can be marked for removal. Presentational only,
 * so every state can be rendered with fake data.
 */
export function FileRow({
  name,
  size,
  contentType,
  status = "stored",
  progress = 0,
  error,
  markedForRemoval = false,
  onRemove,
  removeLabel,
  removeKind = "discard",
  removeDisabled = false,
  removing = false,
}: {
  name: string;
  size: number | null;
  contentType?: string | null;
  status?: FileRowStatus;
  /** 0–1, only used while uploading. */
  progress?: number;
  error?: string;
  /** Deleted on save by "Remove all current files". */
  markedForRemoval?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
  /** `discard` drops an unsaved upload; `delete` removes a stored file right away. */
  removeKind?: "discard" | "delete";
  removeDisabled?: boolean;
  removing?: boolean;
}) {
  const percent = Math.min(100, Math.max(0, Math.round(progress * 100)));
  const isError = status === "error";
  const RemoveIcon = removeKind === "delete" ? Trash2Icon : XIcon;
  const label = removeLabel ?? `Remove ${name}`;

  return (
    <li className="flex items-center gap-3 bg-card px-3 py-2.5">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card shadow-xs transition-opacity duration-150 ease-out-soft",
          isError && "border-[#f6d3cf] bg-danger-subtle",
          markedForRemoval && "opacity-50",
        )}
      >
        {isError ? (
          <CircleAlertIcon className="size-4 text-danger" aria-hidden />
        ) : (
          <FileKindIcon
            kind={fileKindFor(name, contentType)}
            className="size-4 text-subtle-foreground"
          />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm leading-5 font-medium text-foreground",
            markedForRemoval &&
              "text-muted-foreground line-through decoration-muted-foreground/70",
          )}
          title={name}
        >
          {name}
        </p>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[0.8125rem] leading-5 text-muted-foreground">
          <span className="shrink-0 tabular">{compactFileSize(size)}</span>

          {status === "uploading" ? (
            <>
              <span aria-hidden>·</span>
              <span className="w-[4ch] shrink-0 tabular">{percent}%</span>
              <span
                role="progressbar"
                aria-label={`Uploading ${name}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="relative h-1 min-w-8 flex-1 overflow-hidden rounded-full bg-muted sm:max-w-48"
              >
                {/* translateX instead of width keeps the animation on the compositor. */}
                <span
                  className="absolute inset-0 rounded-full bg-primary transition-transform duration-300 ease-out-soft"
                  style={{ transform: `translateX(${percent - 100}%)` }}
                />
              </span>
            </>
          ) : null}

          {status === "done" ? (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 text-success">
                <CheckIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
                Uploaded
              </span>
            </>
          ) : null}

          {isError ? (
            <>
              <span aria-hidden>·</span>
              <span className="min-w-0 truncate text-danger" title={error}>
                {error ?? "Upload failed"}
              </span>
            </>
          ) : null}

          {markedForRemoval ? (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">Removed on save</span>
            </>
          ) : null}
        </div>
      </div>

      {onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          disabled={removeDisabled || removing}
          aria-label={label}
          aria-busy={removing || undefined}
          title={label}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            removeKind === "delete" && "hover:bg-danger-subtle hover:text-danger",
          )}
        >
          {removing ? <Spinner /> : <RemoveIcon aria-hidden />}
        </Button>
      ) : null}
    </li>
  );
}
