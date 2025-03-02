const bcrypt = require('bcryptjs');

// Get password from command line argument
const password = process.argv[2];

if (!password) {
    console.error('Usage: node generate-hash.js <password>');
    process.exit(1);
}

// Generate salt and hash
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('Password Hash:', hash);
