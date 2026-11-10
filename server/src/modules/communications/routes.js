const { Router } = require('express');
const { z } = require('zod');
const prisma = require('../../db/prisma');
const { HttpError, asyncHandler, validate } = require('../../http/errors');
const { requireAuth, requireCsrf } = require('../../middleware/auth');

const router = Router();
const paramsSchema = z.object({ id: z.string().uuid() }).strict();

router.get('/notifications', requireAuth, asyncHandler(async (req, res) => {
  if (!req.auth.estate || !req.auth.membership) throw new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'Select an estate workspace first.');
  const data = await prisma.estateNotification.findMany({ where: { estateId: req.auth.estate.id, userId: req.auth.user.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json({ data, requestId: req.id });
}));

router.get('/notifications/:id', requireAuth, validate(paramsSchema, 'params'), asyncHandler(async (req, res) => {
  if (!req.auth.estate || !req.auth.membership) throw new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'Select an estate workspace first.');
  const item = await prisma.estateNotification.findFirst({ where: { id: req.params.id, estateId: req.auth.estate.id, userId: req.auth.user.id } });
  if (!item) throw new HttpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
  if (!item.readAt) await prisma.estateNotification.update({ where: { id: item.id }, data: { readAt: new Date() } });
  res.json({ data: item, requestId: req.id });
}));

router.patch('/notifications/:id/read', requireAuth, requireCsrf, validate(paramsSchema, 'params'), asyncHandler(async (req, res) => {
  if (!req.auth.estate || !req.auth.membership) throw new HttpError(403, 'ESTATE_MEMBERSHIP_REQUIRED', 'Select an estate workspace first.');
  const result = await prisma.estateNotification.updateMany({ where: { id: req.params.id, estateId: req.auth.estate.id, userId: req.auth.user.id, readAt: null }, data: { readAt: new Date() } });
  if (!result.count) throw new HttpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
  res.json({ data: { read: true }, requestId: req.id });
}));

module.exports = router;
