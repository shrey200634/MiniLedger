import { ConfigService } from '@nestjs/config';
import { ClockService } from './clock.service';

// Same idea as the e2e FakeClock later: override now(), keep the real today() logic.
class FixedClock extends ClockService {
  constructor(private readonly instant: string) {
    super({ getOrThrow: () => 'Asia/Kolkata' } as unknown as ConfigService);
  }

  override now(): Date {
    return new Date(this.instant);
  }
}

describe('ClockService.today (Asia/Kolkata) [U-DATE-01]', () => {
  it('is still the previous IST day at 18:29:59Z', () => {
    expect(new FixedClock('2026-10-21T18:29:59Z').today()).toBe('2026-10-21');
  });

  it('is the next IST day at 18:30:00Z', () => {
    expect(new FixedClock('2026-10-21T18:30:00Z').today()).toBe('2026-10-22');
  });
});
