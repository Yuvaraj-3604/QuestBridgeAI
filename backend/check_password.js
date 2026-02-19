
const mysql = require('mysql2/promise');

const passwordsToTry = ['', 'root', 'admin', 'password', '123456', '1234', 'Quest@1234'];
const usersToTry = ['root'];

(async () => {
    console.log("Starting connection tests...");

    for (const user of usersToTry) {
        for (const password of passwordsToTry) {
            console.log(`Trying USER: '${user}', PASSWORD: '${password}'...`);
            try {
                const connection = await mysql.createConnection({
                    host: 'localhost',
                    user: user,
                    password: password
                });
                console.log(`\n✅ SUCCESS! Connected with USER: '${user}' and PASSWORD: '${password}'\n`);
                await connection.end();
                return; // Stop after first success
            } catch (err) {
                console.log(`❌ Failed: ${err.message}`);
            }
        }
    }
    console.log("\n❌ All attempts failed. Please verify your MySQL credentials manually.");
})();
