const { Router } = require('express');
const { z } = require('zod');

const prisma = require('../../db/prisma');
const { HttpError, asyncHandler, validate } = require('../../http/errors');
const { requireAuth, requireCsrf, requireSuperAdmin } = require('../../middleware/auth');
const { createToken, hashToken } = require('../../security/tokens');
const { encryptSecret, notifyEstate, publicSettings } = require('../communications/service');

const router = Router();
const estateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(180),
  logo: z.string().max(3_000_000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/).nullable().optional(),
  billingStatus: z.enum(['UNCONFIGURED', 'CURRENT', 'PAST_DUE', 'UNDER_REVIEW']).optional(),
}).strict();
const estateParamsSchema = z.object({ estateId: z.string().uuid() }).strict();
const estateAccessSchema = z.object({ accessStatus: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']) }).strict();
const accountCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(32).nullable().optional(),
  estateId: z.string().uuid(),
}).strict();
const accountParamsSchema = z.object({ membershipId: z.string().uuid() }).strict();
const accountUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(32).nullable().optional(),
  role: z.enum(['RESIDENT', 'ESTATE_ADMIN', 'COMMITTEE_MEMBER', 'ACCOUNT_HOLDER']),
}).strict();
const accountAccessSchema = z.object({ status: z.enum(['ACTIVE', 'REMOVED']) }).strict();
const supportParamsSchema = z.object({ supportCaseId: z.string().uuid() }).strict();
const supportCreateSchema = z.object({
  subject: z.string().trim().min(5).max(160),
  description: z.string().trim().min(10).max(5000),
}).strict();
const supportUpdateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).optional(),
}).strict().refine((value) => Object.keys(value).length > 0);
const supportCommentSchema = z.object({ message: z.string().trim().min(1).max(3000) }).strict();
const platformSettingsSchema = z.object({
  platformName: z.string().trim().min(2).max(120),
  supportEmail: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  maintenanceMode: z.boolean(),
}).strict();
const communicationParamsSchema = z.object({ estateId: z.string().uuid() }).strict();
const communicationSettingsSchema = z.object({
  emailEnabled: z.boolean(), smtpHost: z.string().trim().max(255), smtpPort: z.number().int().min(1).max(65535), smtpSecure: z.boolean(), smtpUsername: z.string().trim().max(255), smtpPassword: z.string().max(500).optional().default(''), emailFromName: z.string().trim().max(120), emailFromAddress: z.string().trim().email().max(254).or(z.literal('')),
  whatsappEnabled: z.boolean(), whatsappPhoneNumberId: z.string().trim().max(120), whatsappAccessToken: z.string().max(3000).optional().default(''), whatsappApiVersion: z.string().regex(/^v\d+\.\d+$/), whatsappLanguage: z.string().trim().min(2).max(12), eventSettings: z.record(z.string(), z.object({ enabled: z.boolean().optional(), email: z.object({ enabled: z.boolean().optional(), subject: z.string().max(200).optional(), body: z.string().max(5000).optional() }).optional(), whatsapp: z.object({ enabled: z.boolean().optional(), templateName: z.string().regex(/^[a-z0-9_]{1,512}$/).optional(), language: z.string().max(12).optional() }).optional() }).strict()).default({}),
}).strict();

function membershipStatusLabel(status, userStatus) {
  if (userStatus !== 'ACTIVE') return userStatus === 'ARCHIVED' ? 'Archived' : 'Suspended';
  return ({ ACTIVE: 'Active', PENDING: 'Awaiting estate review', DECLINED: 'Declined', REMOVED: 'Revoked' })[status] || status;
}

function membershipRoleLabel(role) {
  return ({ RESIDENT: 'Resident', ESTATE_ADMIN: 'Estate Admin', COMMITTEE_MEMBER: 'Committee member', ACCOUNT_HOLDER: 'Account holder' })[role] || role;
}

