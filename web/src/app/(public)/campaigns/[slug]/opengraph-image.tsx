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

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Majlis Fund campaign: illustration and verified funding progress';

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
          <svg width="64" height="64" viewBox="0 0 48 48">
            <rect width="48" height="48" rx="12" fill="#18734b" />
            <g fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round">
              <rect x="13" y="13" width="22" height="22" rx="1.5" />
              <rect x="13" y="13" width="22" height="22" rx="1.5" transform="rotate(45 24 24)" />
            </g>
            <path
              d="M9 25h8l2.5-5 4 10 3-7 1.5 2H39"
              fill="none"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 34, letterSpacing: 1 }}>Majlis Fund</div>
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
