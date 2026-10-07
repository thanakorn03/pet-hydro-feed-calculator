// =============================================
// db.js — SQLite Database Helper
// Pet Hydro-Feed Calculator
// =============================================

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;

/**
 * Initialize SQLite database and create tables if not exist
 * @param {string} dbPath - Path to the SQLite database file
 * @returns {Database} - SQLite database instance
 */
function initDB(dbPath) {
  // Ensure the data directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  const VALID_PET_TYPES = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'mouse'];

  // Create pets table if it doesn't exist
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

  return db;
}

/**
 * Get all pets ordered by newest first
 * @returns {Array} - List of all pet records
 */
function getAllPets() {
  const stmt = db.prepare('SELECT * FROM pets ORDER BY created_at DESC');
  return stmt.all();
}

/**
 * Add a new pet record
 * @param {Object} pet - Pet data { id, name, type, weight, activity, water_ml, food_g }
 * @returns {Object} - Insert result info
 */
function addPet(pet) {
  const stmt = db.prepare(`
    INSERT INTO pets (id, name, type, breed, weight, activity, water_ml, food_g)
    VALUES (@id, @name, @type, @breed, @weight, @activity, @water_ml, @food_g)
  `);
  return stmt.run(pet);
}

/**
 * Delete a pet record by ID
 * @param {string} id - Pet UUID
 * @returns {Object} - Delete result info (changes: number of rows deleted)
 */
function deletePet(id) {
  const stmt = db.prepare('DELETE FROM pets WHERE id = ?');
  return stmt.run(id);
}

/**
 * Get summary statistics
 * @returns {Object} - { totalPets, totalWater, totalFood }
 */
function getSummary() {
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as totalPets,
      COALESCE(SUM(water_ml), 0) as totalWater,
      COALESCE(SUM(food_g), 0) as totalFood
    FROM pets
  `);
  return stmt.get();
}

/**
 * Close the database connection
 */
function closeDB() {
  if (db) {
    db.close();
  }
}

/**
 * Get the database instance (for testing)
 * @returns {Database} - SQLite database instance
 */
function getDB() {
  return db;
}

module.exports = {
  initDB,
  getAllPets,
  addPet,
  deletePet,
  getSummary,
  closeDB,
  getDB
};
