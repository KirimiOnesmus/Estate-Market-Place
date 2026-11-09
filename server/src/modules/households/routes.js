const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const prisma = require('../../db/prisma');
const { HttpError, asyncHandler, validate } = require('../../http/errors');
const { requireAuth, requireCsrf, requireSuperAdminForEstate } = require('../../middleware/auth');
const { createToken, hashToken } = require('../../security/tokens');

const router = Router();
const registrationLimit = rateLimit({ windowMs: 60 * 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });
const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(32),
  locationId: z.string().uuid(),
  unitCode: z.string().trim().min(1).max(32),
  occupancy: z.enum(['Owner', 'Tenant', 'OWNER', 'TENANT']),
  householdSize: z.coerce.number().int().min(1).max(30),
  nextOfKinName: z.string().trim().min(2).max(120),
  nextOfKinPhone: z.string().trim().min(7).max(32),
  nextOfKinEmail: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
}).strict();

const decisionSchema = z.object({ note: z.string().trim().max(500).optional() }).strict();
const locationSchema = z.object({
  label: z.string().trim().min(2).max(80),
  locationType: z.enum(['BLOCK', 'STREET']),
}).strict();
const invitationSchema = z.object({ expiresInDays: z.coerce.number().int().min(1).max(30).default(7) }).strict();
const addHouseholdSchema = registrationSchema;
const listingSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  category: z.string().trim().min(2).max(60),
  price: z.coerce.number().int().positive().max(2_000_000_000),
  quantity: z.coerce.number().int().min(1).max(100_000),
  condition: z.enum(['New', 'Like new', 'Good', 'Fair']),
  paymentOptions: z.array(z.enum(['M-Pesa', 'Bank transfer'])).min(1).max(2),
  paymentDetails: z.record(z.string(), z.any()),
  images: z.array(z.string().max(3_500_000).regex(/^data:image\/(png|jpeg|webp|gif);base64,/)).min(3).max(6),
}).strict();
const listingDecisionSchema = z.object({ status: z.enum(['APPROVED', 'REMOVED']) }).strict();
const noticeSchema = z.object({ title: z.string().trim().min(3).max(160), text: z.string().trim().min(10).max(5000), category: z.enum(['General', 'Facilities', 'Security', 'Community']), date: z.string().trim().min(2).max(100), time: z.string().trim().min(2).max(100) }).strict();
const issueSchema = z.object({ title: z.string().trim().min(3).max(160), description: z.string().trim().min(10).max(5000), category: z.string().trim().min(2).max(80), location: z.string().trim().min(2).max(180) }).strict();
const issueUpdateSchema = z.object({ status: z.enum(['RECEIVED', 'IN_PROGRESS', 'RESOLVED']), message: z.string().trim().min(2).max(3000) }).strict();
const campaignSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  target: z.coerce.number().int().positive().max(2_000_000_000),
  beneficiaryType: z.enum(['estate', 'resident']),
  beneficiaryId: z.string().uuid().optional().nullable(),
  beneficiary: z.string().trim().min(2).max(160),
  householdContribution: z.coerce.number().int().positive().max(2_000_000_000).optional().nullable(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();
const committeeVoteSchema = z.object({ decision: z.enum(['APPROVE', 'REJECT']), reason: z.string().trim().max(3000).optional() }).strict().refine((value) => value.decision !== 'REJECT' || Boolean(value.reason));
const electionSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(3000),
  closesAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  candidates: z.array(z.object({ householdId: z.string().uuid() }).strict()).min(2).max(30),
}).strict().refine((value) => new Set(value.candidates.map((candidate) => candidate.householdId)).size === value.candidates.length, { message: 'A household can only appear once in an election.' });
const candidateParamsSchema = z.object({ id: z.string().uuid() }).strict();
const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
}).strict();

function normalizeOccupancy(value) {
  return value.toUpperCase() === 'OWNER' ? 'OWNER_OCCUPIED' : 'TENANT_OCCUPIED';
}

function requestDto(request) {
  const occupancy = request.occupancy === 'OWNER_OCCUPIED' ? 'Owner' : 'Tenant';
  return {
    id: request.id,
    name: request.fullName,
    email: request.email,
    phone: request.phone,
    locationId: request.locationId,
    location: request.location?.label || request.locationLabel,
    unitNumber: request.unitCode,
    unit: `${request.location?.label || request.locationLabel} · ${request.unitCode}`,
    occupancy,
    householdSize: request.householdSize,
    nextOfKin: { name: request.nextOfKinName, phone: request.nextOfKinPhone, email: request.nextOfKinEmail },
    submitted: request.createdAt,
    status: request.status,
  };
}

function requireCommittee(req, _res, next) {
  if (req.auth.role !== 'COMMITTEE_MEMBER') return next(new HttpError(403, 'COMMITTEE_ACCESS_REQUIRED', 'Committee member access is required.'));
  if (!req.auth.membership) return next(new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'An active estate membership is required.'));
  next();
}

function campaignDto(campaign) {
  const approvals = campaign.votes.filter((vote) => vote.decision === 'APPROVE').length;
  const rejections = campaign.votes.filter((vote) => vote.decision === 'REJECT').length;
  return {
    id: campaign.id,
    title: campaign.title,
    purpose: campaign.description,
    target: campaign.targetAmount,
    raised: 0,
    beneficiaryType: campaign.beneficiaryType.toLowerCase(),
    beneficiaryId: campaign.beneficiaryHouseholdId,
    beneficiary: campaign.beneficiaryLabel,
    householdContribution: campaign.householdContribution || 0,
    deadline: campaign.deadline.toISOString().slice(0, 10),
    status: ({ DRAFT: 'Draft', PENDING_REVIEW: 'Pending committee approval', LIVE: 'Live', REJECTED: 'Rejected' })[campaign.status],
    approvals,
    rejections,
    updatedAt: campaign.updatedAt,
    votes: campaign.votes,
  };
}

function electionDto(election, membershipId) {
  return {
    id: election.id,
    title: election.title,
    description: election.description,
    closesAt: election.closesAt.toISOString().slice(0, 10),
    status: ({ OPEN: 'Open', CLOSED: 'Closed', TIE_REVIEW: 'Tie - review' })[election.status],
    candidates: election.candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      household: candidate.household,
      householdId: candidate.householdId,
      votes: candidate._count.votes,
    })),
    totalVotes: election.votes.length,
    myVote: election.votes.find((vote) => vote.voterMembershipId === membershipId)?.candidateId || null,
    winnerId: election.winnerCandidateId,
  };
}

function listingDto(listing) {
  const household = listing.seller.households[0];
  return {
    id: listing.id, title: listing.title, description: listing.description, category: listing.category,
    price: listing.price, quantity: listing.quantity, condition: listing.condition,
    paymentOptions: listing.paymentOptions, paymentDetails: listing.paymentDetails, images: listing.images,
    status: ({ PENDING_REVIEW: 'Pending review', APPROVED: 'Approved', REMOVED: 'Removed', SOLD: 'Sold' })[listing.status],
    owner: listing.seller.user.fullName || 'Resident',
    unit: household ? `${household.location.label} · ${household.unitCode}` : 'Estate resident',
    createdAt: listing.createdAt,
  };
}

