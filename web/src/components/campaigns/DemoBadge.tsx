/** Marks simulated («Demo») money and payment options. Never used for real, verified money. */
export function DemoBadge({ label = 'Demo' }: { label?: string }) {
  return (
    <span
      lang="en"
      className="inline-flex items-center rounded-md border border-dashed border-control px-1.5 py-0.5 text-[0.8125rem] font-semibold leading-none text-muted"
    >
      {label}
    </span>
  );
}
