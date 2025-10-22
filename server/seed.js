const pool = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
  const pw = await bcrypt.hash('Password123!', 10);
  const adminPw = await bcrypt.hash('Admin123!', 10);

  // Drop existing tables in reverse order to handle foreign keys
  try {
    await pool.query('DROP TABLE IF EXISTS menu_permissions');
    await pool.query('DROP TABLE IF EXISTS role_permissions');
    await pool.query('DROP TABLE IF EXISTS user_roles');
    await pool.query('DROP TABLE IF EXISTS menus');
    await pool.query('DROP TABLE IF EXISTS permissions');
    await pool.query('DROP TABLE IF EXISTS roles');
    await pool.query('DROP TABLE IF EXISTS users');
    console.log('Dropped existing tables');
  } catch (err) {
    console.log('Some tables may not exist, continuing...');
  }

  // Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      gender ENUM('male', 'female') DEFAULT NULL,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Create roles table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create permissions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create menus table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menus (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      path VARCHAR(255),
      icon VARCHAR(100),
      parent_id INT,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE SET NULL
    )
  `);

  // Create user_roles table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INT NOT NULL,
      role_id INT NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    )
  `);

  // Create role_permissions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INT NOT NULL,
      permission_id INT NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `);

  // Create menu_permissions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_permissions (
      menu_id INT NOT NULL,
      permission_id INT NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (menu_id, permission_id),
      FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `);

  // Insert sample data
  // Roles
  const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', ['admin']);
  let adminRoleId;
  if (!roleRows.length) {
    const [result] = await pool.query('INSERT INTO roles (name, description) VALUES (?, ?)', ['admin', 'Administrator with full access']);
    adminRoleId = result.insertId;
  } else {
    adminRoleId = roleRows[0].id;
  }

  const [userRoleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', ['user']);
  let userRoleId;
  if (!userRoleRows.length) {
    const [result] = await pool.query('INSERT INTO roles (name, description) VALUES (?, ?)', ['user', 'Regular user']);
    userRoleId = result.insertId;
  } else {
    userRoleId = userRoleRows[0].id;
  }

  // Permissions
  const permissions = [
    { name: 'user:create', desc: 'Create users' },
    { name: 'user:read', desc: 'Read users' },
    { name: 'user:update', desc: 'Update users' },
    { name: 'user:delete', desc: 'Delete users' },
    { name: 'role:create', desc: 'Create roles' },
    { name: 'role:read', desc: 'Read roles' },
    { name: 'role:update', desc: 'Update roles' },
    { name: 'role:delete', desc: 'Delete roles' },
    { name: 'permission:create', desc: 'Create permissions' },
    { name: 'permission:read', desc: 'Read permissions' },
    { name: 'permission:update', desc: 'Update permissions' },
    { name: 'permission:delete', desc: 'Delete permissions' },
    { name: 'menu:create', desc: 'Create menus' },
    { name: 'menu:read', desc: 'Read menus' },
    { name: 'menu:update', desc: 'Update menus' },
    { name: 'menu:delete', desc: 'Delete menus' }
  ];

  for (const perm of permissions) {
    const [rows] = await pool.query('SELECT id FROM permissions WHERE name = ?', [perm.name]);
    if (!rows.length) {
      await pool.query('INSERT INTO permissions (name, description) VALUES (?, ?)', [perm.name, perm.desc]);
    }
  }

  // Menus
  const menus = [
    { name: 'Dashboard', path: '/dashboard', icon: 'FaHome' },
    { name: 'Users', path: '/users', icon: 'FaUsers' },
    { name: 'Roles', path: '/roles', icon: 'FaShieldAlt' },
    { name: 'Permissions', path: '/permissions', icon: 'FaKey' },
    { name: 'Menus', path: '/menus', icon: 'FaBars' }
  ];

  for (const menu of menus) {
    const [rows] = await pool.query('SELECT id FROM menus WHERE name = ?', [menu.name]);
    if (!rows.length) {
      await pool.query('INSERT INTO menus (name, path, icon) VALUES (?, ?, ?)', [menu.name, menu.path, menu.icon]);
    } else {
      // Update existing menu with new icon
      await pool.query('UPDATE menus SET icon = ? WHERE name = ?', [menu.icon, menu.name]);
    }
  }

  // Sample users
  const [userRows] = await pool.query('SELECT id FROM users WHERE email = ?', ['user@example.com']);
  let userId;
  if (!userRows.length) {
    const [result] = await pool.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', ['masihngoding', 'user@example.com', pw]);
    userId = result.insertId;
  } else {
    userId = userRows[0].id;
  }

  const [adminRows] = await pool.query('SELECT id FROM users WHERE email = ?', ['admin@example.com']);
  let adminId;
  if (!adminRows.length) {
    const [result] = await pool.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', ['admin', 'admin@example.com', adminPw]);
    adminId = result.insertId;
  } else {
    adminId = adminRows[0].id;
  }

  // Assign roles
  await pool.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, userRoleId]);
  await pool.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [adminId, adminRoleId]);

  // Assign permissions to admin role
  const [permRows] = await pool.query('SELECT id FROM permissions');
  for (const perm of permRows) {
    await pool.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [adminRoleId, perm.id]);
  }

  console.log('Database seeded successfully!');
  console.log('Admin user: admin@example.com / Admin123!');
  console.log('Regular user: user@example.com / Password123!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
