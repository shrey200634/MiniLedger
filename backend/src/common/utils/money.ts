import { Prisma } from '../../generated/prisma/client';

/** 1-8 integer digits, optional 1-2 decimals. No sign, no exponent. */
export const AMOUNT_REGEX = /^\d{1,8}(\.\d{1,2})?$/;

/** True for a well-formed amount string that is greater than zero. */
export function isValidAmount(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    AMOUNT_REGEX.test(value) &&
    new Prisma.Decimal(value).gt(0)
  );
}

/** Serialize money as a string with exactly two decimals, e.g. "1500.00". */
export function toMoneyString(value: string | Prisma.Decimal): string {
  return new Prisma.Decimal(value).toFixed(2);
}
