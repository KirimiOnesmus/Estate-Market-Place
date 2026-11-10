const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { randomBytes } = require('node:crypto');

const prisma = require('../../db/prisma');
const { HttpError, asyncHandler, validate } = require('../../http/errors');
const { requireAuth, requireCsrf, requireSuperAdminForEstate } = require('../../middleware/auth');
const { safeEqual } = require('../../security/tokens');
const { DarajaError, darajaConfig, initiateB2CPayout, initiateStkPush, isB2CPayoutConfigured, isDarajaConfigured } = require('./daraja');

const router = Router();
const callbackLimit = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false });
const idSchema = z.object({ id: z.string().uuid() }).strict();
const paymentParamsSchema = z.object({ id: z.string().uuid(), paymentId: z.string().uuid() }).strict();
const paymentSchema = z.object({
  amount: z.coerce.number().int().min(1).max(250_000),
  phone: z.string().trim().min(9).max(18).transform(normalizePhone),
}).strict();
const marketplaceOrderSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(100_000),
  phone: z.string().trim().min(9).max(18).transform(normalizePhone),
  bidId: z.string().uuid().optional(),
}).strict();
const releaseOrderSchema = z.object({ payoutReference: z.string().trim().min(3).max(120).optional() }).strict();

router.get('/giving/status', requireAuth, (req, res) => {
  res.json({ data: { mpesaStkPushAvailable: isDarajaConfigured(), mpesaB2cPayoutAvailable: isB2CPayoutConfigured() }, requestId: req.id });
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

async function processMarketplaceCallback(order, callback, requestId) {
  if (['ESCROW_HELD', 'RELEASE_REQUESTED', 'RELEASED', 'PAYMENT_FAILED'].includes(order.status)) return;
  const resultCode = Number(callback.ResultCode);
  const description = typeof callback.ResultDesc === 'string' ? callback.ResultDesc.slice(0, 500) : null;
  if (resultCode !== 0) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.marketplaceOrder.updateMany({ where: { id: order.id, status: { in: ['PAYMENT_PENDING', 'REVIEW_REQUIRED'] } }, data: { status: 'PAYMENT_FAILED', resultCode, resultDescription: description } });
      if (updated.count) await tx.marketplaceListing.update({ where: { id: order.listingId }, data: { reservedQuantity: { decrement: order.quantity } } });
    });
    return;
  }
  const items = callbackItems(callback);
  const receipt = typeof items.MpesaReceiptNumber === 'string' ? items.MpesaReceiptNumber : null;
  const amount = Number(items.Amount);
  const phone = items.PhoneNumber == null ? null : String(items.PhoneNumber);
  if (!receipt || !Number.isFinite(amount) || amount !== order.totalAmount || phone !== order.phone) {
    await prisma.marketplaceOrder.updateMany({ where: { id: order.id, status: { in: ['PAYMENT_PENDING', 'REVIEW_REQUIRED'] } }, data: { status: 'REVIEW_REQUIRED', resultCode, resultDescription: 'Safaricom callback did not match the requested amount and phone number. Inventory remains reserved pending reconciliation.' } });
    return;
  }
  let paymentHeld = false;
  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.marketplaceOrder.updateMany({ where: { id: order.id, status: { in: ['PAYMENT_PENDING', 'REVIEW_REQUIRED'] } }, data: { status: 'ESCROW_HELD', mpesaReceiptNumber: receipt, resultCode, resultDescription: description, heldAt: new Date() } });
      if (!updated.count) return;
      paymentHeld = true;
      const listing = await tx.marketplaceListing.findUnique({ where: { id: order.listingId }, select: { quantity: true } });
      await tx.marketplaceListing.update({ where: { id: order.listingId }, data: { quantity: { decrement: order.quantity }, reservedQuantity: { decrement: order.quantity }, ...(listing.quantity <= order.quantity ? { status: 'SOLD' } : {}) } });
      await tx.auditEvent.create({ data: { scope: 'ESTATE', estateId: order.estateId, action: 'MARKETPLACE_ESCROW_FUNDS_HELD', entityType: 'MarketplaceOrder', entityId: order.id, requestId, metadata: { reference: order.reference, amount: order.totalAmount, receipt } } });
    });
  } catch (error) {
    if (error.code !== 'P2002') throw error;
    await prisma.marketplaceOrder.updateMany({ where: { id: order.id, status: { in: ['PAYMENT_PENDING', 'REVIEW_REQUIRED'] } }, data: { status: 'REVIEW_REQUIRED', resultCode, resultDescription: 'M-Pesa receipt is already recorded on another marketplace order. Reconciliation is required.' } });
  }
  if (paymentHeld) await initiateMarketplaceSellerPayout(order.id, requestId);
}

