import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Define environment variables schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('localhost'),
  PORT: z.coerce.number().default(3001),

  // Auth
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('1d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Redis configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6381),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TTL: z.coerce.number().default(300)
});

// Validate environment variables
const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Invalid environment variables:', env.error.format());
  throw new Error('Invalid environment variables');
}

// Export validated config
export const config = {
  nodeEnv: env.data.NODE_ENV,
  host: env.data.HOST,
  port: env.data.PORT,
  jwtSecret: env.data.JWT_SECRET,
  jwtExpiresIn: env.data.JWT_EXPIRES_IN,
  corsOrigin: env.data.CORS_ORIGIN,
  isDev: env.data.NODE_ENV === 'development',
  isProd: env.data.NODE_ENV === 'production',
  isTest: env.data.NODE_ENV === 'test',
  redis: {
    host: env.data.REDIS_HOST,
    port: env.data.REDIS_PORT,
    password: env.data.REDIS_PASSWORD,
    ttl: env.data.REDIS_TTL
  }
};