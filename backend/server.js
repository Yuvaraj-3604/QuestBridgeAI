
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { Parser } = require('json2csv');
const { createZoomMeeting } = require('./zoomService');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Error handler for JSON parsing errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Invalid JSON received:', err.message);
        console.error('Body snippet:', req.body || 'no body');
        return res.status(400).json({ error: "Invalid JSON format in request body." });
    }
    next();
});

// Debug Middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    if (req.method === 'POST') console.log('Body:', req.body);
    next();
});

// Initialize Database
const DB_SOURCE = path.join(__dirname, 'questbridge.sqlite');
const DB_PATH = process.env.NODE_ENV === 'production'
    ? path.join('/tmp', 'questbridge.sqlite')
    : DB_SOURCE;

// In production, copy the bundled DB to /tmp so it's writable
if (process.env.NODE_ENV === 'production') {
    try {
        if (fs.existsSync(DB_SOURCE) && !fs.existsSync(DB_PATH)) {
            fs.copyFileSync(DB_SOURCE, DB_PATH);
            console.log('Database copied to /tmp');
        }
    } catch (err) {
        console.error('Error copying database to /tmp:', err);
    }
}

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log(`Connected to database at ${DB_PATH}`);
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

        // Create Users Table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("Error creating users table:", err);
            else console.log("Users table ready.");
        });
    });
};

// --- API Endpoints ---
app.post('/api/test-post', (req, res) => res.json({ ok: true, body: req.body }));

// --- Auth Endpoints ---

// User Signup
app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';

        db.run(query, [username || '', email, hashedPassword], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: "Email already exists." });
                }
                console.error(err);
                return res.status(500).json({ error: "Failed to create user." });
            }
            res.status(201).json({ message: "User created successfully!", userId: this.lastID });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.get(query, [email], async (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error." });
        }

        if (!user) {
            return res.status(404).json({ error: "No account found with this email." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid password." });
        }

        // Return user details (without password)
        const { password: _, ...userInfo } = user;
        res.json({ message: "Login successful!", user: userInfo });
    });
});

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


// 5b. Download Leaderboard as CSV
app.get('/api/download/leaderboard', (req, res) => {
    const query = `
        SELECT 
            p.name as participant_name, 
            el.participant_email, 
            SUM(el.score) as total_score, 
            COUNT(el.id) as activities_completed
        FROM engagement_logs el
        JOIN participants p ON el.participant_email = p.email
        GROUP BY el.participant_email
        ORDER BY total_score DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Leaderboard Fetch Error:', err);
            return res.status(500).json({ error: "Failed to fetch leaderboard data." });
        }

        if (rows.length === 0) {
            // Return just headers if no data
            const header = 'participant_name,participant_email,total_score,activities_completed';
            res.header('Content-Type', 'text/csv');
            res.attachment('event_leaderboard.csv');
            return res.send(header);
        }

        try {
            const fields = ['participant_name', 'participant_email', 'total_score', 'activities_completed'];
            const header = fields.join(',');
            const csvRows = rows.map(row => {
                return fields.map(field => {
                    const val = row[field];
                    return String(val).includes(',') ? `"${val}"` : val;
                }).join(',');
            });
            const csv = [header, ...csvRows].join('\n');

            res.header('Content-Type', 'text/csv');
            res.attachment('event_leaderboard.csv');
            return res.send(csv);
        } catch (parseErr) {
            console.error('CSV Generation Error:', parseErr);
            return res.status(500).json({ error: "Failed to generate CSV." });
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



// 5c. Send Email Campaign
app.post('/api/marketing/send', (req, res) => {
    try {
        const { subject, body } = req.body;

        if (!subject || !body) {
            return res.status(400).json({ error: "Subject and Body are required." });
        }

        db.all('SELECT email FROM participants', [], async (err, rows) => {
            if (err) {
                console.error('Database Error in Marketing:', err);
                return res.status(500).json({ error: "Failed to fetch recipients from database." });
            }

            if (rows.length === 0) {
                return res.status(404).json({ error: "No recipients found in the database." });
            }

            const recipients = rows.map(r => r.email);
            console.log(`Attempting to send real emails to: ${recipients.join(', ')}`);

            // Check if email credentials are set
            if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your-email')) {
                console.warn('REAL EMAIL SENDING SKIPPED: EMAIL_USER/PASS not configured in .env');
                return res.json({
                    message: "Simulation successful (Real emails skipped: Credentials not set)",
                    recipientCount: recipients.length,
                    timestamp: new Date().toISOString()
                });
            }

            try {
                const sendPromises = recipients.map(email => {
                    return transporter.sendMail({
                        from: `"Questbridge AI" <${process.env.EMAIL_USER}>`,
                        to: email,
                        subject: subject,
                        text: body,
                        html: `<div style="font-family: sans-serif; padding: 20px;">${body.replace(/\n/g, '<br>')}</div>`
                    });
                });

                await Promise.all(sendPromises);

                res.json({
                    message: "Real email campaign sent successfully!",
                    recipientCount: recipients.length,
                    timestamp: new Date().toISOString()
                });
            } catch (mailError) {
                console.error('Nodemailer Error:', mailError);
                res.status(500).json({
                    error: "Failed to send emails via provider.",
                    details: mailError.message
                });
            }
        });
    } catch (error) {
        console.error('Marketing Send Crash:', error);
        res.status(500).json({ error: "Internal server error during campaign sending." });
    }
});

// 5d. Send Single Email
app.post('/api/marketing/single-send', async (req, res) => {
    try {
        const { email, subject, body } = req.body;

        if (!email || !subject || !body) {
            return res.status(400).json({ error: "Email, Subject, and Body are required." });
        }

        // Check if email credentials are set
        if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your-email')) {
            console.warn('SINGLE EMAIL SENDING SKIPPED: Credentials not set');
            return res.json({
                message: "Simulation successful (Credentials not set)",
                email: email
            });
        }

        await transporter.sendMail({
            from: `"Questbridge AI" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            text: body,
            html: `<div style="font-family: sans-serif; padding: 20px;">${body.replace(/\n/g, '<br>')}</div>`
        });

        res.json({ message: "Email sent successfully!", email: email });
    } catch (error) {
        console.error('Single Email Send Error:', error);
        res.status(500).json({ error: "Failed to send email.", details: error.message });
    }
});

// 6. Create Zoom Meeting
app.post('/api/zoom/create-meeting', async (req, res) => {
    const { topic, startTime, duration } = req.body;
    try {
        const meeting = await createZoomMeeting(topic, startTime, duration);
        res.json({
            message: "Zoom meeting created successfully",
            meeting_url: meeting.join_url,
            meeting_id: meeting.id,
            password: meeting.password,
            start_url: meeting.start_url // This should be kept secure, usually only for the organizer
        });
    } catch (error) {
        console.error("Zoom Integration Error:", error);
        res.status(500).json({ error: "Failed to create Zoom meeting. Check server logs." });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({
        error: "Internal Server Error",
        message: err.message
    });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
