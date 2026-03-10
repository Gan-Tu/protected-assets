"use client";

import { useActionState, useMemo, useState } from "react";

import { motion } from "framer-motion";
import { FolderOpenIcon, GlobeIcon, TimerResetIcon, UploadIcon } from "lucide-react";

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
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
      {asset ? <input type="hidden" name="asset_id" value={asset.id} /> : null}
      <Card className="border-white/60 bg-white/92 py-5 shadow-[0_30px_70px_rgba(15,23,42,0.08)]">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight text-slate-950">
            {asset ? "Edit protected asset" : "Create protected asset"}
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Lock a private link or document bundle behind request-and-release flows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Asset name</Label>
              <Input id="name" name="name" defaultValue={asset?.name} placeholder="Board deck, diligence folder, pricing link..." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Short URL slug</Label>
              <Input id="slug" name="slug" defaultValue={asset?.slug} placeholder="investor-room" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group_id">Collection</Label>
              <select
                id="group_id"
                name="group_id"
                defaultValue={asset?.group_id ?? ""}
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-slate-400"
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
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={asset?.description ?? ""}
              placeholder="What is inside, who should request it, and anything helpful to know."
              rows={4}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              type="button"
              variant={kind === "link" ? "default" : "outline"}
              className="cursor-pointer justify-start gap-3 rounded-2xl px-4 py-5 text-left"
              onClick={() => setKind("link")}
            >
              <GlobeIcon className="size-4" />
              Link asset
            </Button>
            <Button
              type="button"
              variant={kind === "files" ? "default" : "outline"}
              className="cursor-pointer justify-start gap-3 rounded-2xl px-4 py-5 text-left"
              onClick={() => setKind("files")}
            >
              <UploadIcon className="size-4" />
              Document bundle
            </Button>
          </div>
          <input type="hidden" name="kind" value={kind} />
          {kind === "link" ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="link_url">Destination URL</Label>
              <Input
                id="link_url"
                name="link_url"
                defaultValue={asset?.link_url ?? ""}
                placeholder="https://example.com/private-resource"
                type="url"
                required={kind === "link"}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50/70 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">Upload protected documents</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Multiple files are supported. Signed download links are emailed after approval.
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  Private bucket
                </Badge>
              </div>
              <div className="space-y-2">
                <Label htmlFor="files">Files</Label>
                <Input id="files" name="files" type="file" multiple />
              </div>
              {files.length ? (
                <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">Current bundle</p>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
                      <input type="checkbox" name="replace_files" className="accent-slate-900" />
                      Replace existing files
                    </label>
                  </div>
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                      >
                        <span>{file.file_name}</span>
                        <span>{compactFileSize(file.file_size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
          {state.error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <SubmitButton className="gap-2" pendingLabel="Saving asset...">
              {asset ? "Save changes" : "Create asset"}
            </SubmitButton>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-white/60 bg-white/92 py-5 shadow-[0_30px_70px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-950">
              <TimerResetIcon className="size-4" />
              Advanced release policy
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Let requests auto-release if you do nothing after a custom delay.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
              <input
                type="checkbox"
                name="auto_approve_enabled"
                defaultChecked={asset?.auto_approve_enabled ?? true}
                className="mt-0.5 accent-slate-950"
                onChange={(event) => setAutoApproveEnabled(event.target.checked)}
              />
              <span className="space-y-1">
                <span className="block text-sm font-medium text-slate-950">Enable auto-approve fallback</span>
                <span className="block text-sm text-slate-600">
                  The requester will see this countdown before approval.
                </span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="auto_approve_days">Days</Label>
                <Input
                  id="auto_approve_days"
                  name="auto_approve_days"
                  type="number"
                  min="0"
                  defaultValue={delayValues.days}
                  disabled={!autoApproveEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto_approve_hours">Hours</Label>
                <Input
                  id="auto_approve_hours"
                  name="auto_approve_hours"
                  type="number"
                  min="0"
                  max="23"
                  defaultValue={delayValues.hours}
                  disabled={!autoApproveEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto_approve_minutes">Minutes</Label>
                <Input
                  id="auto_approve_minutes"
                  name="auto_approve_minutes"
                  type="number"
                  min="0"
                  max="59"
                  defaultValue={delayValues.minutes}
                  disabled={!autoApproveEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto_approve_seconds">Seconds</Label>
                <Input
                  id="auto_approve_seconds"
                  name="auto_approve_seconds"
                  type="number"
                  min="0"
                  max="59"
                  defaultValue={delayValues.seconds}
                  disabled={!autoApproveEnabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/60 bg-white/92 py-5 shadow-[0_30px_70px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-950">
              <FolderOpenIcon className="size-4" />
              Release behavior
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Approved link assets are emailed as direct links.</p>
            <p>Approved file assets are emailed as signed download URLs with a time limit.</p>
            <p>Owners are notified by email, and optionally by SMS if Twilio is configured.</p>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
