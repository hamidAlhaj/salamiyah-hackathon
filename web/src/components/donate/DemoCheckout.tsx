'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DemoBadge } from '@/components/campaigns/DemoBadge';
import { Button } from '@/components/ui/Button';
import { controlClass, labelClass } from '@/components/ui/Field';
import { FormError } from '@/components/ui/FormParts';
import type { PaymentAccount } from '@/shared';

/** The fixed demo confirmation code, shown on screen (there is no SMS). */
const DEMO_OTP = '246810';
const TEST_CARD = '4242 4242 4242 4242';

/**
 * Realistic simulated checkouts for the hackathon demo. Nothing typed here leaves the browser: the
 * card fields are prefilled test values and read-only, and the wallet number and code are only checked
 * locally. `onPay` then records a DEMO_CONFIRMED pledge with the method and amount only.
 */
export function DemoCheckout({
  account,
  amountLabel,
  pending,
  error,
  onPay,
}: {
  account: PaymentAccount;
  amountLabel: string;
  pending: boolean;
  error?: string;
  onPay: () => void;
}) {
  const t = useTranslations('donate');
  const isCard = account.kind === 'CARD';
  const isPaypal = account.method === 'PAYPAL';

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card"
      data-testid="demo-checkout"
      data-method={account.method}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border bg-surface-muted px-5 py-3">
        <p className="font-semibold">
          {isPaypal
            ? t('paypal.title')
            : isCard
              ? t('card.title', { method: account.label })
              : t('wallet.title', { method: account.label })}
        </p>
        <DemoBadge />
      </header>
      <div className="space-y-4 px-5 py-5">
        <p className="rounded-xl border border-dashed border-control px-3 py-2 text-xs text-muted">
          {t('demoNote')}
        </p>
        {isPaypal ? (
          <PaypalApprove amountLabel={amountLabel} pending={pending} onPay={onPay} />
        ) : isCard ? (
          <CardForm amountLabel={amountLabel} pending={pending} onPay={onPay} />
        ) : (
          <WalletOtp amountLabel={amountLabel} pending={pending} onPay={onPay} />
        )}
        <FormError message={error} />
      </div>
    </section>
  );
}

type StepProps = { amountLabel: string; pending: boolean; onPay: () => void };

function WalletOtp({ amountLabel, pending, onPay }: StepProps) {
  const t = useTranslations('donate.wallet');
  const [phone, setPhone] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();

  if (!sentTo) {
    return (
      <div className="space-y-3">
        <label htmlFor="wallet-phone" className={labelClass}>
          {t('phone')}
        </label>
        <input
          id="wallet-phone"
          className={controlClass}
          inputMode="tel"
          dir="ltr"
          autoComplete="off"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, '').slice(0, 15))}
          placeholder="09XXXXXXXX"
          aria-describedby="wallet-phone-hint"
        />
        <p id="wallet-phone-hint" className="text-xs text-muted">
          {t('phoneHint')}
        </p>
        {error && <FormError message={error} />}
        <Button
          className="w-full"
          onClick={() => {
            if (!/^(\+?963|0)?9\d{8}$/.test(phone)) return setError(t('invalidPhone'));
            setError(undefined);
            setSentTo(phone);
          }}
        >
          {t('sendCode')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">{t('codeSent', { phone: sentTo })}</p>
      <p
        className="rounded-xl bg-accent-soft px-3 py-2 text-center font-semibold tracking-[0.3em] text-accent-strong"
        dir="ltr"
        data-testid="demo-otp"
      >
        {t('demoCode', { code: DEMO_OTP })}
      </p>
      <label htmlFor="wallet-code" className={labelClass}>
        {t('code')}
      </label>
      <input
        id="wallet-code"
        className={`${controlClass} text-center tracking-[0.4em]`}
        inputMode="numeric"
        dir="ltr"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
      />
      {error && <FormError message={error} />}
      <Button
        variant="give"
        size="lg"
        className="w-full"
        disabled={pending}
        data-testid="demo-pay"
        onClick={() => {
          if (code !== DEMO_OTP) return setError(t('wrongCode'));
          setError(undefined);
          onPay();
        }}
      >
        {pending ? '…' : t('confirm', { amount: amountLabel })}
      </Button>
      <button
        type="button"
        className="w-full text-sm font-medium text-accent hover:underline"
        onClick={() => {
          setSentTo(null);
          setCode('');
        }}
      >
        {t('changePhone')}
      </button>
    </div>
  );
}

function CardForm({ amountLabel, pending, onPay }: StepProps) {
  const t = useTranslations('donate.card');
  const field = (id: string, label: string, value: string) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        className={`${controlClass} bg-surface-muted`}
        dir="ltr"
        value={value}
        readOnly
      />
    </div>
  );
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-warning">{t('testNote')}</p>
      {field('card-number', t('number'), TEST_CARD)}
      <div className="grid grid-cols-2 gap-3">
        {field('card-expiry', t('expiry'), '12 / 30')}
        {field('card-cvc', t('cvc'), '123')}
      </div>
      {field('card-holder', t('holder'), t('holderValue'))}
      <Button
        variant="give"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={onPay}
        data-testid="demo-pay"
      >
        {pending ? '…' : t('pay', { amount: amountLabel })}
      </Button>
    </div>
  );
}

function PaypalApprove({ amountLabel, pending, onPay }: StepProps) {
  const t = useTranslations('donate.paypal');
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border px-4 py-3">
        <p className="text-xs text-muted">{t('signedIn')}</p>
        <p className="font-medium" dir="ltr">
          demo.donor@example.com
        </p>
      </div>
      <dl className="flex items-baseline justify-between gap-3 text-sm">
        <dt className="text-muted">{t('payTo')}</dt>
        <dd className="font-semibold">{t('merchant')}</dd>
      </dl>
      <Button
        variant="give"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={onPay}
        data-testid="demo-pay"
      >
        {pending ? '…' : t('approve', { amount: amountLabel })}
      </Button>
    </div>
  );
}
