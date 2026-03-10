"use client";

import { useActionState, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlobeIcon, UploadIcon, ClockIcon, ShieldCheckIcon, InfoIcon } from "lucide-react";

import type { AssetFormState } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/app/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_AUTO_APPROVE_DELAY_SECONDS } from "@/lib/constants";
import type { Asset, AssetFile, AssetGroup } from "@/lib/types";
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

export function AssetForm({
  action,
  groups,
  asset,
  files = [],
}: {
  action: (state: AssetFormState, formData: FormData) => Promise<AssetFormState>;
  groups: AssetGroup[];
  asset?: Asset;
  files?: AssetFile[];
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [kind, setKind] = useState<"link" | "files">(asset?.kind ?? "link");
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(
    asset?.auto_approve_enabled ?? true,
  );
  const delayValues = useMemo(
    () =>
      splitDelay(
        asset?.auto_approve_delay_seconds ?? DEFAULT_AUTO_APPROVE_DELAY_SECONDS,
      ),
    [asset?.auto_approve_delay_seconds],
  );

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

        <section className="space-y-4">
          <Label className="text-zinc-700">Asset Content</Label>
          <div className="flex p-1 bg-zinc-100 rounded-lg w-fit">
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                kind === "link" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
              onClick={() => setKind("link")}
            >
              <GlobeIcon className="size-3.5" />
              Link
            </button>
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                kind === "files" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
              onClick={() => setKind("files")}
            >
              <UploadIcon className="size-3.5" />
              Files
            </button>
          </div>
          <input type="hidden" name="kind" value={kind} />

          <AnimatePresence mode="wait">
            {kind === "link" ? (
              <motion.div
                key="link"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="grid gap-2"
              >
                <Label htmlFor="link_url" className="text-zinc-600 text-xs">Destination URL</Label>
                <Input
                  id="link_url"
                  name="link_url"
                  defaultValue={asset?.link_url ?? ""}
                  placeholder="https://..."
                  type="url"
                  className="bg-white"
                  required={kind === "link"}
                />
              </motion.div>
            ) : (
              <motion.div
                key="files"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 p-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-900">Document Bundle</p>
                  <p className="text-xs text-zinc-500">Upload one or more files to be shared.</p>
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
                        <div key={file.id} className="flex items-center justify-between p-2.5 rounded-md bg-white border border-zinc-100 text-sm">
                          <span className="text-zinc-700 truncate">{file.file_name}</span>
                          <span className="text-zinc-400 text-xs shrink-0">{compactFileSize(file.file_size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
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
