import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../messages/ar.json';
import type { AllocationPreview } from '@/shared';
import { AllocationNotice } from './AllocationNotice';

const preview = (over: Partial<AllocationPreview>): AllocationPreview => ({
  campaignId: 'c1',
  currency: 'SYP',
  capped: true,
  offered: '50000.00',
  remaining: '30000.00',
  campaignShare: '30000.00',
  surplus: '20000.00',
  state: 'SURPLUS',
  fund: { id: 'f1', slug: 'general-fund', title: 'صندوق المجلس العام' },
  ...over,
});

function renderNotice(p: AllocationPreview) {
  const onChoose = vi.fn();
  const onCancel = vi.fn();
  render(
    <NextIntlClientProvider locale="ar" messages={messages}>
      <AllocationNotice
        preview={p}
        money={(v) => `${Number(v)} ل.س`}
        pending={false}
        onChoose={onChoose}
        onCancel={onCancel}
      />
    </NextIntlClientProvider>,
  );
  return { onChoose, onCancel };
}

describe('AllocationNotice (docs/fund-contract.md)', () => {
  it('surplus: shows the split and asks before anything is recorded', () => {
    const { onChoose, onCancel } = renderNotice(preview({}));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveFocus();
    expect(dialog.textContent).toContain('30000 ل.س');
    expect(dialog.textContent).toContain('20000 ل.س');
    fireEvent.click(screen.getByTestId('allocation-split'));
    expect(onChoose).toHaveBeenCalledWith('SPLIT');
    fireEvent.click(screen.getByTestId('allocation-remaining'));
    expect(onChoose).toHaveBeenCalledWith('REMAINING_ONLY');
    fireEvent.click(screen.getByTestId('allocation-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('complete: no "remaining only" choice, the fund keeps the same amount', () => {
    renderNotice(
      preview({ state: 'COMPLETE', remaining: '0.00', campaignShare: '0.00', surplus: '50000.00' }),
    );
    expect(screen.queryByTestId('allocation-remaining')).toBeNull();
    expect(screen.getByTestId('allocation-to-fund').getAttribute('href')).toBe(
      '/campaigns/general-fund/donate?amount=50000',
    );
  });
});
