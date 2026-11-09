require('dotenv').config();
require('../src/config/database-url')();

const prisma = require('../src/db/prisma');
const { hashPassword } = require('../src/security/passwords');

async function main() {
  const required = ['BOOTSTRAP_ADMIN_NAME', 'BOOTSTRAP_ADMIN_EMAIL', 'BOOTSTRAP_ADMIN_PHONE', 'BOOTSTRAP_ADMIN_PASSWORD'];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) throw new Error(`Set the required bootstrap values in server/.env: ${missing.join(', ')}`);

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase();
  const phone = process.env.BOOTSTRAP_ADMIN_PHONE.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (password.length < 14) throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 14 characters.');

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const existingSuperAdmin = await tx.user.findFirst({ where: { platformRole: 'SUPER_ADMIN' }, select: { id: true } });
    if (existingSuperAdmin) throw new Error('A Super Admin already exists; bootstrap stopped.');

    const conflictingUser = await tx.user.findFirst({ where: { OR: [{ email }, { phone }] }, select: { id: true } });
    if (conflictingUser) throw new Error('The bootstrap email or phone is already attached to an account.');

    const user = await tx.user.create({ data: {
      fullName: process.env.BOOTSTRAP_ADMIN_NAME.trim(),
      email,
      phone,
      passwordHash,
      platformRole: 'SUPER_ADMIN',
      mustResetPassword: false,
    } });
    await tx.auditEvent.create({ data: {
      scope: 'PLATFORM', actorUserId: user.id, action: 'SUPER_ADMIN_BOOTSTRAPPED',
      entityType: 'User', entityId: user.id, metadata: {},
    } });
  });

  console.log('Super Admin created. Remove BOOTSTRAP_ADMIN_PASSWORD from server/.env after signing in.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
