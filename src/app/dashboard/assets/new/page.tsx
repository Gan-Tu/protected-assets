import { upsertAssetAction } from "@/app/dashboard/actions";
import { AssetForm } from "@/components/forms/asset-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData, requireOwner } from "@/lib/data";

export default async function NewAssetPage() {
  const owner = await requireOwner();
  const { groups } = await getDashboardData(owner.id);

  return (
    <div className="space-y-6">
      <Card className="border-white/60 bg-white/92 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight text-slate-950">
            Create a new protected asset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AssetForm action={upsertAssetAction} groups={groups} />
        </CardContent>
      </Card>
    </div>
  );
}