async function initiateMarketplaceSellerPayout(orderId, requestId, actorUserId = null) {
  const order = await prisma.marketplaceOrder.findUnique({ where: { id: orderId }, include: marketplaceOrderInclude });
  if (!order) return;
  if (!validKenyanPhone(order.sellerMpesaPhone || '') || !isB2CPayoutConfigured()) {
    await prisma.marketplaceOrder.updateMany({ where: { id: order.id, status: 'ESCROW_HELD' }, data: { status: 'PAYOUT_REVIEW_REQUIRED', resultDescription: 'The seller M-Pesa number or Safaricom B2C configuration is missing. Reconcile this payment before proceeding.' } });
    return;
  }
  const claimed = await prisma.marketplaceOrder.updateMany({ where: { id: order.id, status: 'ESCROW_HELD' }, data: { status: 'PAYOUT_INITIATING' } });
  if (!claimed.count) return;
  try {
    const payout = await initiateB2CPayout({ phone: order.sellerMpesaPhone, amount: order.totalAmount, reference: order.reference });
    await prisma.marketplaceOrder.update({ where: { id: order.id }, data: { status: 'PAYOUT_PENDING', originatorConversationId: payout.originatorConversationId, payoutConversationId: payout.conversationId, releasedByUserId: actorUserId } });
    await prisma.auditEvent.create({ data: { scope: 'ESTATE', estateId: order.estateId, ...(actorUserId ? { actorUserId } : {}), action: 'MARKETPLACE_PAYOUT_INITIATED', entityType: 'MarketplaceOrder', entityId: order.id, requestId, metadata: { reference: order.reference, destination: order.sellerMpesaPhone, conversationId: payout.conversationId } } });
  } catch (error) {
    const safe = error instanceof DarajaError && error.safeToFail;
    const resultDescription = safe ? error.message : 'Safaricom may have accepted the seller payout. Check the payout status before retrying.';
    await prisma.marketplaceOrder.update({ where: { id: order.id }, data: { status: safe ? 'PAYOUT_FAILED' : 'PAYOUT_REVIEW_REQUIRED', resultDescription } });
    await prisma.auditEvent.create({ data: { scope: 'ESTATE', estateId: order.estateId, ...(actorUserId ? { actorUserId } : {}), action: safe ? 'MARKETPLACE_PAYOUT_FAILED' : 'MARKETPLACE_PAYOUT_REVIEW_REQUIRED', entityType: 'MarketplaceOrder', entityId: order.id, requestId, metadata: { reference: order.reference } } });
  }
}

function marketplaceOrderDto(order) {
  return { id: order.id, reference: order.reference, listingId: order.listingId, title: order.listing?.title || '', quantity: order.quantity, unitPrice: order.unitPrice, amount: order.totalAmount, phone: order.phone, status: order.status, receiptNumber: order.mpesaReceiptNumber, message: order.resultDescription, payoutReference: order.payoutReference, createdAt: order.createdAt, heldAt: order.heldAt, releasedAt: order.releasedAt };
}

const marketplaceOrderInclude = { listing: { select: { title: true } } };

