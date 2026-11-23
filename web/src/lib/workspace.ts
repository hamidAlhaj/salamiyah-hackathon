import type { Role } from '@/shared';

/**
 * The staff workspace pages and the roles that use them (the API still enforces every rule).
 * `section: 'setup'` groups the ADMIN reference-data screens under their own heading.
 */
export const WORKSPACE_LINKS = [
  { key: 'home', href: '/dashboard', roles: null },
  { key: 'donations', href: '/dashboard/donations', roles: ['DONOR'] },
  { key: 'profile', href: '/dashboard/profile', roles: ['DONOR'] },
  { key: 'categories', href: '/dashboard/admin/categories', roles: ['ADMIN'] },
  { key: 'campaigns', href: '/dashboard/admin/campaigns', roles: ['ADMIN'] },
  { key: 'newCampaign', href: '/dashboard/admin/campaigns/new', roles: ['ADMIN'] },
  { key: 'intake', href: '/dashboard/intake', roles: ['STAFF', 'ADMIN'] },
  { key: 'cases', href: '/dashboard/cases', roles: ['STAFF', 'CASE_OFFICER', 'ADMIN'] },
  { key: 'finance', href: '/dashboard/finance', roles: ['FINANCE_VERIFIER'] },
  { key: 'collector', href: '/dashboard/collector', roles: ['COLLECTOR'] },
  { key: 'spending', href: '/dashboard/spending', roles: ['FINANCE_VERIFIER', 'ADMIN'] },
  { key: 'beneficiaries', href: '/dashboard/admin/beneficiaries', roles: ['STAFF', 'ADMIN'] },
  { key: 'imports', href: '/dashboard/imports', roles: ['STAFF', 'ADMIN'] },
  { key: 'outbox', href: '/dashboard/outbox', roles: ['ADMIN'] },
  { key: 'notifications', href: '/dashboard/notifications', roles: null },
  { key: 'users', href: '/dashboard/admin/users', roles: ['ADMIN'], section: 'setup' },
  {
    key: 'collectionPoints',
    href: '/dashboard/admin/collection-points',
    roles: ['ADMIN'],
    section: 'setup',
  },
  { key: 'hospitals', href: '/dashboard/admin/hospitals', roles: ['ADMIN'], section: 'setup' },
  {
    key: 'paymentMethods',
    href: '/dashboard/admin/payment-methods',
    roles: ['ADMIN'],
    section: 'setup',
  },
] as const satisfies readonly {
  key: string;
  href: string;
  roles: readonly Role[] | null;
  section?: 'setup';
}[];

export type WorkspaceKey = (typeof WORKSPACE_LINKS)[number]['key'];

export function linksFor(role: Role) {
  return WORKSPACE_LINKS.filter(
    (l) => l.roles === null || (l.roles as readonly Role[]).includes(role),
  );
}

export function canUse(role: Role, key: WorkspaceKey): boolean {
  return linksFor(role).some((l) => l.key === key);
}
