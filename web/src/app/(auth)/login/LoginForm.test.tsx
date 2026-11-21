import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../../messages/ar.json';
import { LoginForm } from './LoginForm';

const loginAction = vi.fn();
vi.mock('@/lib/actions/auth', () => ({
  loginAction: (...args: unknown[]) => loginAction(...args),
}));

function renderForm() {
  return render(
    <NextIntlClientProvider locale="ar" messages={messages}>
      <LoginForm />
    </NextIntlClientProvider>,
  );
}

describe('LoginForm', () => {
  beforeEach(() => loginAction.mockReset());

  it('labels both fields in Arabic and keeps the phone and password left-to-right', () => {
    renderForm();
    expect(screen.getByLabelText('رقم الهاتف')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByLabelText('كلمة المرور')).toHaveAttribute('type', 'password');
  });

  it('sends phone and password to the Server Action and shows the error it returns', async () => {
    loginAction.mockResolvedValue({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة.' });
    renderForm();

    fireEvent.change(screen.getByLabelText('رقم الهاتف'), { target: { value: '0944123456' } });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'wrong-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'رقم الهاتف أو كلمة المرور غير صحيحة.',
    );
    await waitFor(() => expect(loginAction).toHaveBeenCalledTimes(1));
    const formData = loginAction.mock.calls[0][1] as FormData;
    expect(formData.get('phone')).toBe('0944123456');
    expect(formData.get('password')).toBe('wrong-pass');
  });
});