function supportCaseDto(item) {
  return {
    id: item.id,
    subject: item.subject,
    description: item.description,
    priority: ({ LOW: 'Low', NORMAL: 'Normal', HIGH: 'High' })[item.priority],
    priorityValue: item.priority,
    status: ({ OPEN: 'Open', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved' })[item.status],
    statusValue: item.status,
    estate: item.estate?.name || 'Platform support',
    estateId: item.estateId,
    requester: item.requesterName,
    requesterEmail: item.requesterEmail,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    comments: item.comments.map((comment) => ({
      id: comment.id,
      author: comment.authorName,
      message: comment.message,
      createdAt: comment.createdAt,
    })),
  };
}

router.get('/platform/estates/:estateId/communications', requireAuth, requireSuperAdmin, validate(communicationParamsSchema, 'params'), asyncHandler(async (req, res) => {
  const estate = await prisma.estate.findUnique({ where: { id: req.params.estateId }, select: { id: true, name: true } });
  if (!estate) throw new HttpError(404, 'ESTATE_NOT_FOUND', 'Estate not found.');
  const settings = await prisma.estateCommunicationSetting.findUnique({ where: { estateId: estate.id } });
  res.json({ data: { estate, settings: settings ? publicSettings(settings) : null }, requestId: req.id });
}));

router.put('/platform/estates/:estateId/communications', requireAuth, requireSuperAdmin, requireCsrf, validate(communicationParamsSchema, 'params'), validate(communicationSettingsSchema), asyncHandler(async (req, res) => {
  const estate = await prisma.estate.findUnique({ where: { id: req.params.estateId }, select: { id: true } });
  if (!estate) throw new HttpError(404, 'ESTATE_NOT_FOUND', 'Estate not found.');
  if ((req.body.emailEnabled || req.body.whatsappEnabled) && !process.env.COMMUNICATIONS_ENCRYPTION_KEY) throw new HttpError(503, 'COMMUNICATIONS_ENCRYPTION_NOT_CONFIGURED', 'Set COMMUNICATIONS_ENCRYPTION_KEY in the server environment before enabling communications.');
  const existing = await prisma.estateCommunicationSetting.findUnique({ where: { estateId: estate.id } });
  const { smtpPassword, whatsappAccessToken, ...fields } = req.body;
  const settings = await prisma.estateCommunicationSetting.upsert({ where: { estateId: estate.id }, create: { ...fields, estateId: estate.id, smtpPasswordEncrypted: smtpPassword ? encryptSecret(smtpPassword) : null, whatsappAccessTokenEncrypted: whatsappAccessToken ? encryptSecret(whatsappAccessToken) : null }, update: { ...fields, ...(smtpPassword ? { smtpPasswordEncrypted: encryptSecret(smtpPassword) } : {}), ...(whatsappAccessToken ? { whatsappAccessTokenEncrypted: encryptSecret(whatsappAccessToken) } : {}) } });
  await prisma.auditEvent.create({ data: { scope: 'PLATFORM', actorUserId: req.auth.user.id, action: 'ESTATE_COMMUNICATION_SETTINGS_UPDATED', entityType: 'Estate', entityId: estate.id, requestId: req.id, metadata: { emailEnabled: settings.emailEnabled, whatsappEnabled: settings.whatsappEnabled } } });
  res.json({ data: publicSettings(settings), requestId: req.id });
}));

router.get('/estates', asyncHandler(async (req, res) => {
  const estates = await prisma.estate.findMany({
    where: { accessStatus: 'ACTIVE' },
    select: { id: true, name: true, location: true },
    orderBy: { name: 'asc' },
  });
  res.json({ data: estates, requestId: req.id });
}));

router.get('/platform/estates', requireAuth, requireSuperAdmin, asyncHandler(async (req, res) => {
  const estates = await prisma.estate.findMany({
    include: { memberships: {
      where: { status: 'ACTIVE' },
      select: { role: true, user: { select: { fullName: true, email: true } } },
    } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
  res.json({ data: estates.map(({ memberships, ...estate }) => ({
    ...estate,
    accountCount: memberships.length,
    administrator: memberships.find(({ role }) => role === 'ESTATE_ADMIN')?.user || null,
  })), requestId: req.id });
}));

router.get('/platform/overview', requireAuth, requireSuperAdmin, asyncHandler(async (req, res) => {
  const [estateCount, activeEstates, suspendedEstates, accountCount, activeAccounts, activeMemberships, pendingRegistrations, recentActivity] = await Promise.all([
    prisma.estate.count(),
    prisma.estate.count({ where: { accessStatus: 'ACTIVE' } }),
    prisma.estate.count({ where: { accessStatus: 'SUSPENDED' } }),
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.estateMembership.count({ where: { status: 'ACTIVE', estate: { is: { accessStatus: 'ACTIVE' } } } }),
    prisma.registrationRequest.count({ where: { status: 'PENDING' } }),
    prisma.auditEvent.findMany({
      where: { scope: 'PLATFORM' },
      include: { actorUser: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  res.json({ data: {
    metrics: { estateCount, activeEstates, suspendedEstates, accountCount, activeAccounts, activeMemberships, pendingRegistrations },
    recentActivity: recentActivity.map((event) => ({
      id: event.id,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      actor: event.actorUser?.fullName || event.actorUser?.email || 'System',
      createdAt: event.createdAt,
    })),
  }, requestId: req.id });
}));

router.get('/platform/settings', requireAuth, requireSuperAdmin, asyncHandler(async (req, res) => {
  const settings = await prisma.platformSetting.findUnique({ where: { id: 'default' } });
  res.json({ data: settings, requestId: req.id });
}));

router.put('/platform/settings', requireAuth, requireSuperAdmin, requireCsrf, validate(platformSettingsSchema), asyncHandler(async (req, res) => {
  const settings = await prisma.$transaction(async (tx) => {
    const updated = await tx.platformSetting.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...req.body, updatedByUserId: req.auth.user.id },
      update: { ...req.body, updatedByUserId: req.auth.user.id },
    });
    await tx.auditEvent.create({ data: {
      scope: 'PLATFORM', actorUserId: req.auth.user.id,
      action: 'PLATFORM_SETTINGS_UPDATED', entityType: 'PlatformSetting', requestId: req.id,
      metadata: { maintenanceMode: updated.maintenanceMode },
    } });
    return updated;
  });
  res.json({ data: settings, requestId: req.id });
}));

router.get('/platform/audit-events', requireAuth, requireSuperAdmin, asyncHandler(async (req, res) => {
  const events = await prisma.auditEvent.findMany({
    where: { scope: 'PLATFORM' },
    include: {
      actorUser: { select: { fullName: true, email: true } },
      estate: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  const estateIds = [...new Set(events.flatMap((event) => [
    event.estateId,
    event.entityType === 'Estate' ? event.entityId : null,
    event.metadata?.estateId,
  ]).filter(Boolean))];
  const membershipIds = [...new Set(events.filter((event) => event.entityType === 'EstateMembership').map((event) => event.entityId).filter(Boolean))];
  const userIds = [...new Set(events.filter((event) => event.entityType === 'User').map((event) => event.entityId).filter(Boolean))];
  const supportCaseIds = [...new Set(events.filter((event) => event.entityType === 'SupportCase').map((event) => event.entityId).filter(Boolean))];
  const [estates, memberships, users, supportCases] = await Promise.all([
    estateIds.length ? prisma.estate.findMany({ where: { id: { in: estateIds } }, select: { id: true, name: true } }) : [],
    membershipIds.length ? prisma.estateMembership.findMany({ where: { id: { in: membershipIds } }, include: { estate: { select: { name: true } }, user: { select: { fullName: true, email: true } } } }) : [],
    userIds.length ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true, email: true } }) : [],
    supportCaseIds.length ? prisma.supportCase.findMany({ where: { id: { in: supportCaseIds } }, select: { id: true, subject: true } }) : [],
  ]);
  const estateNames = new Map(estates.map((estate) => [estate.id, estate.name]));
  const membershipNames = new Map(memberships.map((membership) => [membership.id, `${membership.user.fullName || membership.user.email} · ${membership.estate.name} (${membershipRoleLabel(membership.role)})`]));
  const userNames = new Map(users.map((user) => [user.id, user.fullName || user.email || 'Platform user']));
  const supportCaseNames = new Map(supportCases.map((supportCase) => [supportCase.id, supportCase.subject]));
  res.json({ data: events.map((event) => ({
    id: event.id,
    action: event.action,
    actor: event.actorUser?.fullName || event.actorUser?.email || 'System',
    target: event.entityType === 'Estate' ? estateNames.get(event.entityId) || 'Estate workspace'
      : event.entityType === 'EstateMembership' ? membershipNames.get(event.entityId) || estateNames.get(event.metadata?.estateId) || 'Estate account'
        : event.entityType === 'User' ? userNames.get(event.entityId) || 'Platform account'
          : event.entityType === 'SupportCase' ? supportCaseNames.get(event.entityId) || 'Support request'
            : event.estate?.name || event.entityType.replaceAll(/([a-z])([A-Z])/g, '$1 $2'),
    type: event.entityType,
    createdAt: event.createdAt,
  })), requestId: req.id });
}));

router.get('/platform/support-cases', requireAuth, requireSuperAdmin, asyncHandler(async (req, res) => {
  const cases = await prisma.supportCase.findMany({
    include: {
      estate: { select: { name: true } },
      comments: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });
  res.json({ data: cases.map(supportCaseDto), requestId: req.id });
}));

router.post('/support-cases', requireAuth, requireCsrf, validate(supportCreateSchema), asyncHandler(async (req, res) => {
  const created = await prisma.$transaction(async (tx) => {
    const supportCase = await tx.supportCase.create({ data: {
      estateId: req.auth.estate?.id || null,
      requesterUserId: req.auth.user.id,
      requesterName: req.auth.user.fullName || req.auth.user.email || 'Account holder',
      requesterEmail: req.auth.user.email,
      subject: req.body.subject,
      description: req.body.description,
    }, include: { estate: { select: { name: true } }, comments: true } });
    await tx.auditEvent.create({ data: {
      scope: 'PLATFORM', estateId: req.auth.estate?.id || null, actorUserId: req.auth.user.id,
      action: 'SUPPORT_CASE_CREATED', entityType: 'SupportCase', entityId: supportCase.id,
      requestId: req.id, metadata: { subject: supportCase.subject },
    } });
    return supportCase;
  });
  if (created.estateId && created.requesterUserId) await notifyEstate(created.estateId, 'SUPPORT_CREATED', { title: 'Support request received', message: created.subject, linkPath: '/issues', userIds: [created.requesterUserId], roles: ['RESIDENT', 'COMMITTEE_MEMBER', 'ESTATE_ADMIN'] }).catch((error) => console.error('Could not queue support notification:', error.message));
  res.status(201).json({ data: supportCaseDto(created), requestId: req.id });
}));

router.patch('/platform/support-cases/:supportCaseId', requireAuth, requireSuperAdmin, requireCsrf, validate(supportParamsSchema, 'params'), validate(supportUpdateSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.supportCase.findUnique({ where: { id: req.params.supportCaseId } });
  if (!existing) throw new HttpError(404, 'SUPPORT_CASE_NOT_FOUND', 'Support case not found.');
  const updated = await prisma.$transaction(async (tx) => {
    const supportCase = await tx.supportCase.update({ where: { id: existing.id }, data: req.body, include: { estate: { select: { name: true } }, comments: { orderBy: { createdAt: 'asc' } } } });
    await tx.auditEvent.create({ data: {
      scope: 'PLATFORM', estateId: existing.estateId, actorUserId: req.auth.user.id,
      action: 'SUPPORT_CASE_UPDATED', entityType: 'SupportCase', entityId: existing.id,
      requestId: req.id, metadata: req.body,
    } });
    return supportCase;
  });
  if (existing.estateId && existing.requesterUserId) await notifyEstate(existing.estateId, 'SUPPORT_UPDATED', { title: 'Support request updated', message: `${updated.subject}: ${updated.status.replaceAll('_', ' ').toLowerCase()}`, linkPath: '/issues', userIds: [existing.requesterUserId], roles: ['RESIDENT', 'COMMITTEE_MEMBER', 'ESTATE_ADMIN'] }).catch((error) => console.error('Could not queue support update:', error.message));
  res.json({ data: supportCaseDto(updated), requestId: req.id });
}));

router.post('/platform/support-cases/:supportCaseId/comments', requireAuth, requireSuperAdmin, requireCsrf, validate(supportParamsSchema, 'params'), validate(supportCommentSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.supportCase.findUnique({ where: { id: req.params.supportCaseId }, select: { id: true, estateId: true, requesterUserId: true } });
  if (!existing) throw new HttpError(404, 'SUPPORT_CASE_NOT_FOUND', 'Support case not found.');
  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.supportComment.create({ data: {
      supportCaseId: existing.id,
      authorUserId: req.auth.user.id,
      authorName: req.auth.user.fullName || req.auth.user.email || 'Super Admin',
      message: req.body.message,
    } });
    await tx.supportCase.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });
    await tx.auditEvent.create({ data: {
      scope: 'PLATFORM', estateId: existing.estateId, actorUserId: req.auth.user.id,
      action: 'SUPPORT_CASE_COMMENTED', entityType: 'SupportCase', entityId: existing.id,
      requestId: req.id, metadata: {},
    } });
    return created;
  });
  if (existing.estateId && existing.requesterUserId) await notifyEstate(existing.estateId, 'SUPPORT_UPDATED', { title: 'New support reply', message: req.body.message, linkPath: '/issues', userIds: [existing.requesterUserId], roles: ['RESIDENT', 'COMMITTEE_MEMBER', 'ESTATE_ADMIN'] }).catch((error) => console.error('Could not queue support reply:', error.message));
  res.status(201).json({ data: { id: comment.id, author: comment.authorName, message: comment.message, createdAt: comment.createdAt }, requestId: req.id });
}));

router.get('/platform/accounts', requireAuth, requireSuperAdmin, asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    include: { memberships: { include: { estate: { select: { id: true, name: true } } } } },
    orderBy: [{ fullName: 'asc' }, { createdAt: 'desc' }],
  });
  const accounts = users.flatMap((user) => {
    if (user.platformRole === 'SUPER_ADMIN') return [{
      id: user.id, userId: user.id, membershipId: null,
      name: user.fullName || 'Super Admin', email: user.email, phone: user.phone,
      role: 'Super Admin', estateId: null, estate: 'Estate Market Place',
      accessStatus: user.status === 'ACTIVE' ? 'Active' : user.status === 'ARCHIVED' ? 'Archived' : 'Suspended',
      mustResetPassword: user.mustResetPassword, locked: true,
    }];
    return user.memberships.map((membership) => ({
      id: membership.id,
      userId: user.id,
      membershipId: membership.id,
      name: user.fullName || 'Unnamed account',
      email: user.email,
      phone: user.phone,
      role: membershipRoleLabel(membership.role),
      roleValue: membership.role,
      estateId: membership.estateId,
      estate: membership.estate.name,
      accessStatus: membershipStatusLabel(membership.status, user.status),
      membershipStatus: membership.status,
      userStatus: user.status,
      mustResetPassword: user.mustResetPassword,
      locked: false,
    }));
  });
  res.json({ data: accounts, requestId: req.id });
}));

