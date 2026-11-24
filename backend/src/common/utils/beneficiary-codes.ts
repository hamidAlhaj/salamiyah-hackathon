import type { Prisma } from '@prisma/client';
import { newBeneficiaryCode } from './codes';

/**
 * `count` new public beneficiary codes (B-XXXX) that are unique within the batch and not yet used in
 * the database. Run it inside the same transaction that creates the beneficiaries.
 */
export async function allocateBeneficiaryCodes(
  tx: Prisma.TransactionClient,
  count: number,
): Promise<string[]> {
  const codes = new Set<string>();
  while (codes.size < count) {
    const batch = new Set<string>();
    while (batch.size < count - codes.size) {
      const code = newBeneficiaryCode();
      if (!codes.has(code)) batch.add(code);
    }
    const taken = await tx.beneficiary.findMany({
      where: { publicCode: { in: [...batch] } },
      select: { publicCode: true },
    });
    const takenSet = new Set(taken.map((t) => t.publicCode));
    for (const code of batch) if (!takenSet.has(code)) codes.add(code);
  }
  return [...codes];
}