router.post('/marketplace/listings/:id/orders', requireAuth, requireCsrf, validate(idSchema, 'params'), validate(marketplaceOrderSchema), asyncHandler(async (req, res) => {
  if (!req.auth.estate || !req.auth.membership) throw new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'An active resident membership is required to buy marketplace items.');
  if (!validKenyanPhone(req.body.phone)) throw new HttpError(422, 'INVALID_MPESA_PHONE', 'Enter a valid Kenyan M-Pesa number, such as 0712345678.');
  if (!isDarajaConfigured()) throw new HttpError(503, 'MPESA_NOT_CONFIGURED', 'M-Pesa STK Push is not configured yet. Set up the Daraja credentials and public callback URL.');
  if (!isB2CPayoutConfigured()) throw new HttpError(503, 'MPESA_B2C_NOT_CONFIGURED', 'Seller payouts are not configured yet. Set up the Safaricom B2C credentials and public callback URL before accepting marketplace payments.');

  const order = await prisma.$transaction(async (tx) => {
    const listing = await tx.marketplaceListing.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id, status: 'APPROVED' } });
    if (!listing) throw new HttpError(404, 'LISTING_NOT_FOUND', 'This marketplace item is no longer available.');
    if (listing.sellerMembershipId === req.auth.membership.id) throw new HttpError(403, 'SELLER_CANNOT_BUY', 'You cannot buy your own marketplace listing.');
    if (!validKenyanPhone(listing.sellerMpesaPhone || '')) throw new HttpError(409, 'SELLER_MPESA_PHONE_MISSING', 'The seller needs to add a valid M-Pesa phone number before this item can be purchased.');
    let unitPrice = listing.price;
    let bidId = null;
    const acceptedBid = await tx.marketplaceBid.findFirst({ where: { listingId: listing.id, status: 'ACCEPTED' }, select: { id: true, bidderMembershipId: true } });
    if (acceptedBid && acceptedBid.id !== req.body.bidId) throw new HttpError(409, 'ACCEPTED_BID_ONLY', acceptedBid.bidderMembershipId === req.auth.membership.id ? 'The seller accepted your offer. Continue using the accepted offer price.' : 'The seller has accepted another resident’s offer; this item is reserved for that buyer.');
    if (req.body.bidId) {
      const bid = await tx.marketplaceBid.findFirst({ where: { id: req.body.bidId, listingId: listing.id, bidderMembershipId: req.auth.membership.id, status: 'ACCEPTED' } });
      if (!bid) throw new HttpError(409, 'BID_NOT_ACCEPTED', 'The seller has not accepted this offer.');
      unitPrice = bid.amount;
      bidId = bid.id;
      if (req.body.quantity !== 1) throw new HttpError(422, 'ACCEPTED_BID_QUANTITY', 'Accepted offers are for one item.');
    }
    const available = listing.quantity - listing.reservedQuantity;
    if (available < req.body.quantity) throw new HttpError(409, 'INSUFFICIENT_STOCK', 'The requested quantity is no longer available.');
    const totalAmount = unitPrice * req.body.quantity;
    if (!Number.isSafeInteger(totalAmount) || totalAmount > 250_000) throw new HttpError(422, 'ORDER_AMOUNT_LIMIT', 'Marketplace M-Pesa orders must total KSh 250,000 or less.');
    const activeOrder = await tx.marketplaceOrder.findFirst({ where: { listingId: listing.id, status: { in: ['PAYMENT_PENDING', 'ESCROW_HELD', 'RELEASE_REQUESTED', 'RELEASED'] } }, select: { id: true } });
    if (activeOrder && listing.quantity - listing.reservedQuantity <= 0) throw new HttpError(409, 'LISTING_CHECKOUT_STARTED', 'This item is already reserved by another buyer.');
    await tx.marketplaceListing.update({ where: { id: listing.id }, data: { reservedQuantity: { increment: req.body.quantity } } });
    const reference = `MP-${randomBytes(5).toString('hex').toUpperCase()}`;
    const created = await tx.marketplaceOrder.create({ data: {
      reference, estateId: listing.estateId, listingId: listing.id, buyerMembershipId: req.auth.membership.id,
      sellerMembershipId: listing.sellerMembershipId, sellerMpesaPhone: listing.sellerMpesaPhone, bidId, quantity: req.body.quantity, unitPrice,
      totalAmount, phone: req.body.phone, status: 'PAYMENT_PENDING',
    }, include: marketplaceOrderInclude });
    await tx.auditEvent.create({ data: { scope: 'ESTATE', estateId: listing.estateId, actorUserId: req.auth.user.id, action: 'MARKETPLACE_ORDER_CREATED', entityType: 'MarketplaceOrder', entityId: created.id, requestId: req.id, metadata: { reference, amount: totalAmount, listingId: listing.id } } });
    return created;
  }, { isolationLevel: 'Serializable' });

  try {
    const provider = await initiateStkPush({ phone: order.phone, amount: order.totalAmount, reference: order.reference, description: `Marketplace order ${order.reference}` });
    const updated = await prisma.marketplaceOrder.update({ where: { id: order.id }, data: { merchantRequestId: provider.merchantRequestId, checkoutRequestId: provider.checkoutRequestId, resultDescription: provider.customerMessage }, include: marketplaceOrderInclude });
    res.status(201).json({ data: marketplaceOrderDto(updated), requestId: req.id });
  } catch (error) {
    const safelyFailed = error instanceof DarajaError && error.safeToFail;
    await prisma.$transaction(async (tx) => {
      await tx.marketplaceOrder.update({ where: { id: order.id }, data: { status: safelyFailed ? 'PAYMENT_FAILED' : 'REVIEW_REQUIRED', resultDescription: safelyFailed ? error.message : 'Safaricom did not confirm the request. The reserved item is held until this payment is reconciled.' } });
      if (safelyFailed) await tx.marketplaceListing.update({ where: { id: order.listingId }, data: { reservedQuantity: { decrement: order.quantity } } });
    });
    if (error instanceof DarajaError) throw new HttpError(error.status, 'MPESA_REQUEST_FAILED', error.message);
    throw error;
  }
}));

