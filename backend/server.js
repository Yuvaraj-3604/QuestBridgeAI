
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { Parser } = require('json2csv');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Database
const db = new sqlite3.Database('./questbridge.sqlite', (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

// Initialize Tables
const initDb = () => {
    db.serialize(() => {
        // Create Participants Table
        db.run(`
            CREATE TABLE IF NOT EXISTS participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                organization TEXT,
                phone TEXT,
                ticket_type TEXT DEFAULT 'general',
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("Error creating participants table:", err);
            else console.log("Participants table ready.");
        });

        // Create Engagement Logs Table
        db.run(`
            CREATE TABLE IF NOT EXISTS engagement_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                participant_email TEXT,
                activity_type TEXT NOT NULL,
                details TEXT,
                score INTEGER DEFAULT 0,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (participant_email) REFERENCES participants(email) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) console.error("Error creating engagement_logs table:", err);
            else console.log("Engagement logs table ready.");
        });
    });
};

// --- API Endpoints ---

// 1. Register a Participant
app.post('/api/participants', (req, res) => {
    const { name, email, organization, phone, ticket_type } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: "Name and Email are required." });
    }

    const query = 'INSERT INTO participants (name, email, organization, phone, ticket_type) VALUES (?, ?, ?, ?, ?)';
    db.run(query, [name, email, organization, phone, ticket_type || 'general'], function (err) {
        if (err) {
            console.error(err.message);
            // Handle unique constraint error
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: "Email already registered." });
            }
            return res.status(500).json({ error: "Failed to register participant." });
        }
        res.status(201).json({ message: "Participant registered successfully", id: this.lastID });
    });
});

// 2. Get All Participants
app.get('/api/participants', (req, res) => {
    db.all('SELECT * FROM participants ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to fetch participants." });
        }
        res.json(rows);
    });
});

// 2b. Update Participant
// 2b. Update Participant
app.put('/api/participants/:id', (req, res) => {
    const { id } = req.params;
    const { status, ticket_type } = req.body;

    console.log(`Update request for participant ${id}:`, req.body);

    // Dynamic query construction could be better, but for now simple status update is primary goal
    const query = `UPDATE participants SET status = COALESCE(?, status), ticket_type = COALESCE(?, ticket_type) WHERE id = ?`;

    // Ensure undefined is treated as null so COALESCE works correctly (or just ignores updates)
    const safeStatus = status === undefined ? null : status;
    const safeTicket = ticket_type === undefined ? null : ticket_type;

    db.run(query, [safeStatus, safeTicket, id], function (err) {
        if (err) {
            console.error("Database Update Error:", err);
            return res.status(500).json({ error: "Failed to update participant database record." });
        }
        if (this.changes === 0) {
            console.warn(`Participant ${id} not found.`);
            return res.status(404).json({ error: "Participant not found." });
        }
        res.json({ message: "Participant updated successfully." });
    });
});

// 2c. Delete Participant
app.delete('/api/participants/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM participants WHERE id = ?', [id], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to delete participant." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Participant not found." });
        }
        res.json({ message: "Participant deleted successfully." });
    });
});

// 3. Log Engagement
app.post('/api/engagement', (req, res) => {
    const { participant_email, activity_type, details, score } = req.body;

    if (!participant_email || !activity_type) {
        return res.status(400).json({ error: "Participant Email and Activity Type are required." });
    }

    const query = 'INSERT INTO engagement_logs (participant_email, activity_type, details, score) VALUES (?, ?, ?, ?)';
    db.run(query, [participant_email, activity_type, JSON.stringify(details), score || 0], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to log engagement." });
        }
        res.status(201).json({ message: "Engagement logged successfully", id: this.lastID });
    });
});

// 4. Download Participants as CSV
app.get('/api/download/participants', (req, res) => {
    db.all('SELECT * FROM participants ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to fetch data." });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: "No participants found to download." });
        }

        try {
            const fields = ['id', 'name', 'email', 'organization', 'phone', 'ticket_type', 'status', 'created_at'];
            const header = fields.join(',');
            const csvRows = rows.map(row => {
                return fields.map(field => {
                    const val = row[field] === null || row[field] === undefined ? '' : row[field];
                    // Simple escape: wrap in quotes if contains comma or quote
                    const stringVal = String(val);
                    if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                        return `"${stringVal.replace(/"/g, '""')}"`;
                    }
                    return stringVal;
                }).join(',');
            });
            const csv = [header, ...csvRows].join('\n');

            res.header('Content-Type', 'text/csv');
            res.attachment('participants_list.csv');
            return res.send(csv);
        } catch (parseErr) {
            console.error('CSV Generation Error:', parseErr);
            return res.status(500).json({ error: "Failed to generate CSV. Check server logs." });
        }
    });
});

// 5. Download Engagement Logs as CSV
app.get('/api/download/engagement', (req, res) => {
    const query = `
        SELECT 
            el.id, 
            p.name as participant_name, 
            el.participant_email, 
            el.activity_type, 
            el.details, 
            el.score, 
            el.timestamp 
        FROM engagement_logs el
        LEFT JOIN participants p ON el.participant_email = p.email
        ORDER BY el.timestamp DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to fetch data." });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: "No logs found to download." });
        }

        try {
            const fields = ['id', 'participant_name', 'participant_email', 'activity_type', 'details', 'score', 'timestamp'];
            const header = fields.join(',');
            const csvRows = rows.map(row => {
                return fields.map(field => {
                    const val = row[field] === null || row[field] === undefined ? '' : row[field];
                    // Simple escape: wrap in quotes if contains comma or quote
                    const stringVal = String(val);
                    if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                        return `"${stringVal.replace(/"/g, '""')}"`;
                    }
                    return stringVal;
                }).join(',');
            });
            const csv = [header, ...csvRows].join('\n');

            res.header('Content-Type', 'text/csv');
            res.attachment('engagement_logs.csv');
            return res.send(csv);
        } catch (parseErr) {
            console.error('CSV Generation Error:', parseErr);
            return res.status(500).json({ error: "Failed to generate CSV. Check server logs." });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
