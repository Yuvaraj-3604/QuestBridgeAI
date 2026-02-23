// This file is kept as a fallback entry point, but the real
// API routes are now individual files in api/auth/ and api/participants.js
module.exports = async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ status: 'ok', message: 'QuestBridge API is running' });
};
