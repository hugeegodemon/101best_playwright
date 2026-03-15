import path from 'path';
import { ENV } from '../../../utils/env';

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-z0-9_-]/gi, '_');
}

export function boSmokeAuthFile(): string {
  const account = sanitizeSegment(ENV.SBO_SMOKE_ACCOUNT || 'default');
  return path.resolve(process.cwd(), 'playwright/.auth', `bo-smoke-${account}.json`);
}
