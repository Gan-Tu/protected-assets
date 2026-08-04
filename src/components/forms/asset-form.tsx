"use client";

import {
  useActionState,
  useMemo,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import {
  ClockIcon,
  GlobeIcon,
  InfoIcon,
  Loader2Icon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";

import {
  createUploadTicketsAction,
  deleteAssetFileAction,
} from "@/app/dashboard/actions";
import { StatusMessage } from "@/components/app/status-message";
import { SubmitButton } from "@/components/app/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IDLE_STATE, type ActionState } from "@/lib/action-state";
import {
  DEFAULT_AUTO_APPROVE_DELAY_SECONDS,
  MAX_FILES_PER_ASSET,
  MAX_UPLOAD_BYTES,
} from "@/lib/constants";
import type { Asset, AssetFile, AssetGroup, AssetLink } from "@/lib/types";
import { uploadFileToSignedUrl } from "@/lib/upload-client";
import { compactFileSize, cn } from "@/lib/utils";
import { LIMITS } from "@/lib/validation";

type CollectionMode = "existing" | "new";

type UploadItem = {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string | null;
  storagePath?: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
};

function splitDelay(totalSeconds: number) {
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function getInitialLinkInputs(asset?: Asset, links: AssetLink[] = []) {
  if (links.length) return links.map((link) => link.url);
  if (asset?.link_url) return [asset.link_url];
  return [""];
}

export function AssetForm({
  action,
  groups,
  asset,
  links = [],
  files = [],
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  groups: AssetGroup[];
  asset?: Asset;
  links?: AssetLink[];
  files?: AssetFile[];
}) {
  const [state, formAction] = useActionState(action, IDLE_STATE);
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(
    asset?.auto_approve_enabled ?? false,
  );
  const [collectionMode, setCollectionMode] =
    useState<CollectionMode>("existing");
  const [selectedGroupId, setSelectedGroupId] = useState(asset?.group_id ?? "");
  const [newGroupName, setNewGroupName] = useState("");
  const [linkInputs, setLinkInputs] = useState<string[]>(
    getInitialLinkInputs(asset, links),
  );
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [existingFiles, setExistingFiles] = useState(files);
  const [replaceFiles, setReplaceFiles] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRemoving, startRemoving] = useTransition();

  /**
   * A stable id lets the browser upload into this asset's storage prefix before
   * the row exists. The server only accepts it if nobody owns it yet. Lazy
   * initial state (not a ref) so it is safe to read while rendering.
   */
  const [draftAssetId] = useState(
    () => asset?.id ?? globalThis.crypto.randomUUID(),
  );

  const delayValues = useMemo(
    () =>
      splitDelay(
        asset?.auto_approve_delay_seconds ?? DEFAULT_AUTO_APPROVE_DELAY_SECONDS,
      ),
    [asset?.auto_approve_delay_seconds],
  );

  const completedUploads = uploads.filter(
    (upload) => upload.status === "done" && upload.storagePath,
  );
  const isUploading = uploads.some((upload) => upload.status === "uploading");
  const keptFiles = replaceFiles ? [] : existingFiles;
  const totalFiles = keptFiles.length + completedUploads.length;
  const fieldErrors = state.fieldErrors ?? {};

  function updateLink(index: number, value: string) {
    setLinkInputs((current) =>
      current.map((link, currentIndex) =>
        currentIndex === index ? value : link,
      ),
    );
  }

  function removeLink(index: number) {
    setLinkInputs((current) =>
      current.length === 1
        ? [""]
        : current.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    setUploadError(null);

    if (!selected.length) return;

    if (totalFiles + selected.length > MAX_FILES_PER_ASSET) {
      setUploadError(`An asset can hold at most ${MAX_FILES_PER_ASSET} files.`);
      return;
    }

    const oversized = selected.find((file) => file.size > MAX_UPLOAD_BYTES);
    if (oversized) {
      setUploadError(
        `"${oversized.name}" exceeds the ${compactFileSize(MAX_UPLOAD_BYTES)} per-file limit.`,
      );
      return;
    }

    const pending: UploadItem[] = selected.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || null,
      progress: 0,
      status: "uploading",
    }));

    setUploads((current) => [...current, ...pending]);

    const response = await createUploadTicketsAction({
      assetId: draftAssetId,
      isExistingAsset: Boolean(asset),
      files: selected.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type || null,
      })),
    });

    if (!response.ok) {
      setUploadError(response.message);
      setUploads((current) =>
        current.map((upload) =>
          pending.some((item) => item.id === upload.id)
            ? { ...upload, status: "error", error: response.message }
            : upload,
        ),
      );
      return;
    }

    // Uploads run in parallel; each row reports its own progress.
    await Promise.all(
      response.tickets.map(async (ticket, index) => {
        const item = pending[index];
        const file = selected[index];

        try {
          await uploadFileToSignedUrl({
            signedUrl: ticket.signedUrl,
            file,
            onProgress: (fraction) =>
              setUploads((current) =>
                current.map((upload) =>
                  upload.id === item.id
                    ? { ...upload, progress: fraction }
                    : upload,
                ),
              ),
          });

          setUploads((current) =>
            current.map((upload) =>
              upload.id === item.id
                ? {
                    ...upload,
                    status: "done",
                    progress: 1,
                    storagePath: ticket.storagePath,
                  }
                : upload,
            ),
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Upload failed.";
          setUploadError(message);
          setUploads((current) =>
            current.map((upload) =>
              upload.id === item.id
                ? { ...upload, status: "error", error: message }
                : upload,
            ),
          );
        }
      }),
    );
  }

  function discardUpload(id: string) {
    setUploads((current) => current.filter((upload) => upload.id !== id));
  }

  function removeExistingFile(fileId: string) {
    if (!asset) return;

    startRemoving(async () => {
      const result = await deleteAssetFileAction({
        assetId: asset.id,
        fileId,
      });

      if (result.status === "error") {
        setUploadError(result.message ?? "Unable to remove that file.");
        return;
      }

      setExistingFiles((current) =>
        current.filter((file) => file.id !== fileId),
      );
    });
  }

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {asset ? (
        <input type="hidden" name="asset_id" value={asset.id} />
      ) : (
        <input type="hidden" name="draft_asset_id" value={draftAssetId} />
      )}
      <input
        type="hidden"
        name="uploads"
        value={JSON.stringify(
          completedUploads.map((upload) => ({
            storagePath: upload.storagePath,
            fileName: upload.fileName,
            fileSize: upload.fileSize,
            contentType: upload.contentType,
          })),
        )}
      />
      <input
        type="hidden"
        name="replace_files"
        value={replaceFiles ? "true" : "false"}
      />

      <div className="space-y-8">
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-zinc-900">
              {asset ? "Edit asset" : "New asset"}
            </h2>
            <p className="text-sm text-zinc-500">
              Configure your protected asset and release policy.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-zinc-700">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={asset?.name}
                placeholder="e.g. Q1 Investor Deck"
                className="bg-white"
                maxLength={LIMITS.name}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "name-error" : undefined}
                required
              />
              {fieldErrors.name ? (
                <p id="name-error" className="text-xs text-red-600">
                  {fieldErrors.name}
                </p>
              ) : null}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="slug" className="text-zinc-700">
                  URL slug
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                    /a/
                  </span>
                  <Input
                    id="slug"
                    name="slug"
                    defaultValue={asset?.slug}
                    placeholder="slug"
                    className="bg-white pl-8"
                    maxLength={LIMITS.slug}
                    aria-invalid={Boolean(fieldErrors.slug)}
                    aria-describedby={fieldErrors.slug ? "slug-error" : undefined}
                  />
                </div>
                {fieldErrors.slug ? (
                  <p id="slug-error" className="text-xs text-red-600">
                    {fieldErrors.slug}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="group_id" className="text-zinc-700">
                    Collection
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer px-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
                    onClick={() =>
                      setCollectionMode((current) =>
                        current === "new" ? "existing" : "new",
                      )
                    }
                  >
                    {collectionMode === "new" ? "Use existing" : "Create new"}
                  </Button>
                </div>

                {collectionMode === "new" ? (
                  <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
                    <input type="hidden" name="group_id" value="" />
                    <Input
                      id="new_group_name"
                      name="new_group_name"
                      value={newGroupName}
                      onChange={(event) => setNewGroupName(event.target.value)}
                      placeholder="e.g. Investor Updates"
                      className="bg-white"
                      maxLength={LIMITS.name}
                      required
                    />
                    <p className="text-xs text-zinc-500">
                      A new collection is created when you save this asset.
                    </p>
                  </div>
                ) : (
                  <select
                    id="group_id"
                    name="group_id"
                    value={selectedGroupId}
                    onChange={(event) => setSelectedGroupId(event.target.value)}
                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    <option value="">No collection</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-zinc-700">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={asset?.description ?? ""}
                placeholder="What is this asset for?"
                rows={3}
                maxLength={LIMITS.description}
                className="resize-none bg-white"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <Label className="text-zinc-700">Protected links</Label>
            <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-6">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                  <GlobeIcon className="size-3.5 text-zinc-500" aria-hidden />
                  Link access
                </p>
                <p className="text-xs text-zinc-500">
                  Add as many destination URLs as you want. These are delivered
                  alongside any uploaded files.
                </p>
              </div>

              <div className="space-y-3">
                {linkInputs.map((link, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Input
                      name="link_url"
                      value={link}
                      onChange={(event) => updateLink(index, event.target.value)}
                      placeholder="https://..."
                      type="url"
                      maxLength={LIMITS.url}
                      className="bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
                      aria-label={`Remove link ${index + 1}`}
                    >
                      <Trash2Icon className="size-4" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>

              {fieldErrors.links ? (
                <p className="text-xs text-red-600">{fieldErrors.links}</p>
              ) : null}

              <button
                type="button"
                onClick={() => setLinkInputs((current) => [...current, ""])}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
              >
                <PlusIcon className="size-4" aria-hidden />
                Add another link
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="files" className="text-zinc-700">
              Protected files
            </Label>
            <div className="space-y-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                  <UploadIcon className="size-3.5 text-zinc-500" aria-hidden />
                  Document bundle
                </p>
                <p className="text-xs text-zinc-500">
                  Files upload straight to secure storage as you pick them, up to{" "}
                  {compactFileSize(MAX_UPLOAD_BYTES)} each.
                </p>
              </div>

              <Input
                id="files"
                type="file"
                multiple
                onChange={handleFileSelection}
                className="cursor-pointer bg-white"
              />

              {uploadError ? (
                <StatusMessage status="error">{uploadError}</StatusMessage>
              ) : null}

              {uploads.length ? (
                <ul className="grid gap-1.5">
                  {uploads.map((upload) => (
                    <li
                      key={upload.id}
                      className="rounded-md border border-zinc-100 bg-white p-2.5 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-700">
                            {upload.fileName}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {compactFileSize(upload.fileSize)}
                            {upload.status === "uploading" &&
                              ` - ${Math.round(upload.progress * 100)}%`}
                            {upload.status === "done" && " - uploaded"}
                            {upload.status === "error" &&
                              ` - ${upload.error ?? "failed"}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {upload.status === "uploading" ? (
                            <Loader2Icon
                              className="size-4 animate-spin text-zinc-400"
                              aria-hidden
                            />
                          ) : null}
                          <button
                            type="button"
                            onClick={() => discardUpload(upload.id)}
                            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
                            aria-label={`Remove ${upload.fileName}`}
                          >
                            <Trash2Icon className="size-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                      {upload.status === "uploading" ? (
                        <div
                          className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-100"
                          role="progressbar"
                          aria-valuenow={Math.round(upload.progress * 100)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Uploading ${upload.fileName}`}
                        >
                          <div
                            className="h-full bg-zinc-900 transition-all"
                            style={{ width: `${upload.progress * 100}%` }}
                          />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              {existingFiles.length ? (
                <div className="space-y-3 border-t border-zinc-200 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Current files
                    </p>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600">
                      <input
                        type="checkbox"
                        checked={replaceFiles}
                        onChange={(event) =>
                          setReplaceFiles(event.target.checked)
                        }
                        className="rounded border-zinc-300"
                      />
                      Delete all current files on save
                    </label>
                  </div>

                  {replaceFiles ? (
                    <StatusMessage status="error">
                      Saving will permanently delete the {existingFiles.length}{" "}
                      file{existingFiles.length === 1 ? "" : "s"} below.
                    </StatusMessage>
                  ) : null}

                  <ul className="grid gap-1.5">
                    {existingFiles.map((file) => (
                      <li
                        key={file.id}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-md border border-zinc-100 bg-white p-2.5 text-sm",
                          replaceFiles && "opacity-50",
                        )}
                      >
                        <span className="truncate text-zinc-700">
                          {file.file_name}
                        </span>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-xs text-zinc-500">
                            {compactFileSize(file.file_size)}
                          </span>
                          <button
                            type="button"
                            disabled={isRemoving || replaceFiles}
                            onClick={() => removeExistingFile(file.id)}
                            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Delete ${file.file_name}`}
                          >
                            <Trash2Icon className="size-4" aria-hidden />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {state.status === "error" && state.message ? (
          <StatusMessage status="error">{state.message}</StatusMessage>
        ) : null}

        <div className="border-t border-zinc-100 pt-6">
          <SubmitButton
            className="w-full sm:w-auto"
            pendingLabel="Saving..."
            disabled={isUploading}
          >
            {asset ? "Save changes" : "Create asset"}
          </SubmitButton>
          {isUploading ? (
            <p className="mt-2 text-xs text-zinc-500">
              Waiting for uploads to finish...
            </p>
          ) : null}
        </div>
      </div>

      <aside className="space-y-6">
        <Card className="overflow-hidden border-zinc-200 shadow-sm">
          <CardHeader className="bg-zinc-50/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-600">
              <ClockIcon className="size-3.5" aria-hidden />
              Auto-release
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <label className="group flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="auto_approve_enabled"
                defaultChecked={asset?.auto_approve_enabled ?? false}
                className="mt-1 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                onChange={(event) => setAutoApproveEnabled(event.target.checked)}
              />
              <div className="space-y-1">
                <span className="text-sm font-medium text-zinc-900">
                  Enabled
                </span>
                <p className="text-xs leading-relaxed text-zinc-500">
                  Automatically release if no action is taken. Maximum 7 days.
                </p>
              </div>
            </label>

            <div
              className={cn(
                "grid grid-cols-2 gap-3 transition-opacity",
                !autoApproveEnabled && "pointer-events-none opacity-40",
              )}
            >
              {(
                [
                  ["auto_approve_days", "Days", delayValues.days, 365],
                  ["auto_approve_hours", "Hours", delayValues.hours, 23],
                  ["auto_approve_minutes", "Min", delayValues.minutes, 59],
                  ["auto_approve_seconds", "Sec", delayValues.seconds, 59],
                ] as const
              ).map(([name, label, value, max]) => (
                <div key={name} className="space-y-1.5">
                  <Label
                    htmlFor={name}
                    className="text-[10px] font-bold uppercase text-zinc-500"
                  >
                    {label}
                  </Label>
                  <Input
                    id={name}
                    name={name}
                    type="number"
                    min="0"
                    max={max}
                    defaultValue={value}
                    disabled={!autoApproveEnabled}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>

            {fieldErrors.autoApproveDays ? (
              <p className="text-xs text-red-600">
                {fieldErrors.autoApproveDays}
              </p>
            ) : null}

            <div className="space-y-1.5">
              <Label
                htmlFor="release_note"
                className="text-[10px] font-bold uppercase text-zinc-500"
              >
                Release note
              </Label>
              <Textarea
                id="release_note"
                name="release_note"
                defaultValue={asset?.auto_approve_note ?? ""}
                placeholder="Optional note to include on every approval and auto-release."
                rows={4}
                maxLength={LIMITS.note}
                className="resize-none bg-white text-sm"
              />
              <p className="text-xs leading-relaxed text-zinc-500">
                Always attached when access is granted. Manual approvals can add
                a separate one-off note.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center gap-2 text-zinc-900">
            <ShieldCheckIcon className="size-4 text-zinc-500" aria-hidden />
            <span className="text-sm font-semibold">How delivery works</span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-600">
            Small documents are attached directly to the release email. Anything
            larger is sent as a revocable download link that expires, and stops
            working if you clear the request.
          </p>
          <div className="flex items-center gap-2 text-zinc-500">
            <InfoIcon className="size-3" aria-hidden />
            <span className="text-[10px] font-medium uppercase tracking-tighter">
              Owner control plane
            </span>
          </div>
        </div>
      </aside>
    </form>
  );
}
