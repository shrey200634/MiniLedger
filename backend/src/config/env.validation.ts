import { Logger } from '@nestjs/common';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MinLength,
  Validate,
  validateSync,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isIanaTimeZone', async: false })
class IsIanaTimeZoneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || value.length === 0) {
      return false;
    }
    try {
      return (
        new Intl.DateTimeFormat('en-CA', { timeZone: value }).resolvedOptions()
          .timeZone.length > 0
      );
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'APP_TIMEZONE must be a valid IANA time zone (e.g. Asia/Kolkata)';
  }
}

export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  // Only needed to run the e2e tests, so optional at runtime.
  @IsOptional()
  @IsString()
  TEST_DATABASE_URL?: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters' })
  JWT_SECRET!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  JWT_EXPIRES_IN_SECONDS!: number;

  @IsString()
  @MinLength(32, { message: 'OTP_HMAC_SECRET must be at least 32 characters' })
  OTP_HMAC_SECRET!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  OTP_TTL_SECONDS!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  OTP_MAX_ATTEMPTS!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  OTP_RESEND_COOLDOWN_SECONDS!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  OTP_MAX_REQUESTS_PER_HOUR!: number;

  @IsIn(['console'])
  OTP_DELIVERY!: string;

  @Validate(IsIanaTimeZoneConstraint)
  APP_TIMEZONE!: string;

  @Matches(/^[A-Z]{2}$/, {
    message: 'DEFAULT_PHONE_REGION must be a 2-letter country code (e.g. IN)',
  })
  DEFAULT_PHONE_REGION!: string;

  // Optional (receipt upload bonus)
  @IsOptional()
  @IsString()
  RECEIPT_STORAGE_DIR?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  RECEIPT_MAX_BYTES?: number;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(validated);

  if (errors.length > 0) {
    // Only messages are printed, never the values (they may be secrets).
    const lines = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}).map((message) => `  - ${message}`),
    );
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }

  if (
    validated.NODE_ENV === 'production' &&
    validated.OTP_DELIVERY === 'console'
  ) {
    new Logger('Config').warn(
      'OTP_DELIVERY=console in production: OTPs are printed to the server log. Demo only!',
    );
  }

  return validated;
}
