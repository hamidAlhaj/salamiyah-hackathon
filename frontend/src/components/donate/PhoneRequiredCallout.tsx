/**
 * Why a donor must add a phone before donating, said in terms of what they get (the WhatsApp
 * receipt). Shown on the profile page and instead of the donate flow.
 */
export function PhoneRequiredCallout({
  title,
  body,
  className = '',
  children,
}: {
  title: string;
  body: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      data-testid="phone-required"
      className={`flex gap-4 rounded-xl border border-warning-line bg-warning-soft p-4 sm:p-5 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 h-6 w-6 flex-shrink-0 text-warning"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
        <path d="M10 18.5h4M9.5 8.5l1.8 1.8 3.2-3.3" />
      </svg>
      <div className="min-w-0">
        <p className="font-display font-bold text-ink">{title}</p>
        <p className="mt-1 max-w-[60ch] text-sm text-ink/80">{body}</p>
        {children}
      </div>
    </div>
  );
}