const listingInclude = {
  seller: {
    include: {
      user: { select: { fullName: true } },
      households: { include: { location: { select: { label: true } } }, take: 1 },
    },
  },
};

const issueStatusLabel = { RECEIVED: 'Received', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved' };
function issueDto(report) {
  const updates = (report.updates || []).map((entry) => ({ status: issueStatusLabel[entry.status], message: entry.message, when: entry.createdAt.toISOString() }));
  const latest = updates.at(-1);
  return {
    id: report.id, title: report.title, description: report.description, category: report.category,
    location: report.location, status: issueStatusLabel[report.status],
    updated: new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(report.updatedAt),
    update: latest?.message || 'The estate team has received the report.', updates,
    reporter: report.reporter?.user?.fullName || null,
  };
}

async function loadElection(tx, id, membershipId) {
  return tx.election.findUnique({
    where: { id },
    include: {
      candidates: { include: { _count: { select: { votes: true } } } },
      votes: { select: { voterMembershipId: true, candidateId: true } },
    },
  }).then((election) => election ? electionDto(election, membershipId) : null);
}

router.get('/estates/:estateId/registration-locations', asyncHandler(async (req, res) => {
  if (!z.string().uuid().safeParse(req.params.estateId).success) throw new HttpError(404, 'ESTATE_NOT_FOUND', 'Estate not found.');
  const estate = await prisma.estate.findUnique({ where: { id: req.params.estateId }, select: { id: true, accessStatus: true } });
  if (!estate || estate.accessStatus !== 'ACTIVE') throw new HttpError(404, 'ESTATE_NOT_FOUND', 'Estate not found.');
  const locations = await prisma.estateLocation.findMany({
    where: { estateId: estate.id, status: 'ACTIVE' },
    select: { id: true, label: true, locationType: true },
    orderBy: { label: 'asc' },
  });
  res.json({ data: locations.map((location) => ({ id: location.id, name: location.label, type: location.locationType })), requestId: req.id });
}));

router.post('/admin/registration-invitations', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(invitationSchema), asyncHandler(async (req, res) => {
  const token = createToken();
  const expiresAt = new Date(Date.now() + req.body.expiresInDays * 24 * 60 * 60 * 1000);
  const invitation = await prisma.$transaction(async (tx) => {
    const created = await tx.registrationInvitation.create({ data: {
      estateId: req.auth.estate.id,
      createdById: req.auth.user.id,
      tokenHash: hashToken(token),
      expiresAt,
    } });
    await tx.auditEvent.create({ data: {
      scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id,
      action: 'REGISTRATION_INVITATION_CREATED', entityType: 'RegistrationInvitation', entityId: created.id,
      requestId: req.id, metadata: { expiresAt: expiresAt.toISOString() },
    } });
    return created;
  });
  const url = new URL('/register', process.env.CLIENT_ORIGIN || 'http://localhost:5173');
  url.searchParams.set('invite', token);
  res.status(201).json({ data: { url: url.toString(), expiresAt: invitation.expiresAt }, requestId: req.id });
}));

function parseInvitationToken(value) {
  const parsed = z.string().regex(/^[A-Za-z0-9_-]{40,50}$/).safeParse(value);
  if (!parsed.success) throw new HttpError(404, 'INVITATION_NOT_FOUND', 'Invitation link is invalid or expired.');
  return hashToken(parsed.data);
}

router.get('/register/:token', asyncHandler(async (req, res) => {
  const invitation = await prisma.registrationInvitation.findUnique({
    where: { tokenHash: parseInvitationToken(req.params.token) },
    include: { estate: { select: { id: true, name: true, logo: true, accessStatus: true } } },
  });
  if (!invitation || invitation.usedAt || invitation.revokedAt || invitation.expiresAt <= new Date() || invitation.estate.accessStatus !== 'ACTIVE') {
    throw new HttpError(404, 'INVITATION_NOT_FOUND', 'Invitation link is invalid or expired.');
  }
  const locations = await prisma.estateLocation.findMany({
    where: { estateId: invitation.estateId, status: 'ACTIVE' },
    select: { id: true, label: true, locationType: true },
    orderBy: { label: 'asc' },
  });
  res.json({ data: {
    estate: { id: invitation.estate.id, name: invitation.estate.name, logo: invitation.estate.logo || null },
    expiresAt: invitation.expiresAt,
    locations: locations.map((location) => ({ id: location.id, name: location.label, type: location.locationType })),
  }, requestId: req.id });
}));

router.post('/register/:token', registrationLimit, validate(registrationSchema), asyncHandler(async (req, res) => {
  const body = req.body;
  const invitationTokenHash = parseInvitationToken(req.params.token);
  const request = await prisma.$transaction(async (tx) => {
    const invitation = await tx.registrationInvitation.findUnique({ where: { tokenHash: invitationTokenHash }, include: { estate: true } });
    if (!invitation || invitation.usedAt || invitation.revokedAt || invitation.expiresAt <= new Date() || invitation.estate.accessStatus !== 'ACTIVE') {
      throw new HttpError(404, 'INVITATION_NOT_FOUND', 'Invitation link is invalid or expired.');
    }
    const estateId = invitation.estateId;

    const location = await tx.estateLocation.findFirst({ where: { id: body.locationId, estateId, status: 'ACTIVE' } });
    if (!location) throw new HttpError(422, 'INVALID_LOCATION', 'Choose an active block or street in this estate.');

    const duplicateContact = await tx.registrationRequest.findFirst({
      where: {
        estateId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [{ email: body.email }, { phone: body.phone }],
      },
      select: { id: true },
    });
    if (duplicateContact) throw new HttpError(409, 'DUPLICATE_REGISTRATION', 'A registration already exists for this email or phone number.');

    const duplicateUnitRequest = await tx.registrationRequest.findFirst({
      where: { estateId, locationId: body.locationId, unitCode: { equals: body.unitCode, mode: 'insensitive' }, status: 'PENDING' },
      select: { id: true },
    });
    const occupiedUnit = await tx.household.findFirst({
      where: {
        estateId,
        locationId: body.locationId,
        unitCode: { equals: body.unitCode, mode: 'insensitive' },
        status: { in: ['PENDING_REVIEW', 'VERIFIED'] },
      },
      select: { id: true },
    });
    if (duplicateUnitRequest || occupiedUnit) throw new HttpError(409, 'HOUSEHOLD_ALREADY_REGISTERED', 'This unit already has a household registration or pending request.');

    const created = await tx.registrationRequest.create({
      data: {
        estateId,
        locationId: location.id,
        email: body.email,
        phone: body.phone,
        fullName: body.fullName,
        locationLabel: location.label,
        unitCode: body.unitCode,
        occupancy: normalizeOccupancy(body.occupancy),
        householdSize: body.householdSize,
        nextOfKinName: body.nextOfKinName,
        nextOfKinPhone: body.nextOfKinPhone,
        nextOfKinEmail: body.nextOfKinEmail,
      },
      include: { location: { select: { label: true } } },
    });

    await tx.auditEvent.create({ data: {
      scope: 'ESTATE', estateId, action: 'REGISTRATION_SUBMITTED', entityType: 'RegistrationRequest', entityId: created.id,
      requestId: req.id, metadata: { status: 'PENDING' },
    } });
    const consumed = await tx.registrationInvitation.updateMany({
      where: { id: invitation.id, usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) throw new HttpError(409, 'INVITATION_ALREADY_USED', 'This invitation has already been used.');
    return created;
  }, { isolationLevel: 'Serializable' });

  res.status(201).json({ data: { id: request.id, status: request.status }, requestId: req.id });
}));

router.get('/admin/overview', requireAuth, requireSuperAdminForEstate, asyncHandler(async (req, res) => {
  const estateId = req.auth.estate.id;
  const [verifiedHouseholds, householdMembers, pendingRegistrations, activeLocations] = await Promise.all([
    prisma.household.count({ where: { estateId, status: 'VERIFIED' } }),
    prisma.household.aggregate({ where: { estateId, status: 'VERIFIED' }, _sum: { householdSize: true } }),
    prisma.registrationRequest.count({ where: { estateId, status: 'PENDING' } }),
    prisma.estateLocation.count({ where: { estateId, status: 'ACTIVE' } }),
  ]);
  res.json({ data: { verifiedHouseholds, householdMembers: householdMembers._sum.householdSize || 0, pendingRegistrations, activeLocations }, requestId: req.id });
}));

router.post('/admin/households', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(addHouseholdSchema), asyncHandler(async (req, res) => {
  const body = req.body;
  const location = await prisma.estateLocation.findFirst({ where: { id: body.locationId, estateId: req.auth.estate.id, status: 'ACTIVE' } });
  if (!location) throw new HttpError(422, 'INVALID_LOCATION', 'Choose an active block or street in this estate.');
  const household = await prisma.$transaction(async (tx) => {
    const duplicateUnit = await tx.household.findFirst({ where: { estateId: req.auth.estate.id, locationId: location.id, unitCode: { equals: body.unitCode, mode: 'insensitive' }, status: { in: ['PENDING_REVIEW', 'VERIFIED'] } } });
    const pendingRequest = await tx.registrationRequest.findFirst({ where: { estateId: req.auth.estate.id, locationId: location.id, unitCode: { equals: body.unitCode, mode: 'insensitive' }, status: 'PENDING' } });
    if (duplicateUnit || pendingRequest) throw new HttpError(409, 'HOUSEHOLD_ALREADY_REGISTERED', 'This unit already has a household or pending registration.');
    const conflict = await tx.user.findFirst({ where: { OR: [{ email: body.email }, { phone: body.phone }] } });
    if (conflict) throw new HttpError(409, 'ACCOUNT_CONFLICT', 'The email address or phone number is already linked to an account.');
    const user = await tx.user.create({ data: { fullName: body.fullName, email: body.email, phone: body.phone, mustResetPassword: true } });
    const membership = await tx.estateMembership.create({ data: { estateId: req.auth.estate.id, userId: user.id, role: 'RESIDENT', status: 'ACTIVE', approvedById: req.auth.user.id, approvedAt: new Date() } });
    const created = await tx.household.create({ data: {
      estateId: req.auth.estate.id, locationId: location.id, representativeId: membership.id, unitCode: body.unitCode,
      occupancy: normalizeOccupancy(body.occupancy), householdSize: body.householdSize, status: 'VERIFIED',
      nextOfKinName: body.nextOfKinName, nextOfKinPhone: body.nextOfKinPhone, nextOfKinEmail: body.nextOfKinEmail,
      verifiedById: req.auth.user.id, verifiedAt: new Date(),
    } });
    const token = createToken();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await tx.passwordChallenge.create({ data: { userId: user.id, tokenHash: hashToken(token), purpose: 'INITIAL_PASSWORD', expiresAt } });
    await tx.auditEvent.create({ data: { scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id, action: 'HOUSEHOLD_CREATED_BY_ADMIN', entityType: 'Household', entityId: created.id, requestId: req.id, metadata: { membershipId: membership.id } } });
    return { created, membership, user, token };
  }, { isolationLevel: 'Serializable' });
  const setupUrl = new URL('/setup-password', process.env.CLIENT_ORIGIN || 'http://localhost:5173');
  setupUrl.searchParams.set('token', household.token);
  res.status(201).json({ data: { id: household.created.id, membershipId: household.membership.id, name: household.user.fullName, email: household.user.email, phone: household.user.phone, locationId: location.id, unit: `${location.label} · ${household.created.unitCode}`, unitNumber: household.created.unitCode, householdSize: household.created.householdSize, occupancy: household.created.occupancy === 'OWNER_OCCUPIED' ? 'Owner occupied' : 'Tenant occupied', nextOfKin: { name: household.created.nextOfKinName, phone: household.created.nextOfKinPhone, email: household.created.nextOfKinEmail }, accountStatus: 'Password setup pending', mustResetPassword: true, isHouseholdHolder: true, status: 'Verified', setupUrl: setupUrl.toString() }, requestId: req.id });
}));

router.get('/marketplace/listings', requireAuth, asyncHandler(async (req, res) => {
  if (!req.auth.estate) throw new HttpError(403, 'ESTATE_CONTEXT_REQUIRED', 'Select an estate workspace first.');
  const where = { estateId: req.auth.estate.id, status: 'APPROVED' };
  const listings = await prisma.marketplaceListing.findMany({ where, include: listingInclude, orderBy: { createdAt: 'desc' }, take: 200 });
  res.json({ data: listings.map(listingDto), requestId: req.id });
}));

router.get('/admin/marketplace/listings', requireAuth, requireSuperAdminForEstate, asyncHandler(async (req, res) => {
  const listings = await prisma.marketplaceListing.findMany({ where: { estateId: req.auth.estate.id }, include: listingInclude, orderBy: { createdAt: 'desc' }, take: 200 });
  res.json({ data: listings.map(listingDto), requestId: req.id });
}));

router.post('/marketplace/listings', requireAuth, requireCsrf, validate(listingSchema), asyncHandler(async (req, res) => {
  if (!req.auth.estate || !req.auth.membership) throw new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'An active estate membership is required to create a listing.');
  const household = await prisma.household.findFirst({ where: { estateId: req.auth.estate.id, representativeId: req.auth.membership.id, status: 'VERIFIED' } });
  if (!household) throw new HttpError(403, 'VERIFIED_HOUSEHOLD_REQUIRED', 'A verified household is required to create a marketplace listing.');
  const listing = await prisma.marketplaceListing.create({ data: { estateId: req.auth.estate.id, sellerMembershipId: req.auth.membership.id, ...req.body } });
  await prisma.auditEvent.create({ data: { scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id, action: 'MARKETPLACE_LISTING_SUBMITTED', entityType: 'MarketplaceListing', entityId: listing.id, requestId: req.id, metadata: {} } });
  const hydrated = await prisma.marketplaceListing.findUnique({ where: { id: listing.id }, include: listingInclude });
  res.status(201).json({ data: listingDto(hydrated), requestId: req.id });
}));

router.patch('/admin/marketplace/listings/:id', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(candidateParamsSchema, 'params'), validate(listingDecisionSchema), asyncHandler(async (req, res) => {
  const listing = await prisma.marketplaceListing.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id } });
  if (!listing) throw new HttpError(404, 'LISTING_NOT_FOUND', 'Marketplace listing not found.');
  if (listing.status === 'SOLD') throw new HttpError(409, 'LISTING_CLOSED', 'A sold listing cannot be changed.');
  const updated = await prisma.marketplaceListing.update({ where: { id: listing.id }, data: { status: req.body.status, reviewedById: req.auth.user.id, reviewedAt: new Date() }, include: listingInclude });
  await prisma.auditEvent.create({ data: { scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id, action: req.body.status === 'APPROVED' ? 'MARKETPLACE_LISTING_APPROVED' : 'MARKETPLACE_LISTING_REMOVED', entityType: 'MarketplaceListing', entityId: listing.id, requestId: req.id, metadata: {} } });
  res.json({ data: listingDto(updated), requestId: req.id });
}));

