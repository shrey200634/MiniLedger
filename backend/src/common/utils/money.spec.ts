import { Prisma } from '../../generated/prisma/client';
import { isValidAmount, toMoneyString } from './money';

describe('isValidAmount [U-MONEY-01]', () => {
  it.each(['1', '1500.5', '99999999.99', '0.01'])('accepts %p', (value) => {
    expect(isValidAmount(value)).toBe(true);
  });

  it.each(['0', '0.00', '-5', '1.234', 'abc', '1e3', '100000000', ''])(
    'rejects %p',
    (value) => {
      expect(isValidAmount(value)).toBe(false);
    },
  );

  it('rejects a JSON number', () => {
    expect(isValidAmount(1500)).toBe(false);
  });
});

describe('toMoneyString [U-MONEY-02]', () => {
  it('formats whole numbers with two decimals', () => {
    expect(toMoneyString('1500')).toBe('1500.00');
  });

  it('adds decimals exactly (0.1 + 0.2 = 0.30)', () => {
    const sum = new Prisma.Decimal('0.1').plus(new Prisma.Decimal('0.2'));
    expect(toMoneyString(sum)).toBe('0.30');
  });
});
