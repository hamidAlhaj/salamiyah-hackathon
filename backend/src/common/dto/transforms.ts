import { normalizePhone, toLatinDigits } from '../shared';
import { Transform } from 'class-transformer';

/** يطبّع الهاتف (أرقام عربية، 09xx، 00963…) قبل الـvalidation. يبقي القيمة كما هي إن لم تكن صالحة ليرفضها @Matches. */
export const NormalizePhone = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? (normalizePhone(value) ?? value) : value,
  );

/** يحوّل المبلغ إلى نص عشري لاتيني بلا فواصل. */
export const NormalizeAmount = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' || typeof value === 'number'
      ? toLatinDigits(String(value)).replace(/[,\s٬]/g, '')
      : value,
  );

/** القيم القادمة من multipart تكون نصوصاً: "true" ← true. */
export const ToBoolean = (): PropertyDecorator =>
  Transform(
    ({ value }: { value: unknown }) => value === true || value === 'true' || value === '1',
  );

export const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
export const AMOUNT_REGEX = /^\d{1,12}(\.\d{1,2})?$/;