router.get('/notices', requireAuth, asyncHandler(async (req, res) => {
  if (!req.auth.estate) throw new HttpError(403, 'ESTATE_CONTEXT_REQUIRED', 'Select an estate workspace first.');
  const notices = await prisma.estateNotice.findMany({ where: { estateId: req.auth.estate.id }, orderBy: { createdAt: 'desc' }, take: 200 });
  res.json({ data: notices.map((notice) => ({ id: notice.id, title: notice.title, text: notice.text, category: notice.category, date: notice.displayDate, time: notice.displayTime, unread: false })), requestId: req.id });
}));

router.get('/admin/notices', requireAuth, requireSuperAdminForEstate, asyncHandler(async (req, res) => {
  const notices = await prisma.estateNotice.findMany({ where: { estateId: req.auth.estate.id }, orderBy: { createdAt: 'desc' }, take: 200 });
  res.json({ data: notices.map((notice) => ({ id: notice.id, title: notice.title, text: notice.text, category: notice.category, date: notice.displayDate, time: notice.displayTime, unread: false })), requestId: req.id });
}));

router.post('/admin/notices', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(noticeSchema), asyncHandler(async (req, res) => {
  const notice = await prisma.$transaction(async (tx) => {
    const created = await tx.estateNotice.create({ data: { estateId: req.auth.estate.id, createdByUserId: req.auth.user.id, title: req.body.title, text: req.body.text, category: req.body.category, displayDate: req.body.date, displayTime: req.body.time } });
    await tx.auditEvent.create({ data: { scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id, action: 'NOTICE_PUBLISHED', entityType: 'EstateNotice', entityId: created.id, requestId: req.id, metadata: {} } });
    return created;
  });
  res.status(201).json({ data: { id: notice.id, title: notice.title, text: notice.text, category: notice.category, date: notice.displayDate, time: notice.displayTime, unread: false }, requestId: req.id });
}));

