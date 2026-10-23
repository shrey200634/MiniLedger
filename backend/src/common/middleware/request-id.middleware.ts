import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'X-Request-Id';

// Accept a client-supplied id only if it is short and made of safe characters.
const SANE_REQUEST_ID = /^[A-Za-z0-9._-]{8,64}$/;

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.header(REQUEST_ID_HEADER);
  const requestId =
    incoming !== undefined && SANE_REQUEST_ID.test(incoming)
      ? incoming
      : randomUUID();

  res.locals.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