router.post('/platform/accounts', requireAuth, requireSuperAdmin, requireCsrf, validate(accountCreateSchema), asyncHandler(async (req, res) => {
  const estate = await prisma.estate.findUnique({ where: { id: req.body.estateId }, select: { id: true, name: true, accessStatus: true } });
  if (!estate || estate.accessStatus !== 'ACTIVE') throw new HttpError(404, 'ESTATE_NOT_FOUND', 'Choose an active estate workspace.');
  const phone = req.body.phone || null;
  const existing = await prisma.user.findFirst({ where: { OR: [{ email: req.body.email }, ...(phone ? [{ phone }] : [])] }, select: { id: true } });
  if (existing) throw new HttpError(409, 'ACCOUNT_EXISTS', 'An account already uses this email address or phone number.');

  const token = createToken();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: {
      fullName: req.body.fullName,
      email: req.body.email,
      phone,
      mustResetPassword: true,
    } });
    const membership = await tx.estateMembership.create({ data: {
      userId: user.id,
      estateId: estate.id,
      role: 'ESTATE_ADMIN',
      status: 'ACTIVE',
      approvedById: req.auth.user.id,
      approvedAt: new Date(),
    } });
    await tx.passwordChallenge.create({ data: {
      userId: user.id,
      tokenHash: hashToken(token),
      purpose: 'INITIAL_PASSWORD',
      expiresAt,
    } });
    await tx.auditEvent.create({ data: {
      scope: 'PLATFORM', actorUserId: req.auth.user.id, action: 'ESTATE_ADMIN_CREATED',
      entityType: 'EstateMembership', entityId: membership.id, requestId: req.id,
      metadata: { estateId: estate.id, email: user.email },
    } });
    return { user, membership };
  });
  const setupUrl = new URL('/setup-password', process.env.CLIENT_ORIGIN || 'http://localhost:5173');
  setupUrl.searchParams.set('token', token);
  res.status(201).json({ data: {
    account: {
      id: created.membership.id, userId: created.user.id, membershipId: created.membership.id,
      name: created.user.fullName, email: created.user.email, phone: created.user.phone,
      role: 'Estate Admin', roleValue: 'ESTATE_ADMIN', estateId: estate.id, estate: estate.name,
      accessStatus: 'Active', membershipStatus: 'ACTIVE', userStatus: 'ACTIVE', mustResetPassword: true, locked: false,
    },
    setupUrl: setupUrl.toString(),
    expiresAt,
  }, requestId: req.id });
}));