router.put('/admin/notices/:id', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(candidateParamsSchema, 'params'), validate(noticeSchema), asyncHandler(async (req, res) => {
  const notice = await prisma.estateNotice.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id } });
  if (!notice) throw new HttpError(404, 'NOTICE_NOT_FOUND', 'Notice not found.');
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.estateNotice.update({ where: { id: notice.id }, data: { title: req.body.title, text: req.body.text, category: req.body.category, displayDate: req.body.date, displayTime: req.body.time } });
    await tx.auditEvent.create({ data: { scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id, action: 'NOTICE_UPDATED', entityType: 'EstateNotice', entityId: notice.id, requestId: req.id, metadata: {} } });
    return row;
  });
  res.json({ data: { id: updated.id, title: updated.title, text: updated.text, category: updated.category, date: updated.displayDate, time: updated.displayTime, unread: false }, requestId: req.id });
}));

router.delete('/admin/notices/:id', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(candidateParamsSchema, 'params'), asyncHandler(async (req, res) => {
  const notice = await prisma.estateNotice.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id } });
  if (!notice) throw new HttpError(404, 'NOTICE_NOT_FOUND', 'Notice not found.');
  await prisma.$transaction(async (tx) => {
    await tx.estateNotice.delete({ where: { id: notice.id } });
    await tx.auditEvent.create({ data: { scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id, action: 'NOTICE_DELETED', entityType: 'EstateNotice', entityId: notice.id, requestId: req.id, metadata: { title: notice.title } } });
  });
  res.json({ data: { id: notice.id, deleted: true }, requestId: req.id });
}));

router.get('/issues', requireAuth, asyncHandler(async (req, res) => {
  if (!req.auth.estate || !req.auth.membership) throw new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'An active estate membership is required.');
  const isAdmin = ['ESTATE_ADMIN', 'SUPER_ADMIN'].includes(req.auth.role);
  const reports = await prisma.issueReport.findMany({
    where: { estateId: req.auth.estate.id, ...(isAdmin ? {} : { reporterMembershipId: req.auth.membership.id }) },
    include: { updates: { orderBy: { createdAt: 'asc' } }, reporter: { include: { user: { select: { fullName: true } } } } },
    orderBy: { updatedAt: 'desc' }, take: 200,
  });
  res.json({ data: reports.map(issueDto), requestId: req.id });
}));

router.post('/issues', requireAuth, requireCsrf, validate(issueSchema), asyncHandler(async (req, res) => {
  if (!req.auth.estate || !req.auth.membership) throw new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'An active estate membership is required to submit an issue report.');
  const report = await prisma.$transaction(async (tx) => {
    const created = await tx.issueReport.create({ data: { estateId: req.auth.estate.id, reporterMembershipId: req.auth.membership.id, ...req.body } });
    await tx.auditEvent.create({ data: { scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id, action: 'ISSUE_REPORT_SUBMITTED', entityType: 'IssueReport', entityId: created.id, requestId: req.id, metadata: { category: created.category } } });
    return tx.issueReport.findUnique({ where: { id: created.id }, include: { updates: true, reporter: { include: { user: { select: { fullName: true } } } } } });
  });
  res.status(201).json({ data: issueDto(report), requestId: req.id });
}));

router.patch('/admin/issues/:id', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(candidateParamsSchema, 'params'), validate(issueUpdateSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.issueReport.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id } });
  if (!existing) throw new HttpError(404, 'ISSUE_REPORT_NOT_FOUND', 'Issue report not found.');
  const report = await prisma.$transaction(async (tx) => {
    await tx.issueReport.update({ where: { id: existing.id }, data: { status: req.body.status } });
    await tx.issueReportUpdate.create({ data: { reportId: existing.id, authorUserId: req.auth.user.id, status: req.body.status, message: req.body.message } });
    await tx.auditEvent.create({ data: { scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id, action: 'ISSUE_REPORT_UPDATED', entityType: 'IssueReport', entityId: existing.id, requestId: req.id, metadata: { status: req.body.status } } });
    return tx.issueReport.findUnique({ where: { id: existing.id }, include: { updates: { orderBy: { createdAt: 'asc' } }, reporter: { include: { user: { select: { fullName: true } } } } } });
  });
  res.json({ data: issueDto(report), requestId: req.id });
}));

