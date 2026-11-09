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

module.exports = { DarajaError, callbackUrl, darajaConfig, initiateStkPush, isDarajaConfigured };
