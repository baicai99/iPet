import { Injectable } from '@nestjs/common';
import { getRequestId } from './request-context';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

@Injectable()
export class ObservabilityLogger {
  private write(level: LogLevel, payload: Record<string, unknown>): void {
    const requestId = getRequestId();
    const body = {
      ts: new Date().toISOString(),
      level,
      ...(requestId ? { requestId } : {}),
      ...payload,
    };

    const line = JSON.stringify(body);
    if (level === 'error') {
      // eslint-disable-next-line no-console
      console.error(line);
      return;
    }
    if (level === 'warn') {
      // eslint-disable-next-line no-console
      console.warn(line);
      return;
    }
    // eslint-disable-next-line no-console
    console.log(line);
  }

  info(payload: Record<string, unknown>): void {
    this.write('info', payload);
  }

  warn(payload: Record<string, unknown>): void {
    this.write('warn', payload);
  }

  error(payload: Record<string, unknown>): void {
    this.write('error', payload);
  }
}

