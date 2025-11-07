const jwt = require('jsonwebtoken');
const pool = require('../db');
const dotenv = require('dotenv');
dotenv.config();

// Fungsi bantuan untuk mendapatkan token dari berbagai sumber
function getToken(req) {
  // Cek dari header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  
  // Cek dari cookie
  return req.cookies?.token;
}

// Middleware untuk verifikasi token dasar
function verifyToken(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ ok: false, message: 'Unauthorized' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Invalid token' });
  }
}

// Middleware untuk verifikasi token dan menambahkan role
async function verifyTokenWithRoles(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ ok: false, message: 'Unauthorized' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user roles
    const roleResult = await pool.query(`
      SELECT r.name, r.description
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
    `, [payload.id]);

    const roles = roleResult.rows.map(row => ({ name: row.name, description: row.description }));

    req.user = { ...payload, roles };
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Invalid token' });
  }
}

module.exports = {
  verifyToken,
  withRoles: verifyTokenWithRoles
};
