const crypto = require('crypto');

const password = 'merlinkraemer';
const salt = 'f84d9b7c9e5d2a1f'; // Using the same salt from server.js

const hash = crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex');

console.log('Password Hash:', hash);