router.get('/admin/households', requireAuth, requireSuperAdminForEstate, asyncHandler(async (req, res) => {
  const households = await prisma.household.findMany({
    where: { estateId: req.auth.estate.id, status: 'VERIFIED' },
    include: { location: { select: { label: true } }, representative: { include: { user: true } } },
    orderBy: [{ location: { label: 'asc' } }, { unitCode: 'asc' }],
    take: 500,
  });
  res.json({ data: households.map((household) => ({
    id: household.id,
    membershipId: household.representative.id,
    name: household.representative.user.fullName || 'Resident',
    email: household.representative.user.email,
    phone: household.representative.user.phone,
    unit: `${household.location?.label || 'Location'} · ${household.unitCode}`,
    householdSize: household.householdSize,
    occupancy: household.occupancy === 'OWNER_OCCUPIED' ? 'Owner occupied' : 'Tenant occupied',
    nextOfKin: { name: household.nextOfKinName, phone: household.nextOfKinPhone, email: household.nextOfKinEmail },
    accountStatus: household.representative.user.mustResetPassword ? 'Password setup pending' : 'Active',
    mustResetPassword: household.representative.user.mustResetPassword,
    isHouseholdHolder: true,
    committeeMember: household.representative.role === 'COMMITTEE_MEMBER',
  })), requestId: req.id });
}));

router.get('/campaigns', requireAuth, asyncHandler(async (req, res) => {
  if (!req.auth.estate) throw new HttpError(403, 'ESTATE_CONTEXT_REQUIRED', 'Select an estate workspace first.');
  const campaigns = await prisma.campaign.findMany({
    where: { estateId: req.auth.estate.id, ...(req.auth.role === 'ESTATE_ADMIN' || req.auth.role === 'SUPER_ADMIN' ? {} : { status: 'LIVE' }) },
    include: { votes: { select: { decision: true } } },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  });
  res.json({ data: campaigns.map(campaignDto), requestId: req.id });
}));

router.post('/admin/campaigns', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(campaignSchema), asyncHandler(async (req, res) => {
  const body = req.body;
  const deadline = new Date(`${body.deadline}T23:59:59.999Z`);
  if (Number.isNaN(deadline.getTime()) || deadline.toISOString().slice(0, 10) !== body.deadline || deadline < new Date()) throw new HttpError(422, 'INVALID_CAMPAIGN_DEADLINE', 'Choose a valid future campaign deadline.');
  let beneficiaryHouseholdId = null;
  let beneficiaryLabel = req.auth.estate.name;
  if (body.beneficiaryType === 'resident') {
    const household = await prisma.household.findFirst({
      where: { id: body.beneficiaryId, estateId: req.auth.estate.id, status: 'VERIFIED' },
      include: { representative: { include: { user: { select: { fullName: true } } } } },
    });
    if (!household) throw new HttpError(404, 'BENEFICIARY_NOT_FOUND', 'The selected resident household is not available.');
    beneficiaryHouseholdId = household.id;
    beneficiaryLabel = household.representative.user.fullName || body.beneficiary;
  } else if (!body.householdContribution) {
    throw new HttpError(422, 'CONTRIBUTION_REQUIRED', 'Enter the fixed amount for each household.');
  }
  const campaign = await prisma.$transaction(async (tx) => {
    const created = await tx.campaign.create({ data: {
      estateId: req.auth.estate.id,
      createdByUserId: req.auth.user.id,
      title: body.title,
      description: body.description,
      targetAmount: body.target,
      beneficiaryType: body.beneficiaryType.toUpperCase(),
      beneficiaryLabel,
      beneficiaryHouseholdId,
      householdContribution: body.beneficiaryType === 'estate' ? body.householdContribution : null,
      deadline,
    }, include: { votes: { select: { decision: true } } } });
    await tx.auditEvent.create({ data: {
      scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id,
      action: 'CAMPAIGN_CREATED', entityType: 'Campaign', entityId: created.id, requestId: req.id,
      metadata: { status: created.status },
    } });
    return created;
  });
  res.status(201).json({ data: campaignDto(campaign), requestId: req.id });
}));

router.put('/admin/campaigns/:id', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(candidateParamsSchema, 'params'), validate(campaignSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.campaign.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id } });
  if (!existing) throw new HttpError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found.');
  if (!['DRAFT', 'REJECTED'].includes(existing.status)) throw new HttpError(409, 'CAMPAIGN_LOCKED', 'Only draft or rejected campaigns can be edited.');
  const body = req.body;
  const deadline = new Date(`${body.deadline}T23:59:59.999Z`);
  if (Number.isNaN(deadline.getTime()) || deadline.toISOString().slice(0, 10) !== body.deadline || deadline < new Date()) throw new HttpError(422, 'INVALID_CAMPAIGN_DEADLINE', 'Choose a valid future campaign deadline.');
  let beneficiaryHouseholdId = null;
  let beneficiaryLabel = req.auth.estate.name;
  if (body.beneficiaryType === 'resident') {
    const household = await prisma.household.findFirst({ where: { id: body.beneficiaryId, estateId: req.auth.estate.id, status: 'VERIFIED' }, include: { representative: { include: { user: { select: { fullName: true } } } } } });
    if (!household) throw new HttpError(404, 'BENEFICIARY_NOT_FOUND', 'The selected resident household is not available.');
    beneficiaryHouseholdId = household.id;
    beneficiaryLabel = household.representative.user.fullName || body.beneficiary;
  } else if (!body.householdContribution) throw new HttpError(422, 'CONTRIBUTION_REQUIRED', 'Enter the fixed amount for each household.');
  const updated = await prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.update({ where: { id: existing.id }, data: {
      title: body.title, description: body.description, targetAmount: body.target,
      beneficiaryType: body.beneficiaryType.toUpperCase(), beneficiaryLabel, beneficiaryHouseholdId,
      householdContribution: body.beneficiaryType === 'estate' ? body.householdContribution : null, deadline,
    }, include: { votes: { select: { decision: true } } } });
    await tx.auditEvent.create({ data: {
      scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id,
      action: 'CAMPAIGN_UPDATED', entityType: 'Campaign', entityId: campaign.id, requestId: req.id,
      metadata: {},
    } });
    return campaign;
  });
  res.json({ data: campaignDto(updated), requestId: req.id });
}));

router.post('/admin/campaigns/:id/publish', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(candidateParamsSchema, 'params'), asyncHandler(async (req, res) => {
  const existing = await prisma.campaign.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id } });
  if (!existing) throw new HttpError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found.');
  if (!['DRAFT', 'REJECTED'].includes(existing.status)) throw new HttpError(409, 'CAMPAIGN_NOT_PUBLISHABLE', 'This campaign cannot be submitted for review.');
  const campaign = await prisma.$transaction(async (tx) => {
    if (existing.status === 'REJECTED') await tx.campaignVote.deleteMany({ where: { campaignId: existing.id } });
    const updated = await tx.campaign.update({ where: { id: existing.id }, data: { status: 'PENDING_REVIEW' }, include: { votes: { select: { decision: true } } } });
    await tx.auditEvent.create({ data: {
      scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id,
      action: 'CAMPAIGN_PUBLISHED_FOR_REVIEW', entityType: 'Campaign', entityId: updated.id, requestId: req.id,
      metadata: {},
    } });
    return updated;
  });
  res.json({ data: campaignDto(campaign), requestId: req.id });
}));

