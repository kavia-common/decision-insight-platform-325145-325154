const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const PASSWORD_SALT_ROUNDS = process.env.PASSWORD_SALT_ROUNDS
  ? Number(process.env.PASSWORD_SALT_ROUNDS)
  : 10;

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

async function hashPassword(password) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function generateOpaqueToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

module.exports = { hashToken, hashPassword, verifyPassword, generateOpaqueToken };
