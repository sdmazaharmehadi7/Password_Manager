const express = require('express');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const bodyparser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

dotenv.config();

// MongoDB Client Setup
const dbName = process.env.DB_NAME || 'password_manager';
let db;
let client;

async function initDb() {
    const primaryUrl = process.env.MONGO_URI;
    const fallbackUrl = 'mongodb://127.0.0.1:27017';

    if (primaryUrl) {
        try {
            console.log('Attempting connection to primary MongoDB URI...');
            const primaryClient = new MongoClient(primaryUrl, {
                serverSelectionTimeoutMS: 3000,
                connectTimeoutMS: 3000
            });
            await primaryClient.connect();
            client = primaryClient;
            db = client.db(dbName);
            console.log(`Connected to primary MongoDB: ${dbName}`);
        } catch (err) {
            console.warn(`Primary MongoDB connection failed (${err.message}). Trying local fallback...`);
        }
    }

    if (!db) {
        try {
            const fallbackClient = new MongoClient(fallbackUrl, {
                serverSelectionTimeoutMS: 3000
            });
            await fallbackClient.connect();
            client = fallbackClient;
            db = client.db(dbName);
            console.log(`Connected to local fallback MongoDB: ${dbName}`);
        } catch (err) {
            console.error('All MongoDB connection attempts failed:', err.message);
        }
    }

    if (db) {
        try {
            await db.collection('vaults').createIndex({ keyHash: 1 }, { unique: true });
            await db.collection('passwords').createIndex({ vaultId: 1, id: 1 });
        } catch (e) {
            console.error('Index creation notice:', e.message);
        }
    }
}
initDb();

const app = express();
const port = 3000;

// Middleware
app.use(bodyparser.json());
app.use(cors());

// Ensure DB is initialized for serverless environments
app.use(async (req, res, next) => {
    if (!db) {
        await initDb();
    }
    next();
});

// Utility: Hash secret key with SHA-256
function hashKey(secretKey) {
    return crypto.createHash('sha256').update(String(secretKey).trim()).digest('hex');
}

// Authentication Middleware: verify secret key and resolve vault
const authenticateVault = async (req, res, next) => {
    try {
        const rawKey = req.headers['x-secret-key'] || (req.headers['authorization'] && req.headers['authorization'].replace(/^Bearer\s+/i, ''));
        if (!rawKey || typeof rawKey !== 'string' || !rawKey.trim()) {
            return res.status(401).json({ success: false, message: 'Secret key is required for vault access' });
        }

        const keyHash = hashKey(rawKey);
        let vault = await db.collection('vaults').findOne({ keyHash });

        if (!vault) {
            const newVault = {
                keyHash,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const result = await db.collection('vaults').insertOne(newVault);
            vault = { _id: result.insertedId, ...newVault };
        }

        req.vault = vault;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ success: false, message: 'Authentication failed due to server error' });
    }
};

// Health / Status endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'PassOp Vault API' });
});

// 1. Create a new Vault and generate secret key
app.post('/api/vault/create', async (req, res) => {
    try {
        // Generate a 24-byte (192-bit) cryptographically secure random token (32 base64url characters)
        const secretKey = crypto.randomBytes(24).toString('base64url');
        const keyHash = hashKey(secretKey);

        const newVault = {
            keyHash,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('vaults').insertOne(newVault);

        // Return the secret key to frontend (never store raw key in database)
        res.status(201).json({
            success: true,
            secretKey,
            vaultId: result.insertedId,
            message: 'Vault created successfully'
        });
    } catch (error) {
        console.error('Create vault error:', error);
        res.status(500).json({ success: false, message: 'Failed to create vault' });
    }
});

// 1. Access or Create Vault using user-chosen secret key (Dontpad-style)
app.post('/api/vault/access', async (req, res) => {
    try {
        const { secretKey } = req.body;
        if (!secretKey || typeof secretKey !== 'string' || !secretKey.trim()) {
            return res.status(400).json({ success: false, message: 'Key is required' });
        }

        const trimmedKey = secretKey.trim();
        const keyHash = hashKey(trimmedKey);
        let vault = await db.collection('vaults').findOne({ keyHash });

        let isNew = false;
        if (!vault) {
            const newVault = {
                keyHash,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const result = await db.collection('vaults').insertOne(newVault);
            vault = { _id: result.insertedId, ...newVault };
            isNew = true;
        }

        res.json({
            success: true,
            isNew,
            message: isNew ? 'New vault created' : 'Vault opened'
        });
    } catch (error) {
        console.error('Access vault error:', error);
        res.status(500).json({ success: false, message: 'Failed to access vault' });
    }
});

// 3. Get all passwords belonging strictly to the authenticated vault
app.get('/api/vault/passwords', authenticateVault, async (req, res) => {
    try {
        const collection = db.collection('passwords');
        const passwords = await collection.find({ vaultId: req.vault._id }).toArray();
        // Return sanitized list matching frontend model
        const sanitized = passwords.map(item => ({
            id: item.id,
            site: item.site,
            username: item.username,
            password: item.password,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        }));
        res.json(sanitized);
    } catch (error) {
        console.error('Get passwords error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve passwords' });
    }
});

// 4. Save (create or update) a password for the authenticated vault
app.post('/api/vault/passwords', authenticateVault, async (req, res) => {
    try {
        const { id, site, username, password } = req.body;
        if (!site || !username || !password) {
            return res.status(400).json({ success: false, message: 'Site, username, and password are required' });
        }

        const passwordId = id || crypto.randomUUID();
        const collection = db.collection('passwords');

        // Upsert scoped strictly to this vault
        const result = await collection.updateOne(
            { id: passwordId, vaultId: req.vault._id },
            {
                $set: {
                    id: passwordId,
                    vaultId: req.vault._id,
                    site,
                    username,
                    password,
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );

        res.json({ success: true, id: passwordId, result });
    } catch (error) {
        console.error('Save password error:', error);
        res.status(500).json({ success: false, message: 'Failed to save password' });
    }
});

// 5. Delete a password from the authenticated vault
const deletePasswordHandler = async (req, res) => {
    try {
        const passwordId = req.params.id || (req.body && req.body.id);
        if (!passwordId) {
            return res.status(400).json({ success: false, message: 'Password ID is required' });
        }

        const collection = db.collection('passwords');
        const result = await collection.deleteOne({
            id: passwordId,
            vaultId: req.vault._id
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Password not found in your vault' });
        }

        res.json({ success: true, result });
    } catch (error) {
        console.error('Delete password error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete password' });
    }
};

app.delete('/api/vault/passwords/:id', authenticateVault, deletePasswordHandler);
app.delete('/api/vault/passwords', authenticateVault, deletePasswordHandler);

if (require.main === module) {
    app.listen(port, () => {
        console.log(`PassOp Backend running on http://localhost:${port}`);
    });
}

module.exports = app;