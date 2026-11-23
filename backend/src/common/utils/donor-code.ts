import type { Prisma } from '@prisma/client';
import { newDonorCode } from './codes';

/**
 * A donor code (D-XXXXXX) not yet used in the database. Every new account gets one (a staff member
 * can donate too); the unique index on users.donor_code is the final guard.
 */
export async function allocateDonorCode(tx: Prisma.TransactionClient): Promise<string> {
  for (;;) {
    const code = newDonorCode();
    const taken = await tx.user.findUnique({
      where: { donorCode: code },
      select: { id: true },
    });
    if (!taken) return code;
  }
}
