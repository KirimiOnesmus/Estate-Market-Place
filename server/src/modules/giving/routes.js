const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const prisma = require('../../db/prisma');
const { HttpError, asyncHandler, validate } = require('../../http/errors');
const { requireAuth, requireCsrf, requireSuperAdminForEstate } = require('../../middleware/auth');
const { safeEqual } = require('../../security/tokens');
const { DarajaError, darajaConfig, initiateStkPush, isDarajaConfigured } = require('./daraja');

const router = Router();
const callbackLimit = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false });
const idSchema = z.object({ id: z.string().uuid() }).strict();
const paymentParamsSchema = z.object({ id: z.string().uuid(), paymentId: z.string().uuid() }).strict();
const paymentSchema = z.object({
  amount: z.coerce.number().int().min(1).max(250_000),
  phone: z.string().trim().min(9).max(18).transform(normalizePhone),
}).strict();

router.get('/giving/status', requireAuth, (req, res) => {
  res.json({ data: { mpesaStkPushAvailable: isDarajaConfigured() }, requestId: req.id });
});

function normalizePhone(input) {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) return `254${digits}`;
  return input;
}

function validKenyanPhone(value) {
  return /^254(?:7\d{8}|1\d{8})$/.test(value);
}

function paymentDto(payment) {
  return {
    id: payment.id,
    campaignId: payment.campaignId,
    amount: payment.amount,
    phone: payment.phone,
    status: payment.status,
    receiptNumber: payment.mpesaReceiptNumber,
    message: payment.resultDescription,
    createdAt: payment.createdAt,
    completedAt: payment.completedAt,
  };
}

function callbackItems(callback) {
  return Object.fromEntries((callback?.CallbackMetadata?.Item || []).map((item) => [item.Name, item.Value]));
}

router.post('/campaigns/:id/payments', requireAuth, requireCsrf, validate(idSchema, 'params'), validate(paymentSchema), asyncHandler(async (req, res) => {
  if (!req.auth.estate || !req.auth.membership) throw new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'An active resident membership is required to make a contribution.');
  if (!validKenyanPhone(req.body.phone)) throw new HttpError(422, 'INVALID_MPESA_PHONE', 'Enter a valid Kenyan M-Pesa number, such as 0712345678.');
  if (!isDarajaConfigured()) throw new HttpError(503, 'MPESA_NOT_CONFIGURED', 'M-Pesa STK Push is not configured yet. Contact the estate administrator.');

  const today = new Date();
  const payment = await prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id, status: 'LIVE' } });
    if (!campaign) throw new HttpError(404, 'CAMPAIGN_NOT_FOUND', 'This campaign is not accepting contributions.');
    if (new Date(`${campaign.deadline.toISOString().slice(0, 10)}T23:59:59.999Z`) < today) throw new HttpError(409, 'CAMPAIGN_CLOSED', 'The contribution deadline for this campaign has passed.');

    if (campaign.beneficiaryType === 'ESTATE') {
      const household = await tx.household.findFirst({ where: { estateId: campaign.estateId, representativeId: req.auth.membership.id, status: 'VERIFIED' } });
      if (!household) throw new HttpError(403, 'VERIFIED_HOUSEHOLD_REQUIRED', 'A verified household is required to contribute to an estate assessment.');
      const reserved = await tx.campaignPayment.aggregate({
        where: { campaignId: campaign.id, contributorMembershipId: req.auth.membership.id, status: { in: ['INITIATED', 'PENDING', 'COMPLETED', 'REVIEW_REQUIRED'] } },
        _sum: { amount: true },
      });
      const remaining = Math.max(0, Number(campaign.householdContribution || 0) - Number(reserved._sum.amount || 0));
      if (!remaining) throw new HttpError(409, 'ASSESSMENT_PAID', 'Your household contribution is already covered.');
      if (req.body.amount > remaining) throw new HttpError(422, 'AMOUNT_EXCEEDS_BALANCE', `Enter an amount up to KSh ${remaining}.`);
    }

    return tx.campaignPayment.create({ data: {
      campaignId: campaign.id,
      contributorMembershipId: req.auth.membership.id,
      amount: req.body.amount,
      phone: req.body.phone,
      status: 'INITIATED',
    } });
  }, { isolationLevel: 'Serializable' });

  try {
    const provider = await initiateStkPush({
      phone: payment.phone,
      amount: payment.amount,
      reference: payment.id.replaceAll('-', '').slice(0, 12).toUpperCase(),
      description: `Estate campaign ${req.params.id.slice(0, 8)}`,
    });
    const updated = await prisma.campaignPayment.update({ where: { id: payment.id }, data: {
      status: 'PENDING',
      merchantRequestId: provider.merchantRequestId,
      checkoutRequestId: provider.checkoutRequestId,
      resultDescription: provider.customerMessage,
    } });
    return res.status(201).json({ data: paymentDto(updated), requestId: req.id });
  } catch (error) {
    const safelyFailed = error instanceof DarajaError && error.safeToFail;
    await prisma.campaignPayment.update({ where: { id: payment.id }, data: {
      status: safelyFailed ? 'FAILED' : 'REVIEW_REQUIRED',
      resultDescription: safelyFailed ? error.message : 'Safaricom response was not received. Do not retry until this payment is checked.',
    } });
    if (error instanceof DarajaError) throw new HttpError(error.status, 'MPESA_REQUEST_FAILED', error.message);
    throw error;
  }
}));

