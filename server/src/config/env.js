const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().url().startsWith('postgresql://').or(z.string().url().startsWith('postgres://')),
  COMMUNICATIONS_ENCRYPTION_KEY: z.string().optional().default(''),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues.map(({ path, message }) => `${path.join('.')}: ${message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${details}`);
}

module.exports = result.data;
