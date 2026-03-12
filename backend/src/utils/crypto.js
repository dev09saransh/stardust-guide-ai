const crypto = require('crypto');
require('dotenv').config();

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        console.error('❌ [FATAL]: ENCRYPTION_KEY missing in process.env');
        throw new Error('ENCRYPTION_KEY missing');
    }
    return Buffer.from(key, 'hex');
}

function encrypt(text) {
    if (!text) return null;
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (err) {
        console.error('[ENCRYPT ERROR]:', err.message);
        return text;
    }
}

function decrypt(text) {
    if (!text) return null;
    try {
        const key = getEncryptionKey();
        const textParts = text.split(':');
        if (textParts.length < 2) return text;
        
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (err) {
        console.error('[DECRYPT ERROR]:', err.message);
        return text; 
    }
}

module.exports = { encrypt, decrypt };
