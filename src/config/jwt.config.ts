import { JwtModuleOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms';

export const jwtConfig = (): JwtModuleOptions => ({
  secret: process.env.JWT_SECRET || 'fallback-secret-change-in-prod',
  signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as StringValue },
});