router.put('/platform/accounts/:membershipId', requireAuth, requireSuperAdmin, requireCsrf, validate(accountParamsSchema, 'params'), validate(accountUpdateSchema), asyncHandler(async (req, res) => {
  const membership = await prisma.estateMembership.findUnique({
    where: { id: req.params.membershipId },
    include: { user: true, estate: { select: { id: true, name: true } } },
  });
  if (!membership) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Estate account not found.');
  if (membership.user.platformRole === 'SUPER_ADMIN') throw new HttpError(403, 'ACCOUNT_LOCKED', 'The Super Admin account cannot be edited here.');
  if (membership.role === 'COMMITTEE_MEMBER' && req.body.role !== 'COMMITTEE_MEMBER') {
    throw new HttpError(403, 'ELECTION_ROLE_LOCKED', 'Committee roles are managed through estate elections.');
  }
  const phone = req.body.phone || null;
  const conflict = await prisma.user.findFirst({
    where: { id: { not: membership.userId }, OR: [{ email: req.body.email }, ...(phone ? [{ phone }] : [])] },
    select: { id: true },
  });
  if (conflict) throw new HttpError(409, 'ACCOUNT_EXISTS', 'An account already uses this email address or phone number.');

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: membership.userId }, data: { fullName: req.body.fullName, email: req.body.email, phone } });
    const updatedMembership = await tx.estateMembership.update({ where: { id: membership.id }, data: { role: req.body.role } });
    await tx.auditEvent.create({ data: {
      scope: 'PLATFORM', actorUserId: req.auth.user.id, action: 'ESTATE_ACCOUNT_UPDATED',
      entityType: 'EstateMembership', entityId: membership.id, requestId: req.id,
      metadata: { estateId: membership.estateId, role: req.body.role },
    } });
    return { user, membership: updatedMembership };
  });
  res.json({ data: {
    id: updated.membership.id, userId: updated.user.id, membershipId: updated.membership.id,
    name: updated.user.fullName, email: updated.user.email, phone: updated.user.phone,
    role: membershipRoleLabel(updated.membership.role), roleValue: updated.membership.role,
    estateId: membership.estateId, estate: membership.estate.name,
    accessStatus: membershipStatusLabel(updated.membership.status, updated.user.status),
    membershipStatus: updated.membership.status, userStatus: updated.user.status,
    mustResetPassword: updated.user.mustResetPassword, locked: false,
  }, requestId: req.id });
}));