router.get('/marketplace/orders/me', requireAuth, asyncHandler(async (req, res) => {
  if (!req.auth.estate || !req.auth.membership) throw new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'An active resident membership is required.');
  const orders = await prisma.marketplaceOrder.findMany({ where: { estateId: req.auth.estate.id, buyerMembershipId: req.auth.membership.id }, include: marketplaceOrderInclude, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json({ data: orders.map(marketplaceOrderDto), requestId: req.id });
}));

router.get('/marketplace/orders/:orderId', requireAuth, validate(z.object({ orderId: z.string().uuid() }).strict(), 'params'), asyncHandler(async (req, res) => {
  if (!req.auth.estate || !req.auth.membership) throw new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'An active resident membership is required.');
  const order = await prisma.marketplaceOrder.findFirst({ where: { id: req.params.orderId, estateId: req.auth.estate.id, buyerMembershipId: req.auth.membership.id }, include: marketplaceOrderInclude });
  if (!order) throw new HttpError(404, 'ORDER_NOT_FOUND', 'Marketplace order not found.');
  res.json({ data: marketplaceOrderDto(order), requestId: req.id });
}));

router.post('/marketplace/orders/:orderId/received', requireAuth, requireCsrf, validate(z.object({ orderId: z.string().uuid() }).strict(), 'params'), asyncHandler(async (req, res) => {
  if (!req.auth.estate || !req.auth.membership) throw new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'An active resident membership is required.');
  const updated = await prisma.marketplaceOrder.updateMany({ where: { id: req.params.orderId, estateId: req.auth.estate.id, buyerMembershipId: req.auth.membership.id, status: 'ESCROW_HELD' }, data: { status: 'RELEASE_REQUESTED' } });
  if (!updated.count) throw new HttpError(409, 'ORDER_NOT_READY_FOR_RELEASE', 'Confirm delivery only after the payment is held and the item has arrived.');
  const order = await prisma.marketplaceOrder.findUnique({ where: { id: req.params.orderId }, include: marketplaceOrderInclude });
  await prisma.auditEvent.create({ data: { scope: 'ESTATE', estateId: req.auth.estate.id, actorUserId: req.auth.user.id, action: 'MARKETPLACE_DELIVERY_CONFIRMED', entityType: 'MarketplaceOrder', entityId: order.id, requestId: req.id, metadata: { reference: order.reference } } });
  res.json({ data: marketplaceOrderDto(order), requestId: req.id });
}));

