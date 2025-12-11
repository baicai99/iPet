import { isIP } from 'node:net';


const CONTROL_CHAR_REGEX = /[\u0000-\u001f\u007f]+/g;

const coerceString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (value == null) {
    return '';
  }
  return String(value);
};

export const sanitizeInput = (value: unknown): string => {
  const raw = coerceString(value);
  return raw.replace(CONTROL_CHAR_REGEX, '').trim();
};

export const normalizeEmail = (value: unknown): string => sanitizeInput(value).toLowerCase();

export const sanitizeCode = (value: unknown): string => sanitizeInput(value).replace(/\s+/g, '');

export const sanitizeIp = (value: unknown): string => {
  const input = coerceString(value);
  const candidate = input.split(',')[0]?.trim() ?? '';
  if (!candidate) {
    return 'unknown';
  }
  return isIP(candidate) ? candidate : 'unknown';
};