router.patch('/platform/accounts/:membershipId/access', requireAuth, requireSuperAdmin, requireCsrf, validate(accountParamsSchema, 'params'), validate(accountAccessSchema), asyncHandler(async (req, res) => {
  const membership = await prisma.estateMembership.findUnique({ where: { id: req.params.membershipId }, include: { user: true } });
  if (!membership) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Estate account not found.');
  if (membership.user.platformRole === 'SUPER_ADMIN') throw new HttpError(403, 'ACCOUNT_LOCKED', 'The Super Admin account access cannot be changed here.');
  if (req.body.status === 'ACTIVE' && membership.user.status !== 'ACTIVE') throw new HttpError(409, 'USER_INACTIVE', 'This user account is suspended or archived.');

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.estateMembership.update({ where: { id: membership.id }, data: { status: req.body.status } });
    await tx.auditEvent.create({ data: {
      scope: 'PLATFORM', actorUserId: req.auth.user.id,
      action: req.body.status === 'ACTIVE' ? 'ESTATE_ACCOUNT_ACCESS_RESTORED' : 'ESTATE_ACCOUNT_ACCESS_REMOVED',
      entityType: 'EstateMembership', entityId: membership.id, requestId: req.id,
      metadata: { estateId: membership.estateId, userId: membership.userId },
    } });
    return result;
  });
  res.json({ data: { id: updated.id, status: updated.status, accessStatus: membershipStatusLabel(updated.status, membership.user.status) }, requestId: req.id });
}));