router.get('/committee/campaigns', requireAuth, requireCommittee, asyncHandler(async (req, res) => {
  const campaigns = await prisma.campaign.findMany({
    where: { estateId: req.auth.estate.id, status: { in: ['PENDING_REVIEW', 'LIVE', 'REJECTED'] } },
    include: { votes: { select: { voterMembershipId: true, decision: true, reason: true } } },
    orderBy: { updatedAt: 'desc' }, take: 200,
  });
  res.json({ data: campaigns.map((campaign) => ({ ...campaignDto(campaign), ownVote: campaign.votes.find((vote) => vote.voterMembershipId === req.auth.membership.id) || null })), requestId: req.id });
}));

router.post('/committee/campaigns/:id/votes', requireAuth, requireCommittee, requireCsrf, validate(candidateParamsSchema, 'params'), validate(committeeVoteSchema), asyncHandler(async (req, res) => {
  const campaign = await prisma.campaign.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id } });
  if (!campaign) throw new HttpError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found.');
  if (campaign.status !== 'PENDING_REVIEW') throw new HttpError(409, 'CAMPAIGN_VOTING_CLOSED', 'Committee voting for this campaign is closed.');
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.campaign.findFirst({ where: { id: campaign.id, estateId: req.auth.estate.id, status: 'PENDING_REVIEW' }, select: { id: true } });
    if (!current) throw new HttpError(409, 'CAMPAIGN_VOTING_CLOSED', 'Committee voting for this campaign is closed.');
    await tx.campaignVote.upsert({
      where: { campaignId_voterMembershipId: { campaignId: campaign.id, voterMembershipId: req.auth.membership.id } },
      create: { campaignId: campaign.id, voterMembershipId: req.auth.membership.id, decision: req.body.decision, reason: req.body.decision === 'REJECT' ? req.body.reason : null },
      update: { decision: req.body.decision, reason: req.body.decision === 'REJECT' ? req.body.reason : null },
    });
    const votes = await tx.campaignVote.findMany({ where: { campaignId: campaign.id }, select: { decision: true } });
    const approvals = votes.filter((vote) => vote.decision === 'APPROVE').length;
    const rejections = votes.filter((vote) => vote.decision === 'REJECT').length;
    const status = approvals >= 3 ? 'LIVE' : rejections >= 3 ? 'REJECTED' : 'PENDING_REVIEW';
    const updated = await tx.campaign.update({ where: { id: campaign.id }, data: { status }, include: { votes: { select: { decision: true, voterMembershipId: true, reason: true } } } });
    await tx.auditEvent.create({ data: {
      scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id,
      action: req.body.decision === 'APPROVE' ? 'CAMPAIGN_APPROVED_BY_COMMITTEE' : 'CAMPAIGN_REJECTED_BY_COMMITTEE',
      entityType: 'Campaign', entityId: campaign.id, requestId: req.id,
      metadata: { ...(req.body.decision === 'REJECT' ? { reason: req.body.reason } : {}), approvals, rejections, status },
    } });
    return updated;
  });
  res.json({ data: { ...campaignDto(result), ownVote: result.votes.find((vote) => vote.voterMembershipId === req.auth.membership.id) || null }, requestId: req.id });
}));

router.get('/admin/elections', requireAuth, requireSuperAdminForEstate, asyncHandler(async (req, res) => {
  const elections = await prisma.election.findMany({
    where: { estateId: req.auth.estate.id },
    include: { candidates: { include: { _count: { select: { votes: true } } } }, votes: { select: { voterMembershipId: true, candidateId: true } } },
    orderBy: [{ createdAt: 'desc' }], take: 100,
  });
  res.json({ data: elections.map((election) => electionDto(election, req.auth.membership?.id)), requestId: req.id });
}));

router.post('/admin/elections', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(electionSchema), asyncHandler(async (req, res) => {
  const closesAt = new Date(`${req.body.closesAt}T23:59:59.999Z`);
  if (Number.isNaN(closesAt.getTime()) || closesAt.toISOString().slice(0, 10) !== req.body.closesAt || closesAt < new Date()) throw new HttpError(422, 'INVALID_ELECTION_DEADLINE', 'Choose a valid future voting close date.');
  const households = await prisma.household.findMany({
    where: { id: { in: req.body.candidates.map((candidate) => candidate.householdId) }, estateId: req.auth.estate.id, status: 'VERIFIED' },
    include: { location: { select: { label: true } }, representative: { include: { user: { select: { fullName: true } } } } },
  });
  if (households.length !== req.body.candidates.length) throw new HttpError(422, 'INVALID_ELECTION_CANDIDATE', 'Every candidate must belong to a verified household in this estate.');
  const election = await prisma.$transaction(async (tx) => {
    const created = await tx.election.create({ data: {
      estateId: req.auth.estate.id, createdByUserId: req.auth.user.id,
      title: req.body.title, description: req.body.description, closesAt,
      candidates: { create: households.map((household) => ({
        householdId: household.id,
        name: household.representative.user.fullName || 'Resident',
        household: `${household.location.label} · ${household.unitCode}`,
      })) },
    } });
    await tx.auditEvent.create({ data: {
      scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id,
      action: 'COMMITTEE_ELECTION_CREATED', entityType: 'Election', entityId: created.id, requestId: req.id,
      metadata: { candidates: households.length },
    } });
    return loadElection(tx, created.id, req.auth.membership?.id);
  });
  res.status(201).json({ data: election, requestId: req.id });
}));

router.get('/elections', requireAuth, asyncHandler(async (req, res) => {
  if (!req.auth.estate) throw new HttpError(403, 'ESTATE_CONTEXT_REQUIRED', 'Select an estate workspace first.');
  const elections = await prisma.election.findMany({
    where: { estateId: req.auth.estate.id },
    include: { candidates: { include: { _count: { select: { votes: true } } } }, votes: { select: { voterMembershipId: true, candidateId: true } } },
    orderBy: [{ createdAt: 'desc' }], take: 100,
  });
  res.json({ data: elections.map((election) => electionDto(election, req.auth.membership?.id)), requestId: req.id });
}));

