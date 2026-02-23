// Simple JSON-based persistent storage in /tmp (Vercel writable directory)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = '/tmp/questbridge';
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function readUsers() {
    ensureDataDir();
    if (!fs.existsSync(USERS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function writeUsers(users) {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Simple bcrypt-like hash using SHA-256 + salt (no native module needed)
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    const computedHash = crypto.createHmac('sha256', salt).update(password).digest('hex');
    return computedHash === hash;
}

module.exports = { readUsers, writeUsers, hashPassword, verifyPassword };
