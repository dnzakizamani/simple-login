const jwt = require('jsonwebtoken');
const pool = require('../db');
const dotenv = require('dotenv');
dotenv.config();

module.exports = function (req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ ok: false, message: 'Unauthorized' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Invalid token' });
  }
};

// Middleware to include roles in user object
module.exports.withRoles = async function (req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ ok: false, message: 'Unauthorized' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user roles
    const [roleRows] = await pool.query(`
      SELECT r.name, r.description
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `, [payload.id]);

    const roles = roleRows.map(row => ({ name: row.name, description: row.description }));

    req.user = { ...payload, roles };
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Invalid token' });
  }
};