router.post('/platform/accounts/:membershipId/setup-link', requireAuth, requireSuperAdmin, requireCsrf, validate(accountParamsSchema, 'params'), asyncHandler(async (req, res) => {
  const membership = await prisma.estateMembership.findUnique({
    where: { id: req.params.membershipId },
    include: { user: { select: { id: true, email: true, status: true, mustResetPassword: true } } },
  });
  if (!membership || membership.user.status !== 'ACTIVE') throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Active estate account not found.');
  if (!membership.user.mustResetPassword) throw new HttpError(409, 'PASSWORD_ALREADY_SET', 'This account has already set its password.');

  const token = createToken();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await prisma.$transaction(async (tx) => {
    await tx.passwordChallenge.updateMany({ where: { userId: membership.user.id, purpose: 'INITIAL_PASSWORD', usedAt: null }, data: { usedAt: new Date() } });
    await tx.passwordChallenge.create({ data: {
      userId: membership.user.id, tokenHash: hashToken(token), purpose: 'INITIAL_PASSWORD', expiresAt,
    } });
    await tx.auditEvent.create({ data: {
      scope: 'PLATFORM', actorUserId: req.auth.user.id, action: 'ACCOUNT_SETUP_LINK_CREATED',
      entityType: 'EstateMembership', entityId: membership.id, requestId: req.id,
      metadata: { estateId: membership.estateId, email: membership.user.email },
    } });
  });
  const setupUrl = new URL('/setup-password', process.env.CLIENT_ORIGIN || 'http://localhost:5173');
  setupUrl.searchParams.set('token', token);
  res.status(201).json({ data: { setupUrl: setupUrl.toString(), expiresAt }, requestId: req.id });
}));

