const { randomBytes, scrypt: scryptCallback, scryptSync, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(scryptCallback);
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELISM = 1;
const KEY_LENGTH = 64;
const DUMMY_SALT = Buffer.from('pavilion-login-dummy-salt');
const DUMMY_HASH = scryptSync('not-a-valid-password', DUMMY_SALT, KEY_LENGTH, { N: COST, r: BLOCK_SIZE, p: PARALLELISM, maxmem: 64 * 1024 * 1024 });

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH, { N: COST, r: BLOCK_SIZE, p: PARALLELISM, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELISM}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

async function verifyPassword(password, encodedHash) {
  const parts = encodedHash?.split('$') || [];
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    const candidate = await scrypt(password, DUMMY_SALT, KEY_LENGTH, { N: COST, r: BLOCK_SIZE, p: PARALLELISM, maxmem: 64 * 1024 * 1024 });
    timingSafeEqual(candidate, DUMMY_HASH);
    return false;
  }

  const [, cost, blockSize, parallelism, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  if (expected.length !== KEY_LENGTH || !/^\d+$/.test(cost + blockSize + parallelism)) return false;
  const candidate = await scrypt(password, salt, expected.length, {
    N: Number(cost), r: Number(blockSize), p: Number(parallelism), maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(candidate, expected);
}

module.exports = { hashPassword, verifyPassword };
