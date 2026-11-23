import { describe, expect, it } from 'vitest';
import { categoryBeneficiaryKind } from './utils';

const category = (c: Partial<Parameters<typeof categoryBeneficiaryKind>[0]>) => ({
  requiresMedicalCase: false,
  supportsMonthlySponsorship: false,
  beneficiaryKind: null,
  ...c,
});

describe('categoryBeneficiaryKind (beneficiary picker filter)', () => {
  it('reads the behaviour flags first, never the category code', () => {
    expect(categoryBeneficiaryKind(category({ requiresMedicalCase: true }))).toBe('PATIENT');
    expect(categoryBeneficiaryKind(category({ supportsMonthlySponsorship: true }))).toBe('ORPHAN');
    expect(
      categoryBeneficiaryKind(
        category({ supportsMonthlySponsorship: true, beneficiaryKind: 'FAMILY' }),
      ),
    ).toBe('ORPHAN');
  });

  it('then the category data (FAMILY for home renovation), else any kind', () => {
    expect(categoryBeneficiaryKind(category({ beneficiaryKind: 'FAMILY' }))).toBe('FAMILY');
    expect(categoryBeneficiaryKind(category({}))).toBeNull();
  });
});
