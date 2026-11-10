const { randomBytes } = require('node:crypto');

const darajaBaseUrl = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

let cachedAccessToken = null;
let cachedTokenExpiresAt = 0;

class DarajaError extends Error {
  constructor(message, status = 502, safeToFail = false) {
    super(message);
    this.name = 'DarajaError';
    this.status = status;
    this.safeToFail = safeToFail;
  }
}

function darajaConfig() {
  return {
    consumerKey: process.env.MPESA_CONSUMER_KEY?.trim(),
    consumerSecret: process.env.MPESA_CONSUMER_SECRET?.trim(),
    shortcode: process.env.MPESA_SHORTCODE?.trim(),
    passkey: process.env.MPESA_PASSKEY?.trim(),
    callbackUrl: process.env.MPESA_CALLBACK_URL?.trim(),
    callbackSecret: process.env.MPESA_CALLBACK_SECRET?.trim(),
    transactionType: process.env.MPESA_TRANSACTION_TYPE?.trim() || 'CustomerPayBillOnline',
  };
}

function isDarajaConfigured() {
  const config = darajaConfig();
  return Object.values(config).every(Boolean)
    && ['CustomerPayBillOnline', 'CustomerBuyGoodsOnline'].includes(config.transactionType)
    && /^https:\/\//i.test(config.callbackUrl);
}

function b2cConfig() {
  return {
    shortcode: process.env.MPESA_B2C_SHORTCODE?.trim(),
    initiatorName: process.env.MPESA_B2C_INITIATOR_NAME?.trim(),
    securityCredential: process.env.MPESA_B2C_SECURITY_CREDENTIAL?.trim(),
    callbackUrl: process.env.MPESA_B2C_CALLBACK_URL?.trim(),
    callbackSecret: process.env.MPESA_CALLBACK_SECRET?.trim(),
  };
}

function isB2CPayoutConfigured() {
  const config = b2cConfig();
  const credentials = darajaConfig();
  return Object.values(config).every(Boolean) && Boolean(credentials.consumerKey && credentials.consumerSecret) && /^https:\/\//i.test(config.callbackUrl);
}

async function initiateB2CPayout({ phone, amount, reference }) {
  const config = b2cConfig();
  if (!isB2CPayoutConfigured()) throw new DarajaError('Safaricom B2C payouts are not configured.', 503, true);
  const token = await getAccessToken();
  const base = config.callbackUrl.replace(/\/+$/, '');
  const originatorConversationId = `${reference}-${randomBytes(5).toString('hex')}`;
  let response;
  try {
    response = await fetch(`${darajaBaseUrl}/mpesa/b2c/v3/paymentrequest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        OriginatorConversationID: originatorConversationId,
        InitiatorName: config.initiatorName,
        SecurityCredential: config.securityCredential,
        CommandID: 'BusinessPayment',
        Amount: amount,
        PartyA: config.shortcode,
        PartyB: phone,
        Remarks: `Marketplace payout ${reference}`.slice(0, 100),
        QueueTimeOutURL: `${base}/timeout/${encodeURIComponent(config.callbackSecret)}`,
        ResultURL: `${base}/result/${encodeURIComponent(config.callbackSecret)}`,
        Occassion: reference.slice(0, 20),
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new DarajaError('Safaricom did not confirm the payout request. Check its status before retrying.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ConversationID || !payload.OriginatorConversationID) {
    throw new DarajaError(payload.errorMessage || payload.ResponseDescription || 'Safaricom could not accept this payout.', 502, true);
  }
  return { conversationId: payload.ConversationID, originatorConversationId: payload.OriginatorConversationID };
}

function callbackUrl() {
  const config = darajaConfig();
  return `${config.callbackUrl.replace(/\/+$/, '')}/${encodeURIComponent(config.callbackSecret)}`;
}

async function getAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && cachedTokenExpiresAt > now + 30_000) return cachedAccessToken;
  const { consumerKey, consumerSecret } = darajaConfig();
  let response;
  try {
    response = await fetch(`${darajaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}` },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new DarajaError('Could not connect to Safaricom Daraja. Try again shortly.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) throw new DarajaError('Safaricom Daraja authentication failed. Check the configured credentials.', 502, true);
  cachedAccessToken = payload.access_token;
  cachedTokenExpiresAt = now + Math.max(60, Number(payload.expires_in) || 3600) * 1000;
  return cachedAccessToken;
}

function darajaTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).reduce((result, item) => ({ ...result, [item.type]: item.value }), {});
  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
}

async function initiateStkPush({ phone, amount, reference, description }) {
  const config = darajaConfig();
  if (!isDarajaConfigured()) throw new DarajaError('M-Pesa STK Push is not configured. Add the Daraja credentials and public HTTPS callback URL to the server environment.', 503);
  const timestamp = darajaTimestamp();
  const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString('base64');
  const token = await getAccessToken();
  let response;
  try {
    response = await fetch(`${darajaBaseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: config.transactionType,
        Amount: amount,
        PartyA: phone,
        PartyB: config.shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl(),
        AccountReference: reference.slice(0, 12),
        TransactionDesc: description.slice(0, 13),
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new DarajaError('Could not reach Safaricom Daraja. Your payment request was not confirmed; check your payment history before retrying.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ResponseCode !== '0' || !payload.CheckoutRequestID) {
    throw new DarajaError(payload.errorMessage || payload.ResponseDescription || 'Safaricom could not start the payment request. Check the phone number and try again.', 502, true);
  }
  return {
    merchantRequestId: payload.MerchantRequestID || null,
    checkoutRequestId: payload.CheckoutRequestID,
    customerMessage: payload.CustomerMessage || 'Check your phone and enter your M-Pesa PIN to approve the payment.',
  };
}

module.exports = { DarajaError, b2cConfig, callbackUrl, darajaConfig, initiateB2CPayout, initiateStkPush, isB2CPayoutConfigured, isDarajaConfigured };
