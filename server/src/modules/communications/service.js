const crypto = require('node:crypto');
const nodemailer = require('nodemailer');
const prisma = require('../../db/prisma');

const EVENTS = {
  ACCOUNT_REGISTERED: { title: 'Registration received', channels: ['email'] },
  ACCOUNT_APPROVED: { title: 'Estate account approved', channels: ['whatsapp'] },
  PASSWORD_UPDATED: { title: 'Password updated', channels: ['email'] },
  SUPPORT_CREATED: { title: 'Support request received', channels: ['email', 'whatsapp'] },
  SUPPORT_UPDATED: { title: 'Support request updated', channels: ['email', 'whatsapp'] },
  ISSUE_REPORT_CREATED: { title: 'New resident issue report', channels: ['email', 'whatsapp'] },
  ISSUE_REPORT_UPDATED: { title: 'Issue report updated', channels: ['email', 'whatsapp'] },
  MARKETPLACE_LISTING_SUBMITTED: { title: 'Marketplace listing submitted', channels: ['email'] },
  MARKETPLACE_LISTING_APPROVED: { title: 'New marketplace item', channels: ['email', 'whatsapp'] },
  CAMPAIGN_CREATED: { title: 'Campaign submitted', channels: ['email'] },
  CAMPAIGN_DECISION: { title: 'Campaign review decision', channels: ['email', 'whatsapp'] },
  CAMPAIGN_PUBLISHED: { title: 'New community campaign', channels: ['email', 'whatsapp'] },
  ELECTION_CREATED: { title: 'Election opened', channels: ['email', 'whatsapp'] },
  ELECTION_COMPLETED: { title: 'Election results', channels: ['email', 'whatsapp'] },
};

function encryptionKey() {
  const value = process.env.COMMUNICATIONS_ENCRYPTION_KEY || '';
  const key = /^[a-f\d]{64}$/i.test(value) ? Buffer.from(value, 'hex') : Buffer.from(value, 'base64');
  if (key.length !== 32) throw new Error('COMMUNICATIONS_ENCRYPTION_KEY must encode exactly 32 bytes (64 hex characters recommended).');
  return key;
}

function encryptSecret(value) {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${encrypted.toString('base64')}`;
}

function decryptSecret(value) {
  if (!value) return '';
  const [iv, tag, encrypted] = value.split('.').map((part) => Buffer.from(part, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function publicSettings(settings) {
  const { smtpPasswordEncrypted, whatsappAccessTokenEncrypted, ...safe } = settings;
  return { ...safe, hasSmtpPassword: Boolean(smtpPasswordEncrypted), hasWhatsappAccessToken: Boolean(whatsappAccessTokenEncrypted) };
}

async function notifyEstate(estateId, event, { title, message, linkPath = '/', userIds, roles = ['RESIDENT', 'COMMITTEE_MEMBER'] } = {}) {
  if (!EVENTS[event]) return;
  const settings = await prisma.estateCommunicationSetting.findUnique({ where: { estateId } });
  if (!settings) return;
  const eventConfig = settings.eventSettings?.[event] || {};
  if (eventConfig.enabled === false) return;
  const where = { estateId, status: 'ACTIVE', role: { in: roles }, user: { status: 'ACTIVE' } };
  if (userIds?.length) where.userId = { in: userIds };
  const members = await prisma.estateMembership.findMany({ where, include: { user: true } });
  const recipients = members.map((membership) => membership.user).filter((user) => user.email || user.phone);
  if (!recipients.length) return;
  const estate = await prisma.estate.findUnique({ where: { id: estateId }, select: { name: true } });
  const notificationRows = await Promise.all(recipients.map((user) => prisma.estateNotification.create({ data: {
    estateId, userId: user.id, event, title: title || EVENTS[event].title, message: message || '', linkPath,
  } })));
  const deliveries = [];
  recipients.forEach((user, index) => {
    const notification = notificationRows[index];
    const vars = { name: user.fullName || 'Resident', estate: estate?.name || 'Your estate', title: title || EVENTS[event].title, message: message || '', url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/notifications/${notification.id}` };
    for (const channel of EVENTS[event].channels) {
      const channelEnabled = channel === 'email' ? settings.emailEnabled : settings.whatsappEnabled;
      const channelConfig = eventConfig[channel] || {};
      if (!channelEnabled || channelConfig.enabled === false) continue;
      if (channel === 'email' && user.email) deliveries.push({ estateId, notificationId: notification.id, channel: 'EMAIL', recipient: user.email, subject: (channelConfig.subject || vars.title).replace(/\{(name|estate|title|message|url)\}/g, (_, key) => vars[key]), body: (channelConfig.body || '{name}, {title}\n{message}\n{url}').replace(/\{(name|estate|title|message|url)\}/g, (_, key) => vars[key]) });
      if (channel === 'whatsapp' && user.phone && channelConfig.templateName) deliveries.push({ estateId, notificationId: notification.id, channel: 'WHATSAPP', recipient: user.phone, subject: '', body: `${vars.title}: ${vars.message} ${vars.url}`, templateName: channelConfig.templateName, templateLanguage: channelConfig.language || settings.whatsappLanguage || 'en', templateParams: [vars.name, vars.estate, vars.title, vars.message, vars.url] });
    }
  });
  if (deliveries.length) await prisma.communicationDelivery.createMany({ data: deliveries });
}

