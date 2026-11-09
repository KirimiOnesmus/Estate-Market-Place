const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const prisma = require('../../db/prisma');
const { HttpError, asyncHandler, validate } = require('../../http/errors');
const { clearSessionCookies, cookieOptions, requireAuth, requireCsrf, requireSuperAdmin, SESSION_COOKIE, CSRF_COOKIE } = require('../../middleware/auth');
const { hashPassword, verifyPassword } = require('../../security/passwords');
const { createToken, hashToken } = require('../../security/tokens');

const router = Router();
const sessionTtlMs = 8 * 60 * 60 * 1000;
const loginLimit = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });
const setupLimit = rateLimit({ windowMs: 15 * 60_000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false });
const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200),
}).strict();
const selectEstateSchema = z.object({ estateId: z.string().uuid() }).strict();
const setupPasswordSchema = z.object({ password: z.string().min(14).max(200) }).strict();

function setupTokenHash(value) {
  const parsed = z.string().regex(/^[A-Za-z0-9_-]{40,50}$/).safeParse(value);
  if (!parsed.success) throw new HttpError(404, 'SETUP_LINK_INVALID', 'This password setup link is invalid or expired.');
  return hashToken(parsed.data);
}

router.post('/login', loginLimit, validate(loginSchema), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  const passwordMatches = await verifyPassword(req.body.password, user?.passwordHash);
  if (!user || user.status !== 'ACTIVE' || !user.passwordHash || !passwordMatches) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  let membership = null;
  let estate = null;
  let role;
  if (user.platformRole === 'SUPER_ADMIN') {
    role = 'SUPER_ADMIN';
  } else {
    const memberships = await prisma.estateMembership.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        estate: { accessStatus: 'ACTIVE' },
      },
      include: { estate: { select: { id: true, name: true, location: true, logo: true } } },
      orderBy: { createdAt: 'asc' },
    });
    if (!memberships.length) throw new HttpError(403, 'NO_ACTIVE_MEMBERSHIP', 'No active estate membership is available for this account.');
    if (memberships.length > 1) {
      throw new HttpError(409, 'AMBIGUOUS_ESTATE_MEMBERSHIP', 'This account is linked to more than one active estate. Contact your estate administrator to resolve the account before signing in.');
    }
    membership = memberships[0];
    estate = membership.estate;
    role = membership.role;
  }

  const sessionToken = createToken();
  const csrfToken = createToken();
  const expiresAt = new Date(Date.now() + sessionTtlMs);
  await prisma.authSession.create({
    data: {
      userId: user.id,
      estateId: estate?.id || null,
      membershipId: membership?.id || null,
      tokenHash: hashToken(sessionToken),
      csrfTokenHash: hashToken(csrfToken),
      expiresAt,
    },
  });

  res.cookie(SESSION_COOKIE, sessionToken, cookieOptions(sessionTtlMs));
  res.cookie(CSRF_COOKIE, csrfToken, { ...cookieOptions(sessionTtlMs), httpOnly: false });
  res.json({ data: {
    user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone },
    estate: estate ? { id: estate.id, name: estate.name, location: estate.location, logo: estate.logo || null } : null,
    role,
    mustResetPassword: user.mustResetPassword,
    csrfToken,
  }, requestId: req.id });
}));

router.get('/me', requireAuth, (req, res) => {
  const { user, estate, role } = req.auth;
  res.json({ data: {
    user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone },
    estate: estate ? { id: estate.id, name: estate.name, location: estate.location, logo: estate.logo || null } : null,
    role,
    mustResetPassword: user.mustResetPassword,
  }, requestId: req.id });
});

router.get('/setup-password/:token', setupLimit, asyncHandler(async (req, res) => {
  const challenge = await prisma.passwordChallenge.findUnique({
    where: { tokenHash: setupTokenHash(req.params.token) },
    include: { user: { select: { email: true, status: true } } },
  });
  if (!challenge || challenge.purpose !== 'INITIAL_PASSWORD' || challenge.usedAt || challenge.expiresAt <= new Date() || challenge.user.status !== 'ACTIVE') {
    throw new HttpError(404, 'SETUP_LINK_INVALID', 'This password setup link is invalid or expired.');
  }
  res.json({ data: { email: challenge.user.email, expiresAt: challenge.expiresAt }, requestId: req.id });
}));

router.post('/setup-password/:token', setupLimit, validate(setupPasswordSchema), asyncHandler(async (req, res) => {
  const tokenHash = setupTokenHash(req.params.token);
  const challenge = await prisma.passwordChallenge.findUnique({ where: { tokenHash } });
  if (!challenge || challenge.purpose !== 'INITIAL_PASSWORD' || challenge.usedAt || challenge.expiresAt <= new Date()) {
    throw new HttpError(404, 'SETUP_LINK_INVALID', 'This password setup link is invalid or expired.');
  }
  const passwordHash = await hashPassword(req.body.password);
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordChallenge.updateMany({
      where: { id: challenge.id, purpose: 'INITIAL_PASSWORD', usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) throw new HttpError(404, 'SETUP_LINK_INVALID', 'This password setup link is invalid or expired.');
    const user = await tx.user.findUnique({ where: { id: challenge.userId }, select: { status: true } });
    if (!user || user.status !== 'ACTIVE') throw new HttpError(403, 'ACCOUNT_INACTIVE', 'This account is not active.');
    await tx.user.update({ where: { id: challenge.userId }, data: { passwordHash, mustResetPassword: false } });
  });
  res.json({ data: { passwordSet: true }, requestId: req.id });
}));

router.post('/select-estate', requireAuth, requireSuperAdmin, requireCsrf, validate(selectEstateSchema), asyncHandler(async (req, res) => {
  const estate = await prisma.estate.findUnique({ where: { id: req.body.estateId }, select: { id: true, name: true, location: true, logo: true } });
  if (!estate) throw new HttpError(404, 'ESTATE_NOT_FOUND', 'Estate not found.');

  const sessionToken = createToken();
  const csrfToken = createToken();
  const expiresAt = new Date(Date.now() + sessionTtlMs);
  await prisma.$transaction([
    prisma.authSession.update({ where: { id: req.auth.session.id }, data: { revokedAt: new Date() } }),
    prisma.authSession.create({ data: {
      userId: req.auth.user.id,
      estateId: estate.id,
      tokenHash: hashToken(sessionToken),
      csrfTokenHash: hashToken(csrfToken),
      expiresAt,
    } }),
  ]);
  res.cookie(SESSION_COOKIE, sessionToken, cookieOptions(sessionTtlMs));
  res.cookie(CSRF_COOKIE, csrfToken, { ...cookieOptions(sessionTtlMs), httpOnly: false });
  res.json({ data: {
    user: { id: req.auth.user.id, fullName: req.auth.user.fullName, email: req.auth.user.email, phone: req.auth.user.phone },
    estate,
    role: 'SUPER_ADMIN',
    mustResetPassword: req.auth.user.mustResetPassword,
    csrfToken,
  }, requestId: req.id });
}));

router.post('/logout', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  await prisma.authSession.update({ where: { id: req.auth.session.id }, data: { revokedAt: new Date() } });
  clearSessionCookies(res);
  res.json({ data: { loggedOut: true }, requestId: req.id });
}));

module.exports = router;
