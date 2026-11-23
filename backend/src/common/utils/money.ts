import { Prisma } from '@prisma/client';

export function toDecimal(value: string | number | Prisma.Decimal): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

/** نص عشري ثابت للـAPI (لا نرسل Decimal كـnumber حتى لا نفقد الدقة). */
export function money(value: Prisma.Decimal | null | undefined): string {
  return (value ?? new Prisma.Decimal(0)).toFixed(2);
}
