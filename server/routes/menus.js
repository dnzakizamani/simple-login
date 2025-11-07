const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// GET /api/menus - Get all menus with pagination and search (admin only)
router.get('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    let whereClause = '';
    let params = [parsedLimit, offset];

    if (search) {
      whereClause = 'WHERE m.name ILIKE $3 OR m.path ILIKE $4';
      params = [parsedLimit, offset, `%${search}%`, `%${search}%`];
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM menus m ${whereClause.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) + 2}`)}`,
      search ? [`%${search}%`, `%${search}%`] : []
    );
    const total = parseInt(countResult.rows[0].total);

    // Get menus
    const queryParams = search ? [parsedLimit, offset, `%${search}%`, `%${search}%`] : [parsedLimit, offset];
    const queryWhereClause = search ? 'WHERE m.name ILIKE $3 OR m.path ILIKE $4' : '';
    
    const result = await pool.query(`
      SELECT m.*, p.name as parent_name,
             string_agg(mp.permission_id::text, ',') as permission_ids
      FROM menus m
      LEFT JOIN menus p ON m.parent_id = p.id
      LEFT JOIN menu_permissions mp ON m.id = mp.menu_id
      ${queryWhereClause}
      GROUP BY m.id, p.name
      ORDER BY m.sort_order ASC, m.created_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);

    const menus = result.rows.map(menu => ({
      ...menu,
      permission_ids: menu.permission_ids ? menu.permission_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : []
    }));

    res.json({
      ok: true,
      menus,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// GET /api/menus/:id - Get menu by ID (admin only)
router.get('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT m.*, p.name as parent_name,
             string_agg(mp.permission_id::text, ',') as permission_ids
      FROM menus m
      LEFT JOIN menus p ON m.parent_id = p.id
      LEFT JOIN menu_permissions mp ON m.id = mp.menu_id
      WHERE m.id = $1
      GROUP BY m.id, p.name
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ ok: false, message: 'Menu not found' });
    }

    const menu = {
      ...result.rows[0],
      permission_ids: result.rows[0].permission_ids ? result.rows[0].permission_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : []
    };

    res.json({ ok: true, menu });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/menus - Create new menu (admin only)
router.post('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { name, path, icon, parent_id, sort_order, permissionIds } = req.body;

    if (!name) {
      return res.status(400).json({ ok: false, message: 'Menu name is required' });
    }

    // Check if menu name already exists
    const existing = await pool.query('SELECT id FROM menus WHERE name = $1', [name]);
    if (existing.rows.length) {
      return res.status(409).json({ ok: false, message: 'Menu name already exists' });
    }

    const result = await pool.query(
      'INSERT INTO menus (name, path, icon, parent_id, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, path || '', icon || '', parent_id || null, sort_order || 0]
    );

    const menuId = result.rows[0].id;

    // Assign permissions if provided
    if (permissionIds && Array.isArray(permissionIds)) {
      for (const permissionId of permissionIds) {
        await pool.query('INSERT INTO menu_permissions (menu_id, permission_id) VALUES ($1, $2)', [menuId, permissionId]);
      }
    }

    res.status(201).json({ ok: true, message: 'Menu created successfully', menuId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// PUT /api/menus/:id - Update menu (admin only)
router.put('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, path, icon, parent_id, sort_order, permissionIds } = req.body;

    // Check if menu exists
    const menuRows = await pool.query('SELECT id FROM menus WHERE id = $1', [id]);
    if (!menuRows.rows.length) {
      return res.status(404).json({ ok: false, message: 'Menu not found' });
    }

    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (name) {
      // Check name uniqueness
      const existing = await pool.query('SELECT id FROM menus WHERE name = $1 AND id != $2', [name, id]);
      if (existing.rows.length) {
        return res.status(409).json({ ok: false, message: 'Menu name already exists' });
      }
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(name);
      paramIndex++;
    }

    if (path !== undefined) {
      updateFields.push(`path = $${paramIndex}`);
      updateValues.push(path);
      paramIndex++;
    }

    if (icon !== undefined) {
      updateFields.push(`icon = $${paramIndex}`);
      updateValues.push(icon);
      paramIndex++;
    }

    if (parent_id !== undefined) {
      updateFields.push(`parent_id = $${paramIndex}`);
      updateValues.push(parent_id);
      paramIndex++;
    }

    if (sort_order !== undefined) {
      updateFields.push(`sort_order = $${paramIndex}`);
      updateValues.push(sort_order);
      paramIndex++;
    }

    if (updateFields.length) {
      updateValues.push(id); // for WHERE clause
      await pool.query(`UPDATE menus SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`, updateValues);
    }

    // Update permissions if provided
    if (permissionIds && Array.isArray(permissionIds)) {
      // Remove existing permissions
      await pool.query('DELETE FROM menu_permissions WHERE menu_id = $1', [id]);
      // Add new permissions
      for (const permissionId of permissionIds) {
        await pool.query('INSERT INTO menu_permissions (menu_id, permission_id) VALUES ($1, $2)', [id, permissionId]);
      }
    }

    res.json({ ok: true, message: 'Menu updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// DELETE /api/menus/:id - Delete menu (admin only)
router.delete('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if menu exists
    const menuRows = await pool.query('SELECT id FROM menus WHERE id = $1', [id]);
    if (!menuRows.rows.length) {
      return res.status(404).json({ ok: false, message: 'Menu not found' });
    }

    // Check if menu has children
    const childRows = await pool.query('SELECT COUNT(*) as count FROM menus WHERE parent_id = $1', [id]);
    if (parseInt(childRows.rows[0].count) > 0) {
      return res.status(400).json({ ok: false, message: 'Cannot delete menu that has child menus' });
    }

    await pool.query('DELETE FROM menus WHERE id = $1', [id]);

    res.json({ ok: true, message: 'Menu deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;
