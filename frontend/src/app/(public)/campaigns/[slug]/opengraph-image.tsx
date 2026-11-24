import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { coverScene, type CoverPaint } from '@/components/campaigns/CampaignCover';
import { fundingSegments } from '@/components/campaigns/funding';
import { getCampaign, getLedger } from '@/lib/api/campaigns';
import { orNotFound } from '@/lib/api/client';
import { formatNumber } from '@/shared';

/** The Athar mark (docs/brand/athar-icon.png) as a data URI for the image renderer. */
const MARK = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/brand/athar-icon.png')).toString('base64')}`;

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Athar campaign: illustration and verified funding progress';

/** The light cover palette as fixed colours (the image has no theme). */
const PAINT: CoverPaint = {
  sky: { fill: '#dceee5' },
  ink: { fill: '#135b3c' },
  mid: { fill: '#1f8a5b' },
  soft: { fill: '#acd9c5' },
  paper: { fill: '#ffffff' },
  line: { stroke: '#135b3c' },
};

/**
 * Satori serialises SVG children itself and knows neither fragments nor components: flatten the
 * scene into plain SVG elements first.
 */
function plainSvg(node: ReactNode): ReactNode {
  if (Array.isArray(node)) return node.map(plainSvg);
  if (!isValidElement(node)) return node;
  const el = node as ReactElement<{ children?: ReactNode }>;
  if (el.type === Fragment) return Children.toArray(el.props.children).map(plainSvg);
  if (typeof el.type === 'function') {
    return plainSvg((el.type as (props: object) => ReactNode)(el.props));
  }
  return el.props.children === undefined
    ? el
    : cloneElement(el, undefined, ...Children.toArray(el.props.children).map(plainSvg));
}

/**
 * The link-preview card of a campaign (WhatsApp, Telegram, Facebook): the campaign's cover
 * illustration and its verified progress. Never a photo, a name or any beneficiary detail.
 * The title and summary travel as og:title / og:description next to the image, so the card
 * itself carries only Latin text and Western digits (the bundled OG font has no Arabic shaping).
 */
export default async function CampaignOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await orNotFound(getCampaign(slug, 'en'));
  const ledger = await getLedger(campaign.id);
  const { verifiedPercent } = fundingSegments({
    target: ledger.targetAmount,
    verified: ledger.verifiedAmount,
    pending: ledger.pendingAmount,
    demo: ledger.demoAmount,
  });
  const amount = (v: string) => formatNumber(Number(v), 'en');
  const done = campaign.status === 'COMPLETED';

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', background: '#0f3d2a' }}>
      <div
        style={{
          width: 640,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 60px',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser */}
          <img src={MARK} width={64} height={64} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 34, letterSpacing: 1 }}>Athar</div>
            <div style={{ fontSize: 22, color: '#acd9c5' }}>Salamiyah Local Council</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div style={{ fontSize: 120, lineHeight: 1, color: '#f6a34a' }}>
              {`${verifiedPercent}%`}
            </div>
            <div style={{ fontSize: 28, color: '#d5ece2', paddingBottom: 14 }}>
              {done ? 'completed' : 'verified'}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: 22,
              borderRadius: 11,
              background: '#114a32',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: `${Math.min(100, Math.max(verifiedPercent, 2))}%`,
                height: '100%',
                borderRadius: 11,
                background: '#ef8a2b',
              }}
            />
          </div>
          <div style={{ fontSize: 28, color: '#ffffff' }}>
            {`${amount(ledger.verifiedAmount)} of ${amount(ledger.targetAmount)} ${ledger.currency}`}
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 22, color: '#acd9c5' }}>
          {`${ledger.beneficiariesCount} ${ledger.beneficiariesCount === 1 ? 'beneficiary' : 'beneficiaries'}, shown by code only`}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, padding: '40px 40px 40px 0' }}>
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            borderRadius: 32,
            overflow: 'hidden',
            background: '#dceee5',
          }}
        >
          <svg width="520" height="550" viewBox="80 0 240 240" preserveAspectRatio="xMidYMid slice">
            <rect x="0" y="0" width="400" height="240" fill="#dceee5" />
            {plainSvg(coverScene(campaign.coverKey, PAINT))}
          </svg>
        </div>
      </div>
    </div>,
    size,
  );
}
