// api/ping.js
const mysql = require('mysql2/promise');

module.exports = async (req, res) => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      connectTimeout: 8000,
      ssl: /^true$/i.test(process.env.DB_SSL || '') ? { rejectUnauthorized: false } : undefined
    });
    const [rows] = await conn.query('SELECT 1 AS ok');
    await conn.end();
    res.status(200).json({ ok: rows[0]?.ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
