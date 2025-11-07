const pool = require('../db');

module.exports = function (requiredRole) {
  return async function (req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ ok: false, message: 'Unauthorized' });
      }

      // Check if user has the required role
      const roleResult = await pool.query(`
        SELECT r.name
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = $1 AND r.name = $2
      `, [req.user.id, requiredRole]);

      if (roleResult.rows.length === 0) {
        return res.status(403).json({ ok: false, message: 'Forbidden: Insufficient permissions' });
      }

      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, message: 'Server error' });
    }
  };
};
