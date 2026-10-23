import { isValidCalendarDate, toUtcMidnight } from './dates';

describe('isValidCalendarDate [U-DATE-02]', () => {
  it.each([
    '2026-02-30',
    '2026-13-01',
    '2026-1-5',
    'tomorrow',
    '',
    '2026-10-22T00:00:00Z',
  ])('rejects %p', (value) => {
    expect(isValidCalendarDate(value)).toBe(false);
  });

  it.each(['2028-02-29', '2026-10-22', '2000-01-01'])('accepts %p', (value) => {
    expect(isValidCalendarDate(value)).toBe(true);
  });

  it('rejects 29 Feb in a non-leap year', () => {
    expect(isValidCalendarDate('2026-02-29')).toBe(false);
  });

  it('rejects non-strings', () => {
    expect(isValidCalendarDate(20261022)).toBe(false);
    expect(isValidCalendarDate(null)).toBe(false);
  });
});

describe('toUtcMidnight', () => {
  it('builds a UTC-midnight Date', () => {
    expect(toUtcMidnight('2026-10-22').toISOString()).toBe(
      '2026-10-22T00:00:00.000Z',
    );
  });
});
