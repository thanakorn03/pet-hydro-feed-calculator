// =============================================
// db.js — Database helper with SQLite fallback and Turso Cloud support
// Pet Hydro-Feed Calculator
// =============================================

const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

let db = null;
let tursoClient = null;

function isTursoEnabled() {
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.TURSO_URL || '';
  const tursoToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN || '';
  return Boolean(tursoUrl && tursoToken && (/^libsql:\/\//i.test(tursoUrl) || /^https?:\/\//i.test(tursoUrl)));
}

function getTursoClient() {
  if (!isTursoEnabled()) {
    return null;
  }

  if (!tursoClient) {
    tursoClient = createClient({
      url: process.env.TURSO_DATABASE_URL || process.env.TURSO_URL,
      authToken: process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN
    });
  }

  return tursoClient;
}

async function ensurePetsTable() {
  if (!isTursoEnabled()) {
    return;
  }

  const client = getTursoClient();
  await client.execute(`
    CREATE TABLE IF NOT EXISTS pets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      breed TEXT DEFAULT '',
      weight REAL NOT NULL,
      activity TEXT NOT NULL,
      water_ml REAL NOT NULL,
      food_g REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const columns = await client.execute("PRAGMA table_info('pets')");
  const hasBreedColumn = (columns.rows || []).some((column) => column.name === 'breed');

  if (!hasBreedColumn) {
    await client.execute("ALTER TABLE pets ADD COLUMN breed TEXT DEFAULT ''");
  }
}

/**
 * Initialize SQLite database and create tables if not exist
 * @param {string} dbPath - Path to the SQLite database file
 * @returns {Database|import('@libsql/client').Client} - Database instance
 */
function initDB(dbPath = process.env.DB_PATH || './data/pets.db') {
  if (isTursoEnabled()) {
    const client = getTursoClient();
    ensurePetsTable().catch((error) => {
      console.error('❌ Failed to initialize Turso schema:', error.message);
    });
    return client;
  }

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS pets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'mouse')),
        breed TEXT DEFAULT '',
        weight REAL NOT NULL CHECK(weight > 0),
        activity TEXT NOT NULL CHECK(activity IN ('low', 'medium', 'high')),
        water_ml REAL NOT NULL,
        food_g REAL NOT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    const columns = db.prepare('PRAGMA table_info(pets)').all();
    const hasBreedColumn = columns.some((column) => column.name === 'breed');

    if (!hasBreedColumn) {
      db.exec("ALTER TABLE pets ADD COLUMN breed TEXT DEFAULT ''");
    }
  }

  return db;
}

async function getAllPets() {
  if (isTursoEnabled()) {
    await ensurePetsTable();
    const result = await getTursoClient().execute('SELECT * FROM pets ORDER BY created_at DESC');
    return result.rows || [];
  }

  const stmt = db.prepare('SELECT * FROM pets ORDER BY created_at DESC');
  return stmt.all();
}

async function addPet(pet) {
  if (isTursoEnabled()) {
    await ensurePetsTable();
    await getTursoClient().execute({
      sql: `
        INSERT INTO pets (id, name, type, breed, weight, activity, water_ml, food_g)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [pet.id, pet.name, pet.type, pet.breed || '', pet.weight, pet.activity, pet.water_ml, pet.food_g]
    });
    return { changes: 1 };
  }

  const stmt = db.prepare(`
    INSERT INTO pets (id, name, type, breed, weight, activity, water_ml, food_g)
    VALUES (@id, @name, @type, @breed, @weight, @activity, @water_ml, @food_g)
  `);
  return stmt.run(pet);
}

async function deletePet(id) {
  if (isTursoEnabled()) {
    await ensurePetsTable();
    const result = await getTursoClient().execute({
      sql: 'DELETE FROM pets WHERE id = ?',
      args: [id]
    });
    return { changes: result.rowsAffected || 0 };
  }

  const stmt = db.prepare('DELETE FROM pets WHERE id = ?');
  return stmt.run(id);
}

async function getSummary() {
  if (isTursoEnabled()) {
    await ensurePetsTable();
    const result = await getTursoClient().execute(`
      SELECT
        COUNT(*) as totalPets,
        COALESCE(SUM(water_ml), 0) as totalWater,
        COALESCE(SUM(food_g), 0) as totalFood
      FROM pets
    `);
    const row = result.rows[0] || { totalPets: 0, totalWater: 0, totalFood: 0 };
    return {
      totalPets: Number(row.totalPets || 0),
      totalWater: Number(row.totalWater || 0),
      totalFood: Number(row.totalFood || 0)
    };
  }

  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as totalPets,
      COALESCE(SUM(water_ml), 0) as totalWater,
      COALESCE(SUM(food_g), 0) as totalFood
    FROM pets
  `);
  return stmt.get();
}

function closeDB() {
  if (db) {
    db.close();
    db = null;
  }

  tursoClient = null;
}

function getDB() {
  return isTursoEnabled() ? getTursoClient() : db;
}

module.exports = {
  initDB,
  getAllPets,
  addPet,
  deletePet,
  getSummary,
  closeDB,
  getDB,
  isTursoEnabled
};