router.post('/platform/estates', requireAuth, requireSuperAdmin, requireCsrf, validate(estateSchema), asyncHandler(async (req, res) => {
  const duplicate = await prisma.estate.findFirst({
    where: { name: { equals: req.body.name, mode: 'insensitive' }, location: { equals: req.body.location, mode: 'insensitive' } },
    select: { id: true },
  });
  if (duplicate) throw new HttpError(409, 'ESTATE_EXISTS', 'An estate with this name and location already exists.');

  const estate = await prisma.$transaction(async (tx) => {
    const created = await tx.estate.create({ data: {
      name: req.body.name,
      location: req.body.location,
      logo: req.body.logo || null,
      billingStatus: req.body.billingStatus || 'UNCONFIGURED',
    } });
    await tx.auditEvent.create({ data: {
      scope: 'PLATFORM', actorUserId: req.auth.user.id, action: 'ESTATE_CREATED',
      entityType: 'Estate', entityId: created.id, requestId: req.id, metadata: {},
    } });
    return created;
  });
  res.status(201).json({ data: {
    id: estate.id,
    name: estate.name,
    location: estate.location,
    logo: estate.logo,
    accessStatus: estate.accessStatus,
    billingStatus: estate.billingStatus,
    createdAt: estate.createdAt,
  }, requestId: req.id });
}));

