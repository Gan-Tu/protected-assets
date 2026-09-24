import { StatusMessage } from "@/components/app/status-message";
import { FileRow } from "@/components/asset-editor/file-row";
import { Switch } from "@/components/ui/switch";
import type { AssetFile } from "@/lib/types";

/**
 * Files already saved on the asset, grouped with the switch that clears them
 * on save. The switch has no `name`: the form mirrors it into the hidden
 * `replace_files` input.
 */
export function CurrentFiles({
  files,
  replaceFiles,
  onReplaceFilesChange,
  onRemove,
  removingId = null,
  busy = false,
}: {
  files: Pick<AssetFile, "id" | "file_name" | "file_size" | "content_type">[];
  replaceFiles: boolean;
  onReplaceFilesChange: (value: boolean) => void;
  onRemove: (fileId: string) => void;
  removingId?: string | null;
  busy?: boolean;
}) {
  const count = files.length;

  return (
    <div className="grid gap-3">
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-subtle px-3 py-2">
          <h4
            id="current-files-heading"
            className="text-[0.8125rem] leading-5 font-medium text-foreground"
          >
            Current files
          </h4>
          <span className="text-[0.8125rem] leading-5 text-muted-foreground tabular">
            {count}
          </span>
        </div>

        <ul aria-labelledby="current-files-heading" className="divide-y divide-border">
          {files.map((file) => (
            <FileRow
              key={file.id}
              name={file.file_name}
              size={file.file_size}
              contentType={file.content_type}
              markedForRemoval={replaceFiles}
              onRemove={() => onRemove(file.id)}
              removeKind="delete"
              removeLabel={`Delete ${file.file_name}`}
              removeDisabled={busy || replaceFiles}
              removing={removingId === file.id}
            />
          ))}
        </ul>

        <label
          htmlFor="replace_files_toggle"
          className="flex cursor-pointer items-center justify-between gap-4 border-t border-border bg-surface-subtle px-3 py-3"
        >
          <span className="grid min-w-0 gap-0.5">
            <span className="text-sm leading-5 font-medium text-foreground">
              Remove all current files on save
            </span>
            <span
              id="replace_files_toggle-hint"
              className="text-[0.8125rem] leading-5 text-muted-foreground"
            >
              Files you upload now are kept.
            </span>
          </span>
          <Switch
            id="replace_files_toggle"
            checked={replaceFiles}
            onChange={(event) => onReplaceFilesChange(event.target.checked)}
            aria-describedby="replace_files_toggle-hint"
          />
        </label>
      </div>

      {replaceFiles ? (
        <StatusMessage status="warning">
          Saving will permanently delete{" "}
          {count === 1 ? "the current file" : `all ${count} current files`}.
        </StatusMessage>
      ) : null}
    </div>
  );
}