router.post('/elections/:id/vote', requireAuth, requireCsrf, validate(candidateParamsSchema, 'params'), asyncHandler(async (req, res) => {
  if (!req.auth.estate || !req.auth.membership) throw new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'An active household membership is required to vote.');
  const body = z.object({ candidateId: z.string().uuid() }).strict().safeParse(req.body);
  if (!body.success) throw new HttpError(422, 'VALIDATION_ERROR', 'Choose a candidate to vote for.', body.error.issues);
  const election = await prisma.election.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id }, include: { candidates: { select: { id: true } } } });
  if (!election || election.status !== 'OPEN' || election.closesAt < new Date()) throw new HttpError(409, 'ELECTION_CLOSED', 'This election is not accepting votes.');
  if (!election.candidates.some((candidate) => candidate.id === body.data.candidateId)) throw new HttpError(422, 'INVALID_CANDIDATE', 'Choose a candidate in this election.');
  const vote = await prisma.electionVote.findUnique({ where: { electionId_voterMembershipId: { electionId: election.id, voterMembershipId: req.auth.membership.id } } });
  if (vote) throw new HttpError(409, 'ALREADY_VOTED', 'Your vote in this election has already been recorded.');
  await prisma.$transaction(async (tx) => {
    await tx.electionVote.create({ data: { electionId: election.id, candidateId: body.data.candidateId, voterMembershipId: req.auth.membership.id } });
    await tx.auditEvent.create({ data: {
      scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id,
      action: 'COMMITTEE_ELECTION_VOTE_CAST', entityType: 'Election', entityId: election.id, requestId: req.id,
      metadata: {},
    } });
  });
  res.status(201).json({ data: { electionId: election.id, candidateId: body.data.candidateId }, requestId: req.id });
}));

router.post('/admin/elections/:id/close', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(candidateParamsSchema, 'params'), asyncHandler(async (req, res) => {
  const election = await prisma.election.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id }, include: { candidates: { include: { _count: { select: { votes: true } }, home: { select: { representativeId: true } } } } } });
  if (!election || election.status !== 'OPEN') throw new HttpError(404, 'ELECTION_NOT_OPEN', 'Open election not found.');
  const highest = Math.max(...election.candidates.map((candidate) => candidate._count.votes));
  const winners = election.candidates.filter((candidate) => candidate._count.votes === highest);
  const winner = highest > 0 && winners.length === 1 ? winners[0] : null;
  const result = await prisma.$transaction(async (tx) => {
    if (winner) await tx.estateMembership.update({ where: { id: winner.home.representativeId }, data: { role: 'COMMITTEE_MEMBER' } });
    const updated = await tx.election.update({ where: { id: election.id }, data: { status: winner ? 'CLOSED' : 'TIE_REVIEW', winnerCandidateId: winner?.id || null } });
    await tx.auditEvent.create({ data: {
      scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id,
      action: winner ? 'COMMITTEE_ELECTION_CLOSED' : 'COMMITTEE_ELECTION_TIE_REVIEW', entityType: 'Election', entityId: election.id, requestId: req.id,
      metadata: { winnerCandidateId: winner?.id || null },
    } });
    return updated;
  });
  res.json({ data: { id: result.id, status: result.status, winnerId: result.winnerCandidateId }, requestId: req.id });
}));

router.post('/admin/elections/:id/resolve', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(candidateParamsSchema, 'params'), asyncHandler(async (req, res) => {
  const body = z.object({ candidateId: z.string().uuid() }).strict().safeParse(req.body);
  if (!body.success) throw new HttpError(422, 'VALIDATION_ERROR', 'Select the confirmed winner.', body.error.issues);
  const election = await prisma.election.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id, status: 'TIE_REVIEW' }, include: { candidates: { include: { _count: { select: { votes: true } }, home: { select: { representativeId: true } } } } } });
  if (!election) throw new HttpError(404, 'TIED_ELECTION_NOT_FOUND', 'Tied election not found.');
  const highest = Math.max(...election.candidates.map((candidate) => candidate._count.votes));
  const tied = election.candidates.filter((candidate) => candidate._count.votes === highest);
  const winner = tied.find((candidate) => candidate.id === body.data.candidateId);
  if (!winner) throw new HttpError(422, 'INVALID_ELECTION_WINNER', 'The selected candidate is not tied for the lead.');
  await prisma.$transaction(async (tx) => {
    await tx.estateMembership.update({ where: { id: winner.home.representativeId }, data: { role: 'COMMITTEE_MEMBER' } });
    await tx.election.update({ where: { id: election.id }, data: { status: 'CLOSED', winnerCandidateId: winner.id } });
    await tx.auditEvent.create({ data: {
      scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id,
      action: 'COMMITTEE_ELECTION_TIE_RESOLVED', entityType: 'Election', entityId: election.id, requestId: req.id,
      metadata: { winnerCandidateId: winner.id },
    } });
  });
  res.json({ data: { id: election.id, status: 'Closed', winnerId: winner.id }, requestId: req.id });
}));

