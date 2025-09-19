// api/wishes.js
const mysql = require('mysql2/promise');

let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 10000,
      ssl: /^true$/i.test(process.env.DB_SSL || '') ? { rejectUnauthorized: false } : undefined
    });
  }
  return pool;
}

const T = process.env.DB_TABLE || 'wishes_ilham_sahitya';

module.exports = async (req, res) => {
  const db = getPool();

  // CORS sederhana (boleh kamu ganti whitelist)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end(); return;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    try {
      const limit = Math.min(parseInt((req.query?.limit ?? '100'), 10), 200);
      const [rows] = await db.query(
        `SELECT id,name,message,status,created_at FROM \`${T}\` ORDER BY id DESC LIMIT ?`,
        [limit]
      );
      res.status(200).json(rows);
    } catch (e) {
      res.status(500).json({ error: 'DB_READ_FAILED' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
      const { name, message, status } = body || {};
      if (!name || !message || !['Hadir','Tidak Hadir'].includes(status)) {
        res.status(400).json({ error: 'BAD_REQUEST' }); return;
      }
      const nm = String(name).slice(0, 100);
      const [r] = await db.query(
        `INSERT INTO \`${T}\` (name,message,status) VALUES (?,?,?)`,
        [nm, message, status]
      );
      const [rows] = await db.query(
        `SELECT id,name,message,status,created_at FROM \`${T}\` WHERE id=?`,
        [r.insertId]
      );
      res.status(201).json(rows[0]);
    } catch (e) {
      res.status(500).json({ error: 'DB_WRITE_FAILED' });
    }
    return;
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  res.status(405).end('Method Not Allowed');
};