router.get('/campaigns/:id/payments/me', requireAuth, validate(idSchema, 'params'), asyncHandler(async (req, res) => {
  if (!req.auth.estate || !req.auth.membership) throw new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'An active resident membership is required.');
  const campaign = await prisma.campaign.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id } });
  if (!campaign) throw new HttpError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found.');
  const payments = await prisma.campaignPayment.findMany({ where: { campaignId: campaign.id, contributorMembershipId: req.auth.membership.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json({ data: payments.map(paymentDto), requestId: req.id });
}));

router.get('/campaigns/:id/payments/:paymentId', requireAuth, validate(paymentParamsSchema, 'params'), asyncHandler(async (req, res) => {
  if (!req.auth.estate || !req.auth.membership) throw new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'An active resident membership is required.');
  const payment = await prisma.campaignPayment.findFirst({ where: {
    id: req.params.paymentId,
    campaignId: req.params.id,
    contributorMembershipId: req.auth.membership.id,
    campaign: { estateId: req.auth.estate.id },
  } });
  if (!payment) throw new HttpError(404, 'PAYMENT_NOT_FOUND', 'Payment request not found.');
  res.json({ data: paymentDto(payment), requestId: req.id });
}));

router.get('/admin/campaigns/:id/payments', requireAuth, requireSuperAdminForEstate, validate(idSchema, 'params'), asyncHandler(async (req, res) => {
  const campaign = await prisma.campaign.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id }, select: { id: true } });
  if (!campaign) throw new HttpError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found.');
  const payments = await prisma.campaignPayment.findMany({
    where: { campaignId: campaign.id },
    include: { contributor: { include: { user: { select: { fullName: true } }, households: { include: { location: { select: { label: true } } }, take: 1 } } } },
    orderBy: { createdAt: 'desc' }, take: 500,
  });
  res.json({ data: payments.map((payment) => ({
    ...paymentDto(payment),
    resident: payment.contributor.user.fullName || 'Resident',
    unit: payment.contributor.households[0] ? `${payment.contributor.households[0].location.label} · ${payment.contributor.households[0].unitCode}` : 'Estate resident',
  })), requestId: req.id });
}));

router.post('/mpesa/stk/callback/:secret', callbackLimit, asyncHandler(async (req, res) => {
  const configuredSecret = darajaConfig().callbackSecret || '';
  if (!configuredSecret || !safeEqual(req.params.secret, configuredSecret)) throw new HttpError(404, 'CALLBACK_NOT_FOUND', 'Callback route not found.');
  const callback = req.body?.Body?.stkCallback;
  const checkoutRequestId = callback?.CheckoutRequestID;
  if (typeof checkoutRequestId !== 'string' || checkoutRequestId.length > 100) throw new HttpError(400, 'INVALID_MPESA_CALLBACK', 'Invalid payment callback.');

  const payment = await prisma.campaignPayment.findUnique({ where: { checkoutRequestId } });
  if (!payment || payment.status === 'COMPLETED' || payment.status === 'FAILED') return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  const resultCode = Number(callback.ResultCode);
  const description = typeof callback.ResultDesc === 'string' ? callback.ResultDesc.slice(0, 500) : null;
  if (resultCode !== 0) {
    await prisma.campaignPayment.updateMany({ where: { id: payment.id, status: { in: ['PENDING', 'INITIATED', 'REVIEW_REQUIRED'] } }, data: { status: 'FAILED', resultCode, resultDescription: description } });
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  const items = callbackItems(callback);
  const receipt = typeof items.MpesaReceiptNumber === 'string' ? items.MpesaReceiptNumber : null;
  const amount = Number(items.Amount);
  const phone = items.PhoneNumber == null ? null : String(items.PhoneNumber);
  const matches = Boolean(receipt) && Number.isFinite(amount) && amount === payment.amount && phone === payment.phone;
  if (!matches) {
    await prisma.campaignPayment.updateMany({ where: { id: payment.id, status: { in: ['PENDING', 'INITIATED', 'REVIEW_REQUIRED'] } }, data: {
      status: 'REVIEW_REQUIRED', resultCode, resultDescription: 'Safaricom callback did not match the requested amount and phone number.',
    } });
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted for reconciliation' });
  }

  try {
    await prisma.campaignPayment.updateMany({ where: { id: payment.id, status: { in: ['PENDING', 'INITIATED', 'REVIEW_REQUIRED'] } }, data: {
      status: 'COMPLETED', mpesaReceiptNumber: receipt, resultCode, resultDescription: description, completedAt: new Date(),
    } });
  } catch (error) {
    if (error.code !== 'P2002') throw error;
    await prisma.campaignPayment.updateMany({ where: { id: payment.id, status: { in: ['PENDING', 'INITIATED', 'REVIEW_REQUIRED'] } }, data: {
      status: 'REVIEW_REQUIRED', resultCode, resultDescription: 'M-Pesa receipt is already linked to another payment. Reconciliation is required.',
    } });
  }
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}));

module.exports = router;
