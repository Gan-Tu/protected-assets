"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  createUploadTicketsAction,
  deleteAssetFileAction,
} from "@/app/dashboard/actions";
import { StatusMessage } from "@/components/app/status-message";
import { CurrentFiles } from "@/components/asset-editor/current-files";
import { DeliveryNote } from "@/components/asset-editor/delivery-note";
import { EditorCard } from "@/components/asset-editor/editor-card";
import { FileDropzone } from "@/components/asset-editor/file-dropzone";
import { FileRow } from "@/components/asset-editor/file-row";
import { LinkFields } from "@/components/asset-editor/link-fields";
import { ReleasePolicy } from "@/components/asset-editor/release-policy";
import { SaveBar } from "@/components/asset-editor/save-bar";
import { Field, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { IDLE_STATE, type ActionState } from "@/lib/action-state";
import {
  DEFAULT_AUTO_APPROVE_DELAY_SECONDS,
  MAX_FILES_PER_ASSET,
  MAX_UPLOAD_BYTES,
} from "@/lib/constants";
import { LIMITS } from "@/lib/limits";
import type { Asset, AssetFile, AssetGroup, AssetLink } from "@/lib/types";
import { uploadFileToSignedUrl } from "@/lib/upload-client";
import { cn, compactFileSize, slugify } from "@/lib/utils";

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

const COLLECTION_OPTIONS = [
  { value: "existing", label: "Existing" },
  { value: "new", label: "New" },
] as const;

const UPLOAD_LIMITS_HINT = `Up to ${compactFileSize(MAX_UPLOAD_BYTES)} each · ${MAX_FILES_PER_ASSET} files per asset`;

// Fixed locale: the counter renders on the server too, and must hydrate identically.
const countFormat = new Intl.NumberFormat("en-US");

function getInitialLinkInputs(asset?: Asset, links: AssetLink[] = []) {
  if (links.length) return links.map((link) => link.url);
  if (asset?.link_url) return [asset.link_url];
  return [""];
}

/** `links` (whole list) or `links.N` (Nth non-empty link) from the server. */
function findLinkError(fieldErrors: Record<string, string>) {
  if (fieldErrors.links) return { message: fieldErrors.links, index: undefined };

  for (const [key, message] of Object.entries(fieldErrors)) {
    const match = /^links\.(\d+)$/.exec(key);
    if (match) return { message, index: Number(match[1]) };
  }

  return null;
}

function hostOf(url?: string) {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export function AssetForm({
  action,
  groups,
  asset,
  links = [],
  files = [],
  shareBaseUrl,
  cancelHref = "/dashboard",
  initialState = IDLE_STATE,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  groups: AssetGroup[];
  asset?: Asset;
  links?: AssetLink[];
  files?: AssetFile[];
  /** Origin of share pages, shown as the slug prefix when it is short. */
  shareBaseUrl?: string;
  cancelHref?: string;
  /** Prefilled result, e.g. to render error states in a fixture. */
  initialState?: ActionState;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);

  const [name, setName] = useState(asset?.name ?? "");
  const [slug, setSlug] = useState(asset?.slug ?? "");
  const [descriptionLength, setDescriptionLength] = useState(
    asset?.description?.length ?? 0,
  );
  const [collectionMode, setCollectionMode] =
    useState<CollectionMode>("existing");
  const [selectedGroupId, setSelectedGroupId] = useState(asset?.group_id ?? "");
  const [newGroupName, setNewGroupName] = useState("");
  const [initialLinks] = useState(() => getInitialLinkInputs(asset, links));

  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [existingFiles, setExistingFiles] = useState(files);
  const [replaceFiles, setReplaceFiles] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [removingFileId, setRemovingFileId] = useState<string | null>(null);
  const [isRemoving, startRemoving] = useTransition();
  /** One per in-flight upload, so discarding a row also stops its transfer. */
  const uploadControllers = useRef(new Map<string, AbortController>());

  /**
   * A stable id lets the browser upload into this asset's storage prefix before
   * the row exists. The server only accepts it if nobody owns it yet. Lazy
   * initial state (not a ref) so it is safe to read while rendering.
   */
  const [draftAssetId] = useState(
    () => asset?.id ?? globalThis.crypto.randomUUID(),
  );

  const fieldErrors = state.fieldErrors ?? {};
  const linkError = findLinkError(fieldErrors);
  // Only errors this form renders inline; anything else lives in the message.
  const hasInlineErrors = Boolean(
    fieldErrors.name ||
      fieldErrors.slug ||
      linkError ||
      fieldErrors.autoApproveDays,
  );

  const completedUploads = uploads.filter(
    (upload) => upload.status === "done" && upload.storagePath,
  );
  const uploadingCount = uploads.filter(
    (upload) => upload.status === "uploading",
  ).length;
  const keptFiles = replaceFiles ? [] : existingFiles;
  // In-flight uploads count toward the cap too: they will all land.
  const fileCount =
    keptFiles.length +
    uploads.filter((upload) => upload.status !== "error").length;

  const shareHost = hostOf(shareBaseUrl);
  const trimmedSlug = slug.trim();
  const normalizedSlug = slugify(trimmedSlug);
  // Mirrors the server: `slugify(slug || name)`.
  const effectiveSlug = slugify(trimmedSlug || name);
  const slugWillChange = Boolean(asset && effectiveSlug && effectiveSlug !== asset.slug);
  const slugIsNormalized = Boolean(
    trimmedSlug && normalizedSlug && normalizedSlug !== trimmedSlug,
  );
  const slugHint =
    slugIsNormalized || slugWillChange ? (
      <>
        {slugIsNormalized ? (
          <>
            Saved as{" "}
            <span className="font-medium text-foreground">{normalizedSlug}</span>.
            {slugWillChange ? " " : null}
          </>
        ) : null}
        {slugWillChange ? (
          <span className="text-warning">
            The current link stops working when you save.
          </span>
        ) : null}
      </>
    ) : (
      "Leave blank to generate one from the name."
    );

  const descriptionNearLimit = descriptionLength >= LIMITS.description * 0.9;

  // After a failed save, take keyboard and screen-reader users to the first
  // problem instead of leaving them at the button.
  useEffect(() => {
    if (state === initialState || state.status !== "error") return;

    const form = formRef.current;
    const target =
      form?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      form?.querySelector<HTMLElement>("[data-form-error]");
    if (!target) return;

    target.scrollIntoView({ block: "center" });
    if (target.matches("input, select, textarea")) {
      target.focus({ preventScroll: true });
    }
  }, [state, initialState]);

  // Leaving the page abandons the form; stop any transfers still running.
  useEffect(() => {
    const controllers = uploadControllers.current;
    return () => {
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
    };
  }, []);

  async function handleFiles(selected: File[]) {
    setUploadError(null);

    if (!selected.length) return;

    if (fileCount + selected.length > MAX_FILES_PER_ASSET) {
      setUploadError(`An asset can hold at most ${MAX_FILES_PER_ASSET} files.`);
      return;
    }

    const oversized = selected.find((file) => file.size > MAX_UPLOAD_BYTES);
    if (oversized) {
      setUploadError(
        `“${oversized.name}” is larger than the ${compactFileSize(MAX_UPLOAD_BYTES)} per-file limit.`,
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

    for (const item of pending) {
      uploadControllers.current.set(item.id, new AbortController());
    }
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
      for (const item of pending) uploadControllers.current.delete(item.id);
      return;
    }

    // Uploads run in parallel; each row reports its own progress.
    await Promise.all(
      response.tickets.map(async (ticket, index) => {
        const item = pending[index];
        const file = selected[index];
        const controller = uploadControllers.current.get(item.id);

        // Discarded while the tickets were being minted.
        if (!controller || controller.signal.aborted) return;

        try {
          await uploadFileToSignedUrl({
            signedUrl: ticket.signedUrl,
            file,
            signal: controller.signal,
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
          // The row was discarded on purpose; nothing to report.
          if (controller.signal.aborted) return;

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
        } finally {
          uploadControllers.current.delete(item.id);
        }
      }),
    );
  }

  function discardUpload(id: string) {
    uploadControllers.current.get(id)?.abort();
    uploadControllers.current.delete(id);
    setUploads((current) => current.filter((upload) => upload.id !== id));
  }

  function removeExistingFile(fileId: string) {
    if (!asset) return;

    setRemovingFileId(fileId);
    startRemoving(async () => {
      const result = await deleteAssetFileAction({
        assetId: asset.id,
        fileId,
      });

      if (result.status === "error") {
        setUploadError(result.message ?? "Unable to remove that file.");
      } else {
        setExistingFiles((current) =>
          current.filter((file) => file.id !== fileId),
        );
      }

      setRemovingFileId(null);
    });
  }

  const markDirty = () => setDirty(true);

  return (
    <form
      ref={formRef}
      action={formAction}
      // React 19 resets a form after every action, failed ones included, which
      // would wipe what the owner typed (and desync the auto-release switch
      // from its state). A successful save redirects and remounts anyway.
      onReset={(event) => event.preventDefault()}
      onInput={markDirty}
    >
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

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-6">
          <EditorCard
            title="Details"
            description="The name, link and description requesters see."
          >
            <Field id="name" label="Name" error={fieldErrors.name}>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Q1 investor deck"
                maxLength={LIMITS.name}
                autoComplete="off"
                required
                aria-invalid={Boolean(fieldErrors.name) || undefined}
                aria-describedby={describedBy("name", { error: fieldErrors.name })}
              />
            </Field>

            <Field
              id="slug"
              label="Share link"
              hint={slugHint}
              error={fieldErrors.slug}
            >
              {/* One control visually: the ring wraps prefix and input together. */}
              <div
                className={cn(
                  "flex h-10 w-full min-w-0 overflow-hidden rounded-lg border border-input bg-card shadow-xs transition-[border-color,box-shadow] duration-150 ease-out-soft",
                  "hover:border-input-hover has-[input:focus-visible]:border-primary has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-primary/15",
                  fieldErrors.slug &&
                    "border-danger ring-4 ring-danger/12 hover:border-danger has-[input:focus-visible]:border-danger has-[input:focus-visible]:ring-danger/12",
                )}
              >
                <span
                  id="slug-prefix"
                  className="flex max-w-[55%] shrink-0 items-center border-r border-border bg-surface-subtle pr-2.5 pl-3 text-base text-muted-foreground select-none md:text-sm"
                >
                  {shareHost && shareHost.length <= 28 ? (
                    <span className="hidden truncate sm:inline">{shareHost}</span>
                  ) : null}
                  <span className="shrink-0">/a/</span>
                </span>
                <input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder={slugify(name) || "q1-investor-deck"}
                  maxLength={LIMITS.slug}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={Boolean(fieldErrors.slug) || undefined}
                  aria-describedby={[
                    "slug-prefix",
                    describedBy("slug", { hint: slugHint, error: fieldErrors.slug }),
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-base text-foreground outline-none placeholder:text-placeholder md:text-sm"
                />
              </div>
            </Field>

            <Field
              id={collectionMode === "new" ? "new_group_name" : "group_id"}
              label="Collection"
              hint={
                collectionMode === "new"
                  ? "Created when you save."
                  : "Groups related assets on your overview."
              }
              action={
                <SegmentedControl
                  name="collection_mode"
                  size="sm"
                  aria-label="Existing or new collection"
                  value={collectionMode}
                  onValueChange={setCollectionMode}
                  options={COLLECTION_OPTIONS}
                />
              }
            >
              {collectionMode === "new" ? (
                <>
                  <input type="hidden" name="group_id" value="" />
                  <Input
                    id="new_group_name"
                    name="new_group_name"
                    value={newGroupName}
                    onChange={(event) => setNewGroupName(event.target.value)}
                    placeholder="e.g. Investor updates"
                    maxLength={LIMITS.name}
                    autoComplete="off"
                    required
                    aria-describedby="new_group_name-hint"
                  />
                </>
              ) : (
                <NativeSelect
                  id="group_id"
                  name="group_id"
                  value={selectedGroupId}
                  onChange={(event) => setSelectedGroupId(event.target.value)}
                  aria-describedby="group_id-hint"
                >
                  <option value="">No collection</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </Field>

            <Field
              id="description"
              label="Description"
              optional
              hint={
                <span className="flex items-baseline justify-between gap-3">
                  <span>Shown on the share page.</span>
                  <span
                    className={cn(
                      "shrink-0 tabular",
                      descriptionNearLimit && "font-medium text-warning",
                    )}
                  >
                    {countFormat.format(descriptionLength)} /{" "}
                    {countFormat.format(LIMITS.description)}
                  </span>
                </span>
              }
            >
              <Textarea
                id="description"
                name="description"
                defaultValue={asset?.description ?? ""}
                onChange={(event) =>
                  setDescriptionLength(event.target.value.length)
                }
                placeholder="What’s inside, and who it’s for"
                rows={3}
                maxLength={LIMITS.description}
                aria-describedby="description-hint"
                className="max-h-72 resize-none"
              />
            </Field>
          </EditorCard>

          <EditorCard
            title="Content"
            description="What requesters receive once access is granted."
          >
            <LinkFields
              initialLinks={initialLinks}
              error={linkError?.message}
              invalidEntry={linkError?.index}
              onEdit={markDirty}
            />

            <section
              aria-labelledby="files-heading"
              className="grid gap-3 border-t border-border pt-6"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="grid gap-0.5">
                  <h3
                    id="files-heading"
                    className="text-sm leading-5 font-medium text-foreground"
                  >
                    Files
                  </h3>
                  <p className="text-[0.8125rem] leading-5 text-pretty text-muted-foreground">
                    Uploaded straight to private storage as you add them.
                  </p>
                </div>
                {fileCount ? (
                  <span className="shrink-0 text-[0.8125rem] text-muted-foreground tabular">
                    {fileCount} of {MAX_FILES_PER_ASSET}
                  </span>
                ) : null}
              </div>

              {/* What's there first, then the way to add more; new rows land right under the zone. */}
              {existingFiles.length ? (
                <CurrentFiles
                  files={existingFiles}
                  replaceFiles={replaceFiles}
                  onReplaceFilesChange={setReplaceFiles}
                  onRemove={removeExistingFile}
                  removingId={removingFileId}
                  busy={isRemoving}
                />
              ) : null}

              <FileDropzone
                id="files"
                onFiles={handleFiles}
                onReject={setUploadError}
                hint={UPLOAD_LIMITS_HINT}
                disabled={fileCount >= MAX_FILES_PER_ASSET}
                disabledMessage={`This asset has the maximum of ${MAX_FILES_PER_ASSET} files`}
              />

              {uploadError ? (
                <StatusMessage status="error">{uploadError}</StatusMessage>
              ) : null}

              {uploads.length ? (
                <ul
                  aria-label="New files"
                  className="divide-y divide-border overflow-hidden rounded-xl border border-border"
                >
                  {uploads.map((upload) => (
                    <FileRow
                      key={upload.id}
                      name={upload.fileName}
                      size={upload.fileSize}
                      contentType={upload.contentType}
                      status={upload.status}
                      progress={upload.progress}
                      error={upload.error}
                      onRemove={() => discardUpload(upload.id)}
                      removeLabel={
                        upload.status === "uploading"
                          ? `Cancel upload of ${upload.fileName}`
                          : `Remove ${upload.fileName}`
                      }
                    />
                  ))}
                </ul>
              ) : null}
            </section>
          </EditorCard>
        </div>

        <div className="grid min-w-0 gap-6 lg:sticky lg:top-20">
          <ReleasePolicy
            defaultEnabled={asset?.auto_approve_enabled ?? false}
            defaultDelaySeconds={
              asset?.auto_approve_delay_seconds ??
              DEFAULT_AUTO_APPROVE_DELAY_SECONDS
            }
            defaultNote={asset?.auto_approve_note ?? ""}
            error={fieldErrors.autoApproveDays}
            onEdit={markDirty}
          />
          <DeliveryNote />
        </div>
      </div>

      {state.status === "error" && state.message ? (
        <div data-form-error className="mt-6">
          <StatusMessage status="error">{state.message}</StatusMessage>
        </div>
      ) : null}

      <SaveBar
        mode={asset ? "edit" : "new"}
        cancelHref={cancelHref}
        uploadingCount={uploadingCount}
        error={
          state.status === "error"
            ? hasInlineErrors
              ? "fields"
              : "form"
            : null
        }
        dirty={dirty || uploads.length > 0}
      />
    </form>
  );
}
