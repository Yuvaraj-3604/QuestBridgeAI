const fs = require('fs');
const path = require('path');

const DATA_DIR = '/tmp/questbridge';
const PARTICIPANTS_FILE = path.join(DATA_DIR, 'participants.json');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function readParticipants() {
    ensureDataDir();
    if (!fs.existsSync(PARTICIPANTS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(PARTICIPANTS_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function writeParticipants(data) {
    ensureDataDir();
    fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(data, null, 2));
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            const participants = readParticipants();
            return res.status(200).json(participants);
        }

        if (req.method === 'POST') {
            const { name, email, organization, phone, ticket_type } = req.body;
            if (!name || !email) {
                return res.status(400).json({ error: 'Name and Email are required.' });
            }
            const participants = readParticipants();
            if (participants.find(p => p.email === email)) {
                return res.status(409).json({ error: 'Email already registered.' });
            }
            const newP = {
                id: Date.now(),
                name, email,
                organization: organization || '',
                phone: phone || '',
                ticket_type: ticket_type || 'general',
                status: 'pending',
                created_at: new Date().toISOString()
            };
            participants.push(newP);
            writeParticipants(participants);
            return res.status(201).json({ message: 'Participant registered successfully', id: newP.id });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Participants error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};
