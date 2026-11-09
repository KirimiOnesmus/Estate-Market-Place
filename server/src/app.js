require('dotenv').config();
require('./config/database-url')();

const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const env = require('./config/env');
const prisma = require('./db/prisma');
const errorHandler = require('./middleware/error-handler');
const notFound = require('./middleware/not-found');
const requestId = require('./middleware/request-id');
const authRoutes = require('./modules/auth/routes');
const householdRoutes = require('./modules/households/routes');
const givingRoutes = require('./modules/giving/routes');
const platformRoutes = require('./modules/platform/routes');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '24mb' }));
app.use(requestId);
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/v1/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

app.get('/api/v1/ready', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ data: { status: 'ready', database: 'connected' } });
  } catch (error) {
    next(Object.assign(error, { status: 503, code: 'DATABASE_UNAVAILABLE' }));
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', platformRoutes);
app.use('/api/v1', givingRoutes);
app.use('/api/v1', householdRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
