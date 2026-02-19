
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME // Check if this DB exists first? No, maybe connect without DB first.
        });
        console.log('Connected to MySQL successfully!');
        await connection.end();
    } catch (err) {
        console.error('Initial connection failed:', err.message);

        // Try connecting without database to see if we can create it
        try {
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD
            });
            console.log('Connected to MySQL server (no DB selected) successfully!');
            await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
            console.log(`Database ${process.env.DB_NAME} created or exists.`);
            await connection.end();
        } catch (err2) {
            console.error('Connection without DB also failed:', err2.message);
        }
    }
})();
