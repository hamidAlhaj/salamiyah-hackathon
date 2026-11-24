'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ActionForm } from '@/components/forms/ActionForm';
import { Field } from '@/components/ui/Field';
import { createUserAction, updateUserAction } from '@/lib/actions/users';
import type { AdminUser } from '@/lib/types/staff';
import { LIMITS, ROLES, type Role } from '@/shared';

export interface PointOption {
  id: string;
  name: string;
  area: string;
  isActive: boolean;
}

/**
 * Create (no `user`) or edit an account. The collection-point checklist only appears for the
 * COLLECTOR role; the API refuses points for any other role. The role select is uncontrolled
 * (React resets action forms to their defaults); the page keys edit forms by the saved values so a
 * saved change remounts them with fresh defaults.
 */
export function UserForm({
  user,
  points,
  isSelf = false,
}: {
  user?: AdminUser;
  points: PointOption[];
  isSelf?: boolean;
}) {
  const t = useTranslations('adminSetup');
  const tRoles = useTranslations('roles');
  const tCommon = useTranslations('common');
  const editing = Boolean(user);
  const prefix = user ? `user-${user.id}` : 'user-new';
  const [role, setRole] = useState<Role>(user?.role ?? 'COLLECTOR');
  const assigned = new Set(user?.collectionPoints.map((p) => p.id));

  return (
    <ActionForm
      action={editing ? updateUserAction : createUserAction}
      submitLabel={editing ? tCommon('save') : t('users.add')}
      pendingLabel={tCommon('saving')}
      resetOnSuccess={!editing}
      // React resets the form fields after an action; keep the checklist in step with the select.
      onResult={(state) => {
        if (state.ok && !editing) setRole('COLLECTOR');
      }}
      testId={editing ? 'user-edit-form' : 'user-create-form'}
    >
      {user && <input type="hidden" name="id" value={user.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${prefix}-name`}
          label={t('users.fullName')}
          name="fullName"
          required
          minLength={3}
          maxLength={120}
          defaultValue={user?.fullName}
          autoComplete="off"
        />
        {!editing && (
          <Field
            id={`${prefix}-phone`}
            label={t('users.phone')}
            name="phone"
            type="tel"
            dir="ltr"
            required
            autoComplete="off"
          />
        )}
        {!editing && (
          <Field
            id={`${prefix}-password`}
            label={t('users.password')}
            name="password"
            type="password"
            dir="ltr"
            required
            minLength={LIMITS.passwordMinLength}
            hint={t('users.passwordHint')}
            autoComplete="new-password"
          />
        )}
        <Field
          as="select"
          id={`${prefix}-role`}
          label={t('users.role')}
          name="role"
          defaultValue={user?.role ?? 'COLLECTOR'}
          disabled={isSelf}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {tRoles(r)}
            </option>
          ))}
        </Field>
      </div>

      {role === 'COLLECTOR' && (
        <fieldset data-testid="user-points">
          <legend className="text-sm font-medium">{t('users.points')}</legend>
          <p className="mt-0.5 text-xs text-muted">{t('users.pointsHint')}</p>
          {points.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t('users.noPoints')}</p>
          ) : (
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {points.map((p) => (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm transition hover:border-brand-600 has-[:checked]:border-brand-600 has-[:checked]:bg-accent-soft">
                    <input
                      type="checkbox"
                      name="collectionPointIds"
                      value={p.id}
                      defaultChecked={assigned.has(p.id)}
                      className="mt-0.5 h-4 w-4 accent-brand-700"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium">{p.name}</span>
                      <span className="block text-xs text-muted">
                        {p.area}
                        {!p.isActive && ` (${t('inactive')})`}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      )}
    </ActionForm>
  );
}
