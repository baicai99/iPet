import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requestContext } from './request-context';

const normalizeHeaderValue = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const isSafeRequestId = (requestId: string): boolean => {
  if (requestId.length < 8 || requestId.length > 128) {
    return false;
  }
  return /^[a-zA-Z0-9._:-]+$/.test(requestId);
};

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void): void {
    const incoming = normalizeHeaderValue(req.headers['x-request-id']);
    const requestId = incoming && isSafeRequestId(incoming) ? incoming : uuidv4();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    requestContext.run({ requestId }, () => next());
  }
}