router.get('/admin/marketplace/orders', requireAuth, requireSuperAdminForEstate, asyncHandler(async (req, res) => {
  const orders = await prisma.marketplaceOrder.findMany({ where: { estateId: req.auth.estate.id }, include: { ...marketplaceOrderInclude, buyer: { include: { user: { select: { fullName: true } } } }, seller: { include: { user: { select: { fullName: true, phone: true } } } } }, orderBy: { createdAt: 'desc' }, take: 500 });
  res.json({ data: orders.map((order) => ({ ...marketplaceOrderDto(order), buyer: order.buyer.user.fullName || 'Resident', seller: order.seller.user.fullName || 'Resident', sellerPhone: order.sellerMpesaPhone })), meta: { mpesaB2cPayoutAvailable: isB2CPayoutConfigured() }, requestId: req.id });
}));

router.post('/admin/marketplace/orders/:orderId/release', requireAuth, requireSuperAdminForEstate, requireCsrf, validate(z.object({ orderId: z.string().uuid() }).strict(), 'params'), validate(releaseOrderSchema), asyncHandler(async (req, res) => {
  const order = await prisma.marketplaceOrder.findFirst({ where: { id: req.params.orderId, estateId: req.auth.estate.id, status: { in: ['ESCROW_HELD', 'RELEASE_REQUESTED', 'PAYOUT_FAILED', 'PAYOUT_REVIEW_REQUIRED'] } }, include: { ...marketplaceOrderInclude, seller: { include: { user: { select: { phone: true } } } } } });
  if (!order) throw new HttpError(409, 'ORDER_NOT_READY_FOR_RELEASE', 'Only orders with buyer delivery confirmation can be released.');
  const canSafelyStartB2c = isB2CPayoutConfigured() && order.status !== 'PAYOUT_REVIEW_REQUIRED';
  if (canSafelyStartB2c) {
    if (!validKenyanPhone(order.sellerMpesaPhone || '')) throw new HttpError(422, 'SELLER_PHONE_INVALID', 'The seller needs a valid M-Pesa number on this listing before payout.');
    const claimed = await prisma.marketplaceOrder.updateMany({ where: { id: order.id, status: order.status }, data: { status: 'PAYOUT_INITIATING' } });
    if (!claimed.count) throw new HttpError(409, 'PAYOUT_ALREADY_STARTED', 'A payout has already been started for this order.');
    try {
      const payout = await initiateB2CPayout({ phone: order.sellerMpesaPhone, amount: order.totalAmount, reference: order.reference });
      const updated = await prisma.marketplaceOrder.update({ where: { id: order.id }, data: { status: 'PAYOUT_PENDING', originatorConversationId: payout.originatorConversationId, payoutConversationId: payout.conversationId, releasedByUserId: req.auth.user.id } , include: marketplaceOrderInclude });
      await prisma.auditEvent.create({ data: { scope: 'ESTATE', estateId: order.estateId, actorUserId: req.auth.user.id, action: 'MARKETPLACE_PAYOUT_INITIATED', entityType: 'MarketplaceOrder', entityId: order.id, requestId: req.id, metadata: { reference: order.reference, conversationId: payout.conversationId } } });
      return res.json({ data: marketplaceOrderDto(updated), requestId: req.id });
    } catch (error) {
      const safe = error instanceof DarajaError && error.safeToFail;
      await prisma.marketplaceOrder.update({ where: { id: order.id }, data: { status: safe ? 'RELEASE_REQUESTED' : 'PAYOUT_REVIEW_REQUIRED', resultDescription: safe ? error.message : 'Safaricom may have received the payout request. Reconcile its status before retrying.' } });
      if (error instanceof DarajaError) throw new HttpError(error.status, 'MPESA_PAYOUT_FAILED', error.message);
      throw error;
    }
  }
  if (!req.body.payoutReference) throw new HttpError(422, 'PAYOUT_REFERENCE_REQUIRED', 'Enter the external payout reference.');
  const result = await prisma.marketplaceOrder.updateMany({ where: { id: order.id, status: order.status }, data: { status: 'RELEASED', payoutReference: req.body.payoutReference, releasedByUserId: req.auth.user.id, releasedAt: new Date() } });
  if (!result.count) throw new HttpError(409, 'ORDER_NOT_READY_FOR_RELEASE', 'This order has already been released.');
  const updated = await prisma.marketplaceOrder.findUnique({ where: { id: order.id }, include: marketplaceOrderInclude });
  await prisma.auditEvent.create({ data: { scope: 'ESTATE', estateId: order.estateId, actorUserId: req.auth.user.id, action: 'MARKETPLACE_ESCROW_RELEASED', entityType: 'MarketplaceOrder', entityId: order.id, requestId: req.id, metadata: { reference: order.reference, payoutReference: req.body.payoutReference } } });
  res.json({ data: marketplaceOrderDto(updated), requestId: req.id });
}));

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
  if (!payment) {
    const order = await prisma.marketplaceOrder.findUnique({ where: { checkoutRequestId } });
    if (order) await processMarketplaceCallback(order, callback, req.id);
    return res.json({ ResultCode: 0, ResultDesc: order ? 'Marketplace order callback accepted' : 'Accepted' });
  }
  if (payment.status === 'COMPLETED' || payment.status === 'FAILED') return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

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