async function notifyEmailAddress(estateId, event, recipient, vars = {}) {
  if (!EVENTS[event] || !recipient) return;
  const settings = await prisma.estateCommunicationSetting.findUnique({ where: { estateId } });
  if (!settings?.emailEnabled) return;
  const config = settings.eventSettings?.[event] || {};
  if (config.enabled === false || config.email?.enabled === false) return;
  const estate = await prisma.estate.findUnique({ where: { id: estateId }, select: { name: true } });
  const values = { name: vars.name || 'Resident', estate: estate?.name || 'Your estate', title: vars.title || EVENTS[event].title, message: vars.message || '', url: vars.url || `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/login` };
  const interpolate = (text) => text.replace(/\{(name|estate|title|message|url)\}/g, (_, key) => values[key]);
  await prisma.communicationDelivery.create({ data: { estateId, channel: 'EMAIL', recipient, subject: interpolate(config.email?.subject || values.title), body: interpolate(config.email?.body || '{name}, {title}\n{message}\n{url}') } });
}

async function deliverOne(job) {
  const settings = await prisma.estateCommunicationSetting.findUnique({ where: { estateId: job.estateId } });
  if (!settings) throw new Error('Estate communication settings are unavailable.');
  if (job.channel === 'EMAIL') {
    if (!settings.emailEnabled || !settings.smtpHost || !settings.emailFromAddress) throw new Error('Estate email channel is not configured.');
    const transporter = nodemailer.createTransport({ host: settings.smtpHost, port: settings.smtpPort, secure: settings.smtpSecure, auth: settings.smtpUsername ? { user: settings.smtpUsername, pass: decryptSecret(settings.smtpPasswordEncrypted) } : undefined, connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000 });
    const info = await transporter.sendMail({ from: { name: settings.emailFromName || 'Estate', address: settings.emailFromAddress }, to: job.recipient, subject: job.subject, text: job.body });
    return info.messageId;
  }
  if (!settings.whatsappEnabled || !settings.whatsappPhoneNumberId || !settings.whatsappAccessTokenEncrypted) throw new Error('Estate WhatsApp channel is not configured.');
  const response = await fetch(`https://graph.facebook.com/${settings.whatsappApiVersion}/${settings.whatsappPhoneNumberId}/messages`, {
    method: 'POST', headers: { Authorization: `Bearer ${decryptSecret(settings.whatsappAccessTokenEncrypted)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: job.recipient, type: 'template', template: { name: job.templateName, language: { code: job.templateLanguage }, components: [{ type: 'body', parameters: job.templateParams.map((text) => ({ type: 'text', text: String(text).slice(0, 1024) })) }] } }),
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error?.message || `WhatsApp provider returned HTTP ${response.status}.`);
  return result.messages?.[0]?.id || null;
}

let workerTimer;
let working = false;
async function processQueue() {
  if (working) return;
  working = true;
  try {
    const jobs = await prisma.communicationDelivery.findMany({ where: { status: { in: ['PENDING', 'RETRY'] }, nextAttemptAt: { lte: new Date() } }, orderBy: { createdAt: 'asc' }, take: 10 });
    for (const job of jobs) {
      try {
        const providerMessageId = await deliverOne(job);
        await prisma.communicationDelivery.update({ where: { id: job.id }, data: { status: 'SENT', sentAt: new Date(), attempts: { increment: 1 }, providerMessageId, lastError: null } });
      } catch (error) {
        const attempts = job.attempts + 1;
        await prisma.communicationDelivery.update({ where: { id: job.id }, data: { status: attempts >= 5 ? 'FAILED' : 'RETRY', attempts, lastError: String(error.message || 'Delivery failed').slice(0, 500), nextAttemptAt: new Date(Date.now() + Math.min(60, 2 ** attempts) * 60_000) } });
      }
    }
  } catch (error) { console.error('Communication queue processing failed:', error.message); }
  finally { working = false; }
}

function startWorker() { if (!workerTimer) { workerTimer = setInterval(processQueue, 5000); workerTimer.unref(); processQueue(); } }

module.exports = { EVENTS, encryptSecret, notifyEmailAddress, notifyEstate, processQueue, publicSettings, startWorker };
