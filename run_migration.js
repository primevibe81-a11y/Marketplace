const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Sandiku1980%40@db.hvvgbapanahspohszsgn.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    const sql = fs.readFileSync(path.join(__dirname, 'supabase', 'migrations', '0003_model_offers.sql'), 'utf8');
    await client.query(sql);
    console.log('Migration 0003 applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
