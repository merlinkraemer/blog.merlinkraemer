const crypto = require('crypto');
require('dotenv').config();

const password = process.env.ADMIN_PASSWORD;
const salt = process.env.SALT;

if (!password || !salt) {
    console.error('Error: ADMIN_PASSWORD and SALT must be set in .env file');
    process.exit(1);
}

const hash = crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex');

console.log('Password Hash:', hash);
