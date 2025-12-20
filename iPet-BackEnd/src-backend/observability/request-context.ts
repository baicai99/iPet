import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  requestId: string;
};

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export const getRequestId = (): string | undefined => requestContext.getStore()?.requestId;

