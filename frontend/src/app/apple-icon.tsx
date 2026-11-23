import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** iOS home-screen icon: the same mark as app/icon.svg, PNG rendered at build time. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f3d2a',
      }}
    >
      <svg width="150" height="150" viewBox="0 0 48 48">
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
    </div>,
    size,
  );
}
