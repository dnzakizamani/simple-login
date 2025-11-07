-- PostgreSQL seed script for Supabase
-- Converted from seed.js (MySQL syntax)

-- Drop existing tables in reverse order to handle foreign keys
DROP TABLE IF EXISTS menu_permissions;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS menus;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS pdf_files;
DROP TABLE IF EXISTS pdf_reading_progress;
DROP TABLE IF EXISTS image_files;
DROP TABLE IF EXISTS moodboard_projects;
DROP TABLE IF EXISTS moodboard_images;
DROP TABLE IF EXISTS file_conversions;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create menus table
CREATE TABLE IF NOT EXISTS menus (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  path VARCHAR(255),
  icon VARCHAR(100),
  parent_id INT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE SET NULL
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Create menu_permissions table
CREATE TABLE IF NOT EXISTS menu_permissions (
  menu_id INT NOT NULL,
  permission_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (menu_id, permission_id),
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Create products table (using the last definition in seed.js)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create pdf_files table
CREATE TABLE IF NOT EXISTS pdf_files (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create pdf_reading_progress table
CREATE TABLE IF NOT EXISTS pdf_reading_progress (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  pdf_id INT NOT NULL,
  current_page INT DEFAULT 1,
  total_pages INT,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pdf_id) REFERENCES pdf_files(id) ON DELETE CASCADE,
  UNIQUE (user_id, pdf_id)
);

-- Create image_files table
CREATE TABLE IF NOT EXISTS image_files (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  watermarked_path TEXT,
  file_size INT NOT NULL,
  user_id INT NOT NULL,
  watermark_text TEXT,
  watermark_opacity DECIMAL(3,2) DEFAULT 0.5,
  watermark_color VARCHAR(7) DEFAULT '#ffffff',
  watermark_font_size INT DEFAULT 24,
  watermark_spacing INT DEFAULT 100,
  watermark_tilt DECIMAL(4,2) DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create moodboard_projects table
CREATE TABLE IF NOT EXISTS moodboard_projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create moodboard_images table
CREATE TABLE IF NOT EXISTS moodboard_images (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT NOT NULL,
  position_x INT DEFAULT 0,
  position_y INT DEFAULT 0,
  width INT DEFAULT 200,
  height INT DEFAULT 200,
  rotation DECIMAL(5,2) DEFAULT 0.0,
  z_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES moodboard_projects(id) ON DELETE CASCADE
);

-- Create file_conversions table
CREATE TABLE IF NOT EXISTS file_conversions (
  id SERIAL PRIMARY KEY,
  original_filename VARCHAR(255) NOT NULL,
  original_file_path TEXT NOT NULL,
  converted_filename VARCHAR(255),
  converted_file_path TEXT,
  original_format VARCHAR(10) NOT NULL,
  target_format VARCHAR(10) NOT NULL,
  file_size INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample data
-- Roles
INSERT INTO roles (name, description) VALUES ('admin', 'Administrator with full access') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name, description) VALUES ('user', 'Regular user') ON CONFLICT (name) DO NOTHING;

-- Permissions
INSERT INTO permissions (name, description) VALUES ('user:create', 'Create users') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('user:read', 'Read users') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('user:update', 'Update users') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('user:delete', 'Delete users') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('role:create', 'Create roles') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('role:read', 'Read roles') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('role:update', 'Update roles') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('role:delete', 'Delete roles') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('permission:create', 'Create permissions') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('permission:read', 'Read permissions') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('permission:update', 'Update permissions') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('permission:delete', 'Delete permissions') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('menu:create', 'Create menus') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('menu:read', 'Read menus') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('menu:update', 'Update menus') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions (name, description) VALUES ('menu:delete', 'Delete menus') ON CONFLICT (name) DO NOTHING;

-- Menus
INSERT INTO menus (name, path, icon) VALUES ('Dashboard', '/dashboard', 'FaHome') ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon;
INSERT INTO menus (name, path, icon) VALUES ('Users', '/users', 'FaUsers') ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon;
INSERT INTO menus (name, path, icon) VALUES ('Roles', '/roles', 'FaShieldAlt') ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon;
INSERT INTO menus (name, path, icon) VALUES ('Permissions', '/permissions', 'FaKey') ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon;
INSERT INTO menus (name, path, icon) VALUES ('Menus', '/menus', 'FaBars') ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon;
INSERT INTO menus (name, path, icon) VALUES ('PDF Library', '/pdfs', 'FaFilePdf') ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon;
INSERT INTO menus (name, path, icon) VALUES ('Images', '/images', 'FaImages') ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon;
INSERT INTO menus (name, path, icon) VALUES ('Moodboards', '/moodboards', 'FaPalette') ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon;
INSERT INTO menus (name, path, icon) VALUES ('File Converter', '/converter', 'FaFileAlt') ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon;
INSERT INTO menus (name, path, icon) VALUES ('CRUD Generator', '/crud-generator', 'FaMagic') ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon;

-- Sample users (passwords hashed with bcrypt, salt rounds 10)
-- 'Password123!' hashed: $2a$10$... (placeholder, use actual hash)
-- For simplicity, using pre-computed hashes. In practice, generate them.
-- Assuming pw = '$2a$10$example.hash.for.Password123!'
-- adminPw = '$2a$10$example.hash.for.Admin123!'
-- Note: Replace with actual bcrypt hashes for 'Password123!' and 'Admin123!'

INSERT INTO users (username, email, password_hash) VALUES ('masihngoding', 'user@example.com', '$2a$10$example.hash.for.Password123!') ON CONFLICT (email) DO NOTHING;
INSERT INTO users (username, email, password_hash) VALUES ('admin', 'admin@example.com', '$2a$10$example.hash.for.Admin123!') ON CONFLICT (email) DO NOTHING;

-- Assign roles (assuming IDs: admin role id=1, user role id=2, user id=1, admin id=2)
-- In PostgreSQL, to get IDs, but for seed, hardcode or use subqueries.

-- First, get role IDs
-- Admin role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'admin@example.com' AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- User role for regular user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'user@example.com' AND r.name = 'user'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;
