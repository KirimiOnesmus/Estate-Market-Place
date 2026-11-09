const prisma = require('../db/prisma');
const { HttpError, asyncHandler } = require('../http/errors');
const { hashToken, safeEqual } = require('../security/tokens');

const SESSION_COOKIE = 'pavilion_session';
const CSRF_COOKIE = 'pavilion_csrf';

function cookieValue(req, name) {
  const cookieHeader = req.get('cookie') || '';
  const entry = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!entry) return null;
  try { return decodeURIComponent(entry.slice(name.length + 1)); } catch { return null; }
}

function cookieOptions(maxAge) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge };
}

function clearSessionCookies(res) {
  const secure = process.env.NODE_ENV === 'production';
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure, sameSite: 'strict', path: '/' });
  res.clearCookie(CSRF_COOKIE, { httpOnly: false, secure, sameSite: 'strict', path: '/' });
}

const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = cookieValue(req, SESSION_COOKIE);
  if (!token) throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in to continue.');

  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true, membership: { include: { estate: true } }, estate: true },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== 'ACTIVE') {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
  }

  const isSuperAdmin = session.user.platformRole === 'SUPER_ADMIN';
  const authEndpoint = req.baseUrl === '/api/v1/auth' && ['/me', '/logout'].includes(req.path);
  if (!isSuperAdmin && !authEndpoint) {
    const settings = await prisma.platformSetting.findUnique({ where: { id: 'default' }, select: { maintenanceMode: true } });
    if (settings?.maintenanceMode) throw new HttpError(503, 'MAINTENANCE_MODE', 'The platform is temporarily unavailable for planned maintenance. Please try again later.');
  }
  const estate = isSuperAdmin ? session.estate : session.membership?.estate;
  const membership = isSuperAdmin ? null : session.membership;
  const role = isSuperAdmin ? 'SUPER_ADMIN' : membership?.role;
  if (!isSuperAdmin && (!membership || membership.status !== 'ACTIVE' || estate?.accessStatus !== 'ACTIVE')) {
    throw new HttpError(403, 'ACCESS_SUSPENDED', 'This estate account cannot access the service.');
  }
  if (isSuperAdmin && session.estateId && !estate) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
  }
  if (session.user.mustResetPassword && !authEndpoint) {
    throw new HttpError(403, 'PASSWORD_SETUP_REQUIRED', 'Complete password setup before using estate services.');
  }

  req.auth = {
    session,
    user: session.user,
    membership,
    estate,
    role,
  };
  next();
});

function requireSuperAdminForEstate(req, _res, next) {
  if (!['SUPER_ADMIN', 'ESTATE_ADMIN'].includes(req.auth.role)) {
    return next(new HttpError(403, 'FORBIDDEN', 'Estate administrator access is required.'));
  }
  if (!req.auth.estate) {
    return next(new HttpError(403, 'ESTATE_CONTEXT_REQUIRED', 'Sign in with an estate selected to continue.'));
  }
  next();
}

function requireSuperAdmin(req, _res, next) {
  if (req.auth.role !== 'SUPER_ADMIN') {
    return next(new HttpError(403, 'FORBIDDEN', 'Super Admin access is required.'));
  }
  next();
}

function requireCsrf(req, _res, next) {
  const cookieToken = cookieValue(req, CSRF_COOKIE);
  const headerToken = req.get('x-csrf-token');
  const storedHash = req.auth.session.csrfTokenHash;
  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken) || !safeEqual(hashToken(cookieToken), storedHash)) {
    return next(new HttpError(403, 'CSRF_INVALID', 'Refresh the page and try again.'));
  }
  next();
}

module.exports = { SESSION_COOKIE, CSRF_COOKIE, cookieValue, cookieOptions, clearSessionCookies, requireAuth, requireSuperAdmin, requireSuperAdminForEstate, requireCsrf };
