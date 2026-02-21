const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();
const c = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
c.connect().then(() => c.query('SELECT username, "passwordHash" FROM "users"')).then(r => console.log(r.rows)).finally(() => c.end());