router.put('/platform/estates/:estateId', requireAuth, requireSuperAdmin, requireCsrf, validate(estateParamsSchema, 'params'), validate(estateSchema), asyncHandler(async (req, res) => {
  const duplicate = await prisma.estate.findFirst({
    where: {
      id: { not: req.params.estateId },
      name: { equals: req.body.name, mode: 'insensitive' },
      location: { equals: req.body.location, mode: 'insensitive' },
    },
    select: { id: true },
  });
  if (duplicate) throw new HttpError(409, 'ESTATE_EXISTS', 'An estate with this name and location already exists.');

  const estate = await prisma.$transaction(async (tx) => {
    const updated = await tx.estate.update({ where: { id: req.params.estateId }, data: req.body });
    await tx.auditEvent.create({ data: {
      scope: 'PLATFORM', actorUserId: req.auth.user.id, action: 'ESTATE_UPDATED',
      entityType: 'Estate', entityId: updated.id, requestId: req.id,
      metadata: { fields: Object.keys(req.body) },
    } });
    return updated;
  });
  res.json({ data: {
    id: estate.id,
    name: estate.name,
    location: estate.location,
    logo: estate.logo,
    accessStatus: estate.accessStatus,
    billingStatus: estate.billingStatus,
    createdAt: estate.createdAt,
  }, requestId: req.id });
}));

router.patch('/platform/estates/:estateId/access', requireAuth, requireSuperAdmin, requireCsrf, validate(estateParamsSchema, 'params'), validate(estateAccessSchema), asyncHandler(async (req, res) => {
  const estate = await prisma.$transaction(async (tx) => {
    const updated = await tx.estate.update({ where: { id: req.params.estateId }, data: { accessStatus: req.body.accessStatus } });
    await tx.auditEvent.create({ data: {
      scope: 'PLATFORM', actorUserId: req.auth.user.id,
      action: req.body.accessStatus === 'ACTIVE' ? 'ESTATE_ACCESS_RESTORED' : req.body.accessStatus === 'ARCHIVED' ? 'ESTATE_ARCHIVED' : 'ESTATE_ACCESS_SUSPENDED',
      entityType: 'Estate', entityId: updated.id, requestId: req.id,
      metadata: { accessStatus: req.body.accessStatus },
    } });
    return updated;
  });
  res.json({ data: { id: estate.id, name: estate.name, location: estate.location, logo: estate.logo, accessStatus: estate.accessStatus, billingStatus: estate.billingStatus, createdAt: estate.createdAt }, requestId: req.id });
}));

module.exports = router;