router.get('/admin/registration-requests', requireAuth, requireSuperAdminForEstate, asyncHandler(async (req, res) => {
  const parsedQuery = pageSchema.safeParse(req.query);
  if (!parsedQuery.success) throw new HttpError(422, 'VALIDATION_ERROR', 'Check the pagination values.', parsedQuery.error.issues);
  const query = parsedQuery.data;
  const where = { estateId: req.auth.estate.id, status: 'PENDING' };
  const [rows, total] = await prisma.$transaction([
    prisma.registrationRequest.findMany({
      where,
      include: { location: { select: { label: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.registrationRequest.count({ where }),
  ]);
  res.json({ data: rows.map(requestDto), pagination: { page: query.page, limit: query.limit, total }, requestId: req.id });
}));

router.get('/admin/locations', requireAuth, requireSuperAdminForEstate, asyncHandler(async (req, res) => {
  const locations = await prisma.estateLocation.findMany({
    where: { estateId: req.auth.estate.id, status: 'ACTIVE' },
    select: { id: true, label: true, locationType: true, status: true },
    orderBy: { label: 'asc' },
  });
  res.json({ data: locations.map((location) => ({ id: location.id, name: location.label, type: location.locationType, status: location.status })), requestId: req.id });
}));

router.post('/admin/locations', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(locationSchema), asyncHandler(async (req, res) => {
  const duplicate = await prisma.estateLocation.findFirst({
    where: { estateId: req.auth.estate.id, label: { equals: req.body.label, mode: 'insensitive' } },
    select: { id: true },
  });
  if (duplicate) throw new HttpError(409, 'LOCATION_EXISTS', 'A block or street with this name already exists.');
  const location = await prisma.$transaction(async (tx) => {
    const created = await tx.estateLocation.create({ data: {
      estateId: req.auth.estate.id,
      label: req.body.label,
      locationType: req.body.locationType,
      unitCode: '',
    } });
    await tx.auditEvent.create({ data: {
      scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id,
      action: 'LOCATION_CREATED', entityType: 'EstateLocation', entityId: created.id, requestId: req.id,
      metadata: { locationType: created.locationType },
    } });
    return created;
  });
  res.status(201).json({ data: { id: location.id, name: location.label, type: location.locationType }, requestId: req.id });
}));

router.post('/admin/locations/:id/deactivate', requireAuth, requireSuperAdminForEstate, requireCsrf, asyncHandler(async (req, res) => {
  if (!z.string().uuid().safeParse(req.params.id).success) throw new HttpError(404, 'LOCATION_NOT_FOUND', 'Location not found.');
  const result = await prisma.$transaction(async (tx) => {
    const location = await tx.estateLocation.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id } });
    if (!location) throw new HttpError(404, 'LOCATION_NOT_FOUND', 'Location not found.');
    const activeHousehold = await tx.household.findFirst({ where: {
      estateId: req.auth.estate.id, locationId: location.id, status: { in: ['PENDING_REVIEW', 'VERIFIED'] },
    }, select: { id: true } });
    const pendingRequest = await tx.registrationRequest.findFirst({ where: {
      estateId: req.auth.estate.id, locationId: location.id, status: 'PENDING',
    }, select: { id: true } });
    if (activeHousehold || pendingRequest) throw new HttpError(409, 'LOCATION_IN_USE', 'This location has a current household or pending registration.');
    const updated = await tx.estateLocation.update({ where: { id: location.id }, data: { status: 'INACTIVE' } });
    await tx.auditEvent.create({ data: {
      scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id,
      action: 'LOCATION_DEACTIVATED', entityType: 'EstateLocation', entityId: location.id, requestId: req.id,
      metadata: {},
    } });
    return updated;
  });
  res.json({ data: { id: result.id, status: result.status }, requestId: req.id });
}));

router.post('/admin/registration-requests/:id/approve', requireAuth, requireSuperAdminForEstate, requireCsrf, asyncHandler(async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) throw new HttpError(404, 'REQUEST_NOT_FOUND', 'Registration request not found.');

  let setupToken = null;
  const approved = await prisma.$transaction(async (tx) => {
    const request = await tx.registrationRequest.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id } });
    if (!request) throw new HttpError(404, 'REQUEST_NOT_FOUND', 'Registration request not found.');
    if (request.status !== 'PENDING') throw new HttpError(409, 'REQUEST_ALREADY_REVIEWED', 'This registration request has already been reviewed.');
    if (!request.locationId) throw new HttpError(409, 'LOCATION_REQUIRED', 'The registration request has no valid location.');

    const unitConflict = await tx.household.findFirst({
      where: {
        estateId: request.estateId,
        locationId: request.locationId,
        unitCode: { equals: request.unitCode, mode: 'insensitive' },
        status: { in: ['PENDING_REVIEW', 'VERIFIED'] },
      },
      select: { id: true },
    });
    if (unitConflict) throw new HttpError(409, 'HOUSEHOLD_ALREADY_REGISTERED', 'This unit already has a verified or pending household.');

    const users = await tx.user.findMany({ where: { OR: [{ email: request.email }, { phone: request.phone }] } });
    if (users.length > 1) throw new HttpError(409, 'ACCOUNT_CONFLICT', 'The email and phone belong to different accounts.');
    let user = users[0];
    if (user) {
      if ((user.email && user.email !== request.email) || (user.phone && user.phone !== request.phone)) {
        throw new HttpError(409, 'ACCOUNT_CONFLICT', 'The email or phone is already linked to another account.');
      }
      if (user.status !== 'ACTIVE') throw new HttpError(409, 'ACCOUNT_INACTIVE', 'The account linked to this request is not active.');
      const existingMembership = await tx.estateMembership.findUnique({ where: { estateId_userId: { estateId: request.estateId, userId: user.id } } });
      if (existingMembership) throw new HttpError(409, 'MEMBERSHIP_EXISTS', 'This account already has a membership in the estate.');
      if (!user.email || !user.phone || !user.fullName) {
        user = await tx.user.update({ where: { id: user.id }, data: {
          email: user.email || request.email,
          phone: user.phone || request.phone,
          fullName: user.fullName || request.fullName,
        } });
      }
    } else {
      user = await tx.user.create({ data: {
        fullName: request.fullName,
        email: request.email,
        phone: request.phone,
        mustResetPassword: true,
      } });                           
    }

    const membership = await tx.estateMembership.create({
      data: { estateId: request.estateId, userId: user.id, role: 'RESIDENT', status: 'ACTIVE', approvedById: req.auth.user.id, approvedAt: new Date() },
    });
    const household = await tx.household.create({ data: {
      estateId: request.estateId,
      locationId: request.locationId,
      representativeId: membership.id,
      unitCode: request.unitCode,
      occupancy: request.occupancy,
      householdSize: request.householdSize,       
      status: 'VERIFIED',
      nextOfKinName: request.nextOfKinName,
      nextOfKinPhone: request.nextOfKinPhone,
      nextOfKinEmail: request.nextOfKinEmail,
      verifiedById: req.auth.user.id,
      verifiedAt: new Date(),
    } });
    const updated = await tx.registrationRequest.update({
      where: { id: request.id },
      data: { status: 'APPROVED', reviewedById: req.auth.user.id, reviewedAt: new Date() },
    });
    await tx.auditEvent.create({ data: {
      scope: 'ESTATE', estateId: request.estateId, actorUserId: req.auth.user.id,
      action: 'REGISTRATION_APPROVED', entityType: 'RegistrationRequest', entityId: request.id,
      requestId: req.id, metadata: { membershipId: membership.id, householdId: household.id },
    } });
    if (user.mustResetPassword) {
      setupToken = createToken();
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await tx.passwordChallenge.updateMany({ where: { userId: user.id, purpose: 'INITIAL_PASSWORD', usedAt: null }, data: { usedAt: new Date() } });
      await tx.passwordChallenge.create({ data: {
        userId: user.id, tokenHash: hashToken(setupToken), purpose: 'INITIAL_PASSWORD', expiresAt,
      } });
      await tx.auditEvent.create({ data: {
        scope: 'ESTATE', estateId: request.estateId, actorUserId: req.auth.user.id,
        action: 'ACCOUNT_SETUP_LINK_CREATED', entityType: 'EstateMembership', entityId: membership.id,
        requestId: req.id, metadata: { expiresAt: expiresAt.toISOString() },
      } });
    }
    return { request: updated, user };
  }, { isolationLevel: 'Serializable' });

  const setupUrl = setupToken ? new URL('/setup-password', process.env.CLIENT_ORIGIN || 'http://localhost:5173') : null;
  if (setupUrl) setupUrl.searchParams.set('token', setupToken);
  res.json({ data: {
    id: approved.request.id,
    status: approved.request.status,
    accountSetupRequired: approved.user.mustResetPassword,
    setupUrl: setupUrl?.toString() || null,
  }, requestId: req.id });
}));

router.post('/admin/registration-requests/:id/decline', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(decisionSchema), asyncHandler(async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) throw new HttpError(404, 'REQUEST_NOT_FOUND', 'Registration request not found.');
  const declined = await prisma.$transaction(async (tx) => {
    const request = await tx.registrationRequest.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id } });
    if (!request) throw new HttpError(404, 'REQUEST_NOT_FOUND', 'Registration request not found.');
    if (request.status !== 'PENDING') throw new HttpError(409, 'REQUEST_ALREADY_REVIEWED', 'This registration request has already been reviewed.');
    const updated = await tx.registrationRequest.update({ where: { id: request.id }, data: {
      status: 'DECLINED', reviewedById: req.auth.user.id, reviewedAt: new Date(), reviewNote: req.body.note,
    } });
    await tx.auditEvent.create({ data: {
      scope: 'ESTATE', estateId: request.estateId, actorUserId: req.auth.user.id,
      action: 'REGISTRATION_DECLINED', entityType: 'RegistrationRequest', entityId: request.id,
      requestId: req.id, metadata: { noteProvided: Boolean(req.body.note) },
    } });
    return updated;
  });
  res.json({ data: { id: declined.id, status: declined.status }, requestId: req.id });
}));

module.exports = router;
