import { getTranslations } from 'next-intl/server';
import { buttonClasses } from '@/components/ui/Button';
import { whatsappShareUrl } from '@/shared';
import { CopyButton } from './CopyButton';

const ICON = 'h-4 w-4 shrink-0';

/**
 * Share a campaign: WhatsApp, Telegram and Facebook are plain links (no JS); only "copy link" is a
 * small client button. The shared page carries the OG card (opengraph-image), so the preview shows
 * the campaign's illustration and progress — never a beneficiary.
 */
export async function ShareButtons({ url, text }: { url: string; text: string }) {
  const t = await getTranslations('share');
  const encodedUrl = encodeURIComponent(url);
  const links = [
    {
      key: 'whatsapp',
      href: whatsappShareUrl(`${text}\n${url}`),
      icon: (
        <path
          fill="currentColor"
          d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z"
        />
      ),
    },
    {
      key: 'telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(text)}`,
      icon: (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          d="M21 4 3 11l6 2 2 6 3-4 4 3 3-14ZM9 13l9-6-6 8"
        />
      ),
    },
    {
      key: 'facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <path
          fill="currentColor"
          d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9Z"
        />
      ),
    },
  ] as const;

  return (
    <section aria-labelledby="share-title" className="space-y-2" data-testid="share-buttons">
      <h2 id="share-title" className="text-sm font-semibold">
        {t('heading')}
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {links.map((l) => (
          <a
            key={l.key}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses('secondary', 'sm', 'w-full min-w-0 px-2')}
            data-share={l.key}
          >
            <svg viewBox="0 0 24 24" className={`${ICON} text-accent`} aria-hidden="true">
              {l.icon}
            </svg>
            {t(l.key)}
            <span className="sr-only"> {t('newWindow')}</span>
          </a>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
        <span dir="ltr" className="min-w-0 flex-1 truncate text-xs text-muted">
          {url}
        </span>
        <CopyButton
          value={url}
          label={t('copyLabel')}
          copyText={t('copy')}
          copiedText={t('copied')}
        />
      </div>
    </section>
  );
}
