const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to database');

        // Check if user exists
        const checkRes = await client.query('SELECT * FROM "users" WHERE username = $1', ['admin']);

        if (checkRes.rows.length === 0) {
            // Create user
            const id = require('crypto').randomUUID();
            const now = new Date();
            await client.query(
                'INSERT INTO "users" (id, username, "passwordHash", "fullName", role, "isActive", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [id, 'admin', 'password', 'System Admin', 'ADMIN', true, now]
            );
            console.log('Admin user seeded manually via raw pg!');
        } else {
            console.log('Admin user already exists!');
        }
    } catch (err) {
        console.error('Error seeding user:', err);
    } finally {
        await client.end();
    }
}

main();
