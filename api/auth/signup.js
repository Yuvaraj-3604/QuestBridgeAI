const { readUsers, writeUsers, hashPassword } = require('../db.js');

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { username, email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const users = readUsers();
        const existingUser = users.find(u => u.email === email);

        if (existingUser) {
            return res.status(409).json({ error: 'Email already exists.' });
        }

        const hashedPassword = hashPassword(password);
        const newUser = {
            id: Date.now(),
            username: username || '',
            email,
            password: hashedPassword,
            created_at: new Date().toISOString()
        };

        users.push(newUser);
        writeUsers(users);

        return res.status(201).json({
            message: 'User created successfully!',
            userId: newUser.id
        });

    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};
