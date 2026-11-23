import { hashNationalId } from '../common/utils/national-id';
import { suggestMapping } from './imports.service';
import { parseCsv } from './table-reader';

describe('parseCsv', () => {
  it('handles quotes, commas inside fields, CRLF and the ; separator', () => {
    expect(parseCsv('الاسم,الهاتف\r\n"أحمد, الخطيب",0944\r\n')).toEqual([
      ['الاسم', 'الهاتف'],
      ['أحمد, الخطيب', '0944'],
    ]);
    expect(parseCsv('a;b\n1;"x""y"')).toEqual([
      ['a', 'b'],
      ['1', 'x"y'],
    ]);
  });
});

describe('suggestMapping', () => {
  it('recognises common Arabic Excel headers', () => {
    expect(suggestMapping(['الاسم الكامل', 'الموبايل', 'الرقم الوطني', 'ملاحظات'])).toEqual({
      fullName: 'الاسم الكامل',
      phone: 'الموبايل',
      nationalId: 'الرقم الوطني',
    });
  });
});

describe('hashNationalId', () => {
  it('never stores the number in clear and hashes the same number the same way', () => {
    const a = hashNationalId('04010100201', 'k');
    expect(a.last4).toBe('0201');
    expect(a.hash).not.toBe('04010100201');
    expect(hashNationalId('040 101 00201', 'k').hash).toBe(a.hash);
  });
});
