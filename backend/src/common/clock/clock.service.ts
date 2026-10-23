import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toDateInTimeZone } from '../utils/dates';

@Injectable()
export class ClockService {
  private readonly timeZone: string;

  constructor(config: ConfigService) {
    this.timeZone = config.getOrThrow<string>('APP_TIMEZONE');
  }

  /** The current instant. The only place business code gets "now" from. */
  now(): Date {
    return new Date();
  }

  /** Today's calendar date (YYYY-MM-DD) in APP_TIMEZONE. */
  today(): string {
    return toDateInTimeZone(this.now(), this.timeZone);
  }
}
