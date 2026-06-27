import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS profile (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Usuario',
      icr REAL NOT NULL DEFAULT 10,
      isf REAL NOT NULL DEFAULT 50,
      target_bg INTEGER NOT NULL DEFAULT 100,
      dia REAL NOT NULL DEFAULT 3.5,
      nightscout_url TEXT DEFAULT '',
      nightscout_token TEXT DEFAULT '',
      units TEXT NOT NULL DEFAULT 'mg/dL',
      setup_done INTEGER NOT NULL DEFAULT 0,
      pin TEXT DEFAULT '',
      dark_mode INTEGER NOT NULL DEFAULT 0,
      theme_color TEXT DEFAULT 'blue',
      username TEXT DEFAULT '',
      password_hash TEXT DEFAULT ''
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS doses (
      id SERIAL PRIMARY KEY,
      profile_id INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      food_description TEXT,
      carbs REAL NOT NULL DEFAULT 0,
      current_bg INTEGER NOT NULL,
      trend TEXT NOT NULL DEFAULT 'Flat',
      carb_dose REAL NOT NULL,
      correction_dose REAL NOT NULL,
      trend_adjustment REAL NOT NULL DEFAULT 0,
      total_dose REAL NOT NULL,
      image_path TEXT DEFAULT ''
    )
  `);

  // Add consent_given column if missing (migration)
  await pool.query(`
    ALTER TABLE profile ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT FALSE
  `);

  // Seed default user if no profiles exist
  const { rows } = await pool.query('SELECT COUNT(*) FROM profile');
  if (parseInt(rows[0].count) === 0) {
    const hash = await bcrypt.hash('Zaira2024', 12);
    await pool.query(
      `INSERT INTO profile (name, username, password_hash, icr, isf, target_bg, dia, units, setup_done, theme_color)
       VALUES ('Zaira', 'zaira', $1, 10, 50, 100, 3.5, 'mg/dL', 1, 'rose')`,
      [hash]
    );
    console.log('Usuario inicial Zaira creado');
  }

  console.log('Base de datos PostgreSQL lista');
}

export default pool;
