"use client";

import { useActionState, useMemo, useState } from "react";
import { ClockIcon, GlobeIcon, InfoIcon, PlusIcon, ShieldCheckIcon, Trash2Icon, UploadIcon } from "lucide-react";

import type { AssetFormState } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/app/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_AUTO_APPROVE_DELAY_SECONDS } from "@/lib/constants";
import type { Asset, AssetFile, AssetGroup, AssetLink } from "@/lib/types";
import { compactFileSize } from "@/lib/utils";
import { cn } from "@/lib/utils";

const initialState: AssetFormState = {};

function splitDelay(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function getInitialLinkInputs(asset?: Asset, links: AssetLink[] = []) {
  if (links.length) {
    return links.map((link) => link.url);
  }

  if (asset?.link_url) {
    return [asset.link_url];
  }

  return [""];
}

export function AssetForm({
  action,
  groups,
  asset,
  links = [],
  files = [],
}: {
  action: (state: AssetFormState, formData: FormData) => Promise<AssetFormState>;
  groups: AssetGroup[];
  asset?: Asset;
  links?: AssetLink[];
  files?: AssetFile[];
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(
    asset?.auto_approve_enabled ?? true,
  );
  const [linkInputs, setLinkInputs] = useState<string[]>(getInitialLinkInputs(asset, links));
  const delayValues = useMemo(
    () =>
      splitDelay(
        asset?.auto_approve_delay_seconds ?? DEFAULT_AUTO_APPROVE_DELAY_SECONDS,
      ),
    [asset?.auto_approve_delay_seconds],
  );

  function updateLink(index: number, value: string) {
    setLinkInputs((current) =>
      current.map((link, currentIndex) => (currentIndex === index ? value : link)),
    );
  }

  function addLink() {
    setLinkInputs((current) => [...current, ""]);
  }

  function removeLink(index: number) {
    setLinkInputs((current) => {
      if (current.length === 1) {
        return [""];
      }

      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {asset ? <input type="hidden" name="asset_id" value={asset.id} /> : null}
      
      <div className="space-y-8">
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-zinc-900">{asset ? "Edit Asset" : "New Asset"}</h2>
            <p className="text-sm text-zinc-500">Configure your protected asset and release policy.</p>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-zinc-700">Name</Label>
              <Input id="name" name="name" defaultValue={asset?.name} placeholder="e.g. Q1 Investor Deck" className="bg-white" required />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="slug" className="text-zinc-700">URL Slug</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">/a/</span>
                  <Input id="slug" name="slug" defaultValue={asset?.slug} placeholder="slug" className="pl-8 bg-white" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="group_id" className="text-zinc-700">Collection</Label>
                <select
                  id="group_id"
                  name="group_id"
                  defaultValue={asset?.group_id ?? ""}
                  className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:ring-1 focus:ring-zinc-400"
                >
                  <option value="">No collection</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-zinc-700">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={asset?.description ?? ""}
                placeholder="What is this asset for?"
                rows={3}
                className="bg-white resize-none"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <Label className="text-zinc-700">Protected Links</Label>
            <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-6">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                  <GlobeIcon className="size-3.5 text-zinc-500" />
                  Link Access
                </p>
                <p className="text-xs text-zinc-500">
                  Add as many destination URLs as you want. These are delivered alongside any uploaded files.
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
                      className="bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
                      aria-label={`Remove link ${index + 1}`}
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addLink}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
              >
                <PlusIcon className="size-4" />
                Add another link
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-700">Protected Files</Label>
            <div className="space-y-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                  <UploadIcon className="size-3.5 text-zinc-500" />
                  Document Bundle
                </p>
                <p className="text-xs text-zinc-500">Upload one or more files to deliver with the protected links.</p>
              </div>

              <div className="grid gap-2">
                <Input id="files" name="files" type="file" multiple className="bg-white cursor-pointer" />
              </div>

              {files.length ? (
                <div className="space-y-3 pt-4 border-t border-zinc-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Current Files</p>
                    <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer">
                      <input type="checkbox" name="replace_files" className="rounded border-zinc-300" />
                      Replace all
                    </label>
                  </div>
                  <div className="grid gap-1.5">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between rounded-md border border-zinc-100 bg-white p-2.5 text-sm">
                        <span className="truncate text-zinc-700">{file.file_name}</span>
                        <span className="shrink-0 text-xs text-zinc-400">{compactFileSize(file.file_size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {state.error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-100 text-sm text-red-600">
            {state.error}
          </div>
        )}

        <div className="pt-6 border-t border-zinc-100">
          <SubmitButton className="w-full sm:w-auto" pendingLabel="Saving...">
            {asset ? "Save Changes" : "Create Asset"}
          </SubmitButton>
        </div>
      </div>

      <aside className="space-y-6">
        <Card className="border-zinc-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-zinc-50/50 pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <ClockIcon className="size-3.5" />
              Auto-Release
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="auto_approve_enabled"
                defaultChecked={asset?.auto_approve_enabled ?? true}
                className="mt-1 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                onChange={(event) => setAutoApproveEnabled(event.target.checked)}
              />
              <div className="space-y-1">
                <span className="text-sm font-medium text-zinc-900 group-hover:text-zinc-700 transition-colors">Enabled</span>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Automatically release if no action is taken.
                </p>
              </div>
            </label>

            <div className={cn("grid grid-cols-2 gap-3 transition-opacity", !autoApproveEnabled && "opacity-40 pointer-events-none")}>
              <div className="space-y-1.5">
                <Label htmlFor="auto_approve_days" className="text-[10px] uppercase font-bold text-zinc-400">Days</Label>
                <Input id="auto_approve_days" name="auto_approve_days" type="number" min="0" defaultValue={delayValues.days} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="auto_approve_hours" className="text-[10px] uppercase font-bold text-zinc-400">Hours</Label>
                <Input id="auto_approve_hours" name="auto_approve_hours" type="number" min="0" max="23" defaultValue={delayValues.hours} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="auto_approve_minutes" className="text-[10px] uppercase font-bold text-zinc-400">Min</Label>
                <Input id="auto_approve_minutes" name="auto_approve_minutes" type="number" min="0" max="59" defaultValue={delayValues.minutes} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="auto_approve_seconds" className="text-[10px] uppercase font-bold text-zinc-400">Sec</Label>
                <Input id="auto_approve_seconds" name="auto_approve_seconds" type="number" min="0" max="59" defaultValue={delayValues.seconds} className="h-8 text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="release_note" className="text-[10px] uppercase font-bold text-zinc-400">
                Release Note
              </Label>
              <Textarea
                id="release_note"
                name="release_note"
                defaultValue={asset?.auto_approve_note ?? ""}
                placeholder="Optional note to include on every approval and auto-release."
                rows={4}
                className="resize-none bg-white text-sm"
              />
              <p className="text-xs leading-relaxed text-zinc-500">
                This note is always attached when access is granted. Manual approvals can still add a separate one-off note.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-3">
          <div className="flex items-center gap-2 text-zinc-900">
            <ShieldCheckIcon className="size-4 text-zinc-400" />
            <span className="text-sm font-semibold">Privacy Policy</span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Assets are stored securely. Requesters must provide email and reason for access.
          </p>
          <div className="flex items-center gap-2 text-zinc-400">
            <InfoIcon className="size-3" />
            <span className="text-[10px] font-medium uppercase tracking-tighter">Owner control plane</span>
          </div>
        </div>
      </aside>
    </form>
  );
}
