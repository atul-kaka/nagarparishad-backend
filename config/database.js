const { Pool } = require('pg');
// Load environment variables - prioritize .env.production if NODE_ENV is production
if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({ path: '.env.production' });
} else {
  require('dotenv').config();
}

// Validate DB_PASSWORD is a string (required for PostgreSQL connection)
const dbPassword = process.env.DB_PASSWORD;
if (dbPassword !== undefined && typeof dbPassword !== 'string') {
  console.error('ERROR: DB_PASSWORD must be a string. Current type:', typeof dbPassword);
  throw new Error('DB_PASSWORD must be a string');
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nagarparishad_db',
  user: process.env.DB_USER || 'postgres',
  password: dbPassword || '',
  // Ensure UTF-8 encoding for Marathi and other Unicode characters
  // This is the recommended way to set encoding in pg library
});

// Set UTF-8 encoding on each new connection
pool.on('connect', (client) => {
  // Set UTF-8 encoding for this connection
  client.query('SET client_encoding TO \'UTF8\'', (err) => {
    if (err) {
      console.error('Error setting UTF-8 encoding:', err);
    } else {
      console.log('Database connected successfully with UTF-8 encoding');
    }
  });
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection and verify UTF-8 encoding
(async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SHOW client_encoding');
    console.log(`Database client encoding: ${result.rows[0].client_encoding}`);
    client.release();
  } catch (err) {
    console.error('Error testing database connection:', err);
  }
})();

module.exports = pool;




