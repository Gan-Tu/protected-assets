import {
  AssetDeliverables,
  AssetIntro,
  HowItWorks,
  type ShareAsset,
} from "@/components/share/asset-details";
import { ShareShell } from "@/components/share/share-shell";

const FORM_ANCHOR = "request-access";

/**
 * Two columns from `lg`: the asset story on the left, the request card on the
 * right (sticky when the viewport is tall enough to show all of it).
 *
 * Below `lg` it is one column in reading order intro → what you'll receive →
 * form → how it works, so the form is reachable without scrolling past the
 * explainer on a phone. `grid-rows-[auto_1fr]` lets the card span both rows
 * without stretching the gap between the two left-hand blocks.
 */
export function SharePage({
  asset,
  form,
}: {
  asset: ShareAsset;
  form: React.ReactNode;
}) {
  return (
    <ShareShell>
      <div className="mx-auto grid max-w-xl gap-10 lg:max-w-none lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-[auto_1fr] lg:gap-x-10">
        <div className="min-w-0 space-y-10 lg:col-start-1 lg:row-start-1">
          <AssetIntro asset={asset} formAnchor={FORM_ANCHOR} />
          <AssetDeliverables asset={asset} />
        </div>

        <div
          id={FORM_ANCHOR}
          className="min-w-0 scroll-mt-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start lg:[@media(min-height:46rem)]:sticky lg:[@media(min-height:46rem)]:top-8"
        >
          {form}
        </div>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <HowItWorks asset={asset} />
        </div>
      </div>
    </ShareShell>
  );
}
