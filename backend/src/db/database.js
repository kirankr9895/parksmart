import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure db directory exists
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'parksmart.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for high performance & concurrency safety
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Run a query that returns multiple rows
 */
export function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (err) {
    console.error('DB query error:', err.message, 'SQL:', sql);
    throw err;
  }
}

/**
 * Run a query that returns a single row
 */
export function get(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  } catch (err) {
    console.error('DB get error:', err.message, 'SQL:', sql);
    throw err;
  }
}

/**
 * Execute an INSERT, UPDATE, or DELETE statement
 */
export function run(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return {
      lastInsertRowid: result.lastInsertRowid,
      changes: result.changes
    };
  } catch (err) {
    console.error('DB run error:', err.message, 'SQL:', sql);
    throw err;
  }
}

/**
 * Execute multiple SQL statements (DDL / migrations)
 */
export function exec(sql) {
  try {
    return db.exec(sql);
  } catch (err) {
    console.error('DB exec error:', err.message);
    throw err;
  }
}

/**
 * Concurrency-safe transaction wrapper
 */
export function transaction(fn) {
  try {
    db.exec('BEGIN IMMEDIATE TRANSACTION');
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch (rbErr) {
      // ignore rollback err
    }
    throw err;
  }
}

export default {
  query,
  get,
  run,
  exec,
  transaction,
  db
};
