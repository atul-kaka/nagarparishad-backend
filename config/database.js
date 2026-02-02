const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nagarparishad_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
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




