import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../messages/ar.json';
import type { CurrentUser, Role } from '@/shared';
import { StoreProvider } from '@/store/StoreProvider';
import { InstallPrompt } from './InstallPrompt';

const user = (role: Role): CurrentUser => ({
  id: 'u1',
  fullName: 'x',
  phone: '+963900000000',
  role,
  locale: 'ar',
  donorCode: 'D-000006',
});

function renderPrompt(initialUser: CurrentUser | null) {
  return render(
    <NextIntlClientProvider locale="ar" messages={messages}>
      <StoreProvider initialUser={initialUser}>
        <InstallPrompt />
      </StoreProvider>
    </NextIntlClientProvider>,
  );
}

function offerInstall() {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome: 'accepted' as const }),
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

describe('InstallPrompt (donor PWA install)', () => {
  afterEach(() => window.localStorage.clear());

  it('shows nothing until the browser offers to install', () => {
    renderPrompt(null);
    expect(screen.queryByTestId('install-prompt')).toBeNull();
  });

  it('offers guests and donors to install, and installs on tap', async () => {
    renderPrompt(user('DONOR'));
    const event = offerInstall();
    expect(event.defaultPrevented).toBe(true);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'تثبيت' }));
    });
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('install-prompt')).toBeNull();
  });

  it('never shows to staff', () => {
    renderPrompt(user('FINANCE_VERIFIER'));
    offerInstall();
    expect(screen.queryByTestId('install-prompt')).toBeNull();
  });

  it('"not now" hides it and keeps it hidden on the next offer', () => {
    renderPrompt(null);
    offerInstall();
    fireEvent.click(screen.getByRole('button', { name: 'ليس الآن' }));
    expect(screen.queryByTestId('install-prompt')).toBeNull();
    offerInstall();
    expect(screen.queryByTestId('install-prompt')).toBeNull();
  });
});
