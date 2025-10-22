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
    let params = [];

    if (search) {
      whereClause = 'WHERE m.name LIKE ? OR m.path LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM menus m ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get menus
    const [rows] = await pool.query(`
      SELECT m.*, p.name as parent_name,
             GROUP_CONCAT(mp.permission_id) as permission_ids
      FROM menus m
      LEFT JOIN menus p ON m.parent_id = p.id
      LEFT JOIN menu_permissions mp ON m.id = mp.menu_id
      ${whereClause}
      GROUP BY m.id
      ORDER BY m.sort_order ASC, m.created_at DESC
      LIMIT ${parsedLimit} OFFSET ${offset}
    `, params);

    const menus = rows.map(menu => ({
      ...menu,
      permission_ids: menu.permission_ids ? menu.permission_ids.split(',').map(id => parseInt(id)) : []
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
    const [rows] = await pool.query(`
      SELECT m.*, p.name as parent_name,
             GROUP_CONCAT(mp.permission_id) as permission_ids
      FROM menus m
      LEFT JOIN menus p ON m.parent_id = p.id
      LEFT JOIN menu_permissions mp ON m.id = mp.menu_id
      WHERE m.id = ?
      GROUP BY m.id
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Menu not found' });
    }

    const menu = {
      ...rows[0],
      permission_ids: rows[0].permission_ids ? rows[0].permission_ids.split(',').map(id => parseInt(id)) : []
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
    const [existing] = await pool.query('SELECT id FROM menus WHERE name = ?', [name]);
    if (existing.length) {
      return res.status(409).json({ ok: false, message: 'Menu name already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO menus (name, path, icon, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)',
      [name, path || '', icon || '', parent_id || null, sort_order || 0]
    );

    const menuId = result.insertId;

    // Assign permissions if provided
    if (permissionIds && Array.isArray(permissionIds)) {
      for (const permissionId of permissionIds) {
        await pool.query('INSERT INTO menu_permissions (menu_id, permission_id) VALUES (?, ?)', [menuId, permissionId]);
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
    const [menuRows] = await pool.query('SELECT id FROM menus WHERE id = ?', [id]);
    if (!menuRows.length) {
      return res.status(404).json({ ok: false, message: 'Menu not found' });
    }

    let updateFields = [];
    let updateValues = [];

    if (name) {
      // Check name uniqueness
      const [existing] = await pool.query('SELECT id FROM menus WHERE name = ? AND id != ?', [name, id]);
      if (existing.length) {
        return res.status(409).json({ ok: false, message: 'Menu name already exists' });
      }
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (path !== undefined) {
      updateFields.push('path = ?');
      updateValues.push(path);
    }

    if (icon !== undefined) {
      updateFields.push('icon = ?');
      updateValues.push(icon);
    }

    if (parent_id !== undefined) {
      updateFields.push('parent_id = ?');
      updateValues.push(parent_id);
    }

    if (sort_order !== undefined) {
      updateFields.push('sort_order = ?');
      updateValues.push(sort_order);
    }

    if (updateFields.length) {
      updateValues.push(id);
      await pool.query(`UPDATE menus SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    }

    // Update permissions if provided
    if (permissionIds && Array.isArray(permissionIds)) {
      // Remove existing permissions
      await pool.query('DELETE FROM menu_permissions WHERE menu_id = ?', [id]);
      // Add new permissions
      for (const permissionId of permissionIds) {
        await pool.query('INSERT INTO menu_permissions (menu_id, permission_id) VALUES (?, ?)', [id, permissionId]);
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
    const [menuRows] = await pool.query('SELECT id FROM menus WHERE id = ?', [id]);
    if (!menuRows.length) {
      return res.status(404).json({ ok: false, message: 'Menu not found' });
    }

    // Check if menu has children
    const [childRows] = await pool.query('SELECT COUNT(*) as count FROM menus WHERE parent_id = ?', [id]);
    if (childRows[0].count > 0) {
      return res.status(400).json({ ok: false, message: 'Cannot delete menu that has child menus' });
    }

    await pool.query('DELETE FROM menus WHERE id = ?', [id]);

    res.json({ ok: true, message: 'Menu deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;
