/** Field names that identify a person. None may ever appear in a public response. */
export const IDENTITY_FIELDS = [
  'fullName',
  'phone',
  'nationalIdHash',
  'nationalIdLast4',
  'localCouncil',
  'otherPrograms',
  'donorName',
  'donorPhone',
  'passwordHash',
  'email',
] as const;

/** Every identity field name found anywhere in `value` (recursively), as `path.key`. */
export function findIdentityFields(value: unknown, path = '$'): string[] {
  if (Array.isArray(value))
    return value.flatMap((v, i) => findIdentityFields(v, `${path}[${i}]`));
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, v]) => [
    ...((IDENTITY_FIELDS as readonly string[]).includes(key) ? [`${path}.${key}`] : []),
    ...findIdentityFields(v, `${path}.${key}`),
  ]);
}