router.post('/mpesa/b2c/result/:secret', callbackLimit, asyncHandler(async (req, res) => {
  const configuredSecret = darajaConfig().callbackSecret || '';
  if (!configuredSecret || !safeEqual(req.params.secret, configuredSecret)) throw new HttpError(404, 'CALLBACK_NOT_FOUND', 'Callback route not found.');
  const result = req.body?.Result;
  const originatorId = result?.OriginatorConversationID;
  if (typeof originatorId !== 'string' || originatorId.length > 100) throw new HttpError(400, 'INVALID_MPESA_CALLBACK', 'Invalid payout callback.');
  const order = await prisma.marketplaceOrder.findUnique({ where: { originatorConversationId: originatorId } });
  if (!order || order.status !== 'PAYOUT_PENDING') return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  const resultCode = Number(result.ResultCode);
  const params = result?.ResultParameters?.ResultParameter || [];
  const receipt = params.find((item) => item.Key === 'TransactionReceipt')?.Value;
  if (resultCode === 0 && typeof receipt === 'string' && receipt) {
    const updated = await prisma.marketplaceOrder.updateMany({ where: { id: order.id, status: 'PAYOUT_PENDING' }, data: { status: 'RELEASED', payoutReference: receipt, releasedAt: new Date(), resultCode, resultDescription: 'Safaricom confirmed seller payout.' } });
    if (updated.count) await prisma.auditEvent.create({ data: { scope: 'ESTATE', estateId: order.estateId, action: 'MARKETPLACE_ESCROW_RELEASED', entityType: 'MarketplaceOrder', entityId: order.id, metadata: { reference: order.reference, payoutReference: receipt, channel: 'MPESA_B2C' } } });
  } else {
    const confirmedFailure = Number.isFinite(resultCode) && resultCode !== 0;
    await prisma.marketplaceOrder.updateMany({ where: { id: order.id, status: 'PAYOUT_PENDING' }, data: { status: confirmedFailure ? 'PAYOUT_FAILED' : 'PAYOUT_REVIEW_REQUIRED', resultCode: Number.isFinite(resultCode) ? resultCode : null, resultDescription: typeof result.ResultDesc === 'string' ? result.ResultDesc.slice(0, 500) : 'Safaricom payout result needs reconciliation.' } });
  }
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}));

router.post('/mpesa/b2c/timeout/:secret', callbackLimit, asyncHandler(async (req, res) => {
  const configuredSecret = darajaConfig().callbackSecret || '';
  if (!configuredSecret || !safeEqual(req.params.secret, configuredSecret)) throw new HttpError(404, 'CALLBACK_NOT_FOUND', 'Callback route not found.');
  const originatorId = req.body?.Result?.OriginatorConversationID || req.body?.OriginatorConversationID;
  if (typeof originatorId === 'string' && originatorId.length <= 100) {
    await prisma.marketplaceOrder.updateMany({ where: { originatorConversationId: originatorId, status: 'PAYOUT_PENDING' }, data: { status: 'PAYOUT_REVIEW_REQUIRED', resultDescription: 'Safaricom payout timed out. Reconcile its status before attempting another payout.' } });
  }
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}));

module.exports = router;
