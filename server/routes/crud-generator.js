const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// POST /api/crud-generator - Generate CRUD module
router.post('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { moduleName, routePath, fields } = req.body;

    if (!moduleName || !routePath || !fields || !Array.isArray(fields)) {
      return res.status(400).json({
        ok: false,
        message: 'Module name, route path, and fields are required'
      });
    }

    // Validate module name (snake_case)
    if (!/^[a-z][a-z0-9_]*$/.test(moduleName)) {
      return res.status(400).json({
        ok: false,
        message: 'Module name must be in snake_case format (lowercase letters, numbers, underscores)'
      });
    }

    // Validate route path
    if (!routePath.startsWith('/')) {
      return res.status(400).json({
        ok: false,
        message: 'Route path must start with /'
      });
    }

    // Generate backend route file
    const routeContent = generateRouteFile(moduleName, fields);
    const routeFilePath = path.join(__dirname, `${moduleName}.js`);
    fs.writeFileSync(routeFilePath, routeContent);

    // Generate frontend page component
    const componentContent = generateReactComponent(moduleName, routePath, fields);
    const componentFilePath = path.join(__dirname, '../../client/src/pages', `${capitalizeFirst(moduleName)}.jsx`);
    fs.writeFileSync(componentFilePath, componentContent);

    // Create database table
    await createDatabaseTable(moduleName, fields);

    // Update server/index.js to include new route
    await updateServerIndex(moduleName);

    // Update client/App.jsx to include new route
    await updateClientApp(moduleName, routePath);

    // Update seed.js to include table creation
    await updateSeedFile(moduleName, fields);

    res.json({
      ok: true,
      message: 'CRUD module generated successfully',
      module: moduleName,
      route: routePath,
      files: {
        backend: `server/routes/${moduleName}.js`,
        frontend: `client/src/pages/${capitalizeFirst(moduleName)}.jsx`
      }
    });

  } catch (err) {
    console.error('CRUD generation error:', err);
    res.status(500).json({
      ok: false,
      message: 'Failed to generate CRUD module',
      error: err.message
    });
  }
});

function generateRouteFile(moduleName, fields) {
  const capitalizedModule = capitalizeFirst(moduleName);
  const tableName = moduleName;

  // Build validation functions
  let validationCode = '';
  fields.forEach(field => {
    if (field.required) {
      validationCode += `    if (!${field.name}) {\n`;
      validationCode += `      return res.status(400).json({ ok: false, message: '${capitalizeFirst(field.name)} is required' });\n`;
      validationCode += `    }\n`;
    }

    if (field.type === 'email' && field.required) {
      validationCode += `    if (!validateEmail(${field.name})) {\n`;
      validationCode += `      return res.status(400).json({ ok: false, message: 'Invalid email format' });\n`;
      validationCode += `    }\n`;
    }
  });

  // Build SQL queries
  const selectFields = ['id', ...fields.map(f => f.name), 'created_at', 'updated_at'].join(', ');
  const insertFields = fields.map(f => f.name).join(', ');
  const insertPlaceholders = fields.map(() => '?').join(', ');
  const insertValues = fields.map(f => `req.body.${f.name}`).join(', ');

  // Build search fields
  const textFields = fields.filter(f => f.type === 'text' || f.type === 'textarea');
  const searchFieldsStr = textFields.length ? textFields.map(f => `${f.name} LIKE ?`).join(' OR ') : '1=1';
  const searchParamsStr = textFields.length ? textFields.map(() => `'%' + search + '%'`).join(', ') : '';

  // Build update fields
  const updateFieldsCode = fields.map(field => {
    return `    if (${field.name} !== undefined) {
      updateFields.push('${field.name} = ?');
      updateValues.push(${field.name});
    }`;
  }).join('\n');

  let routeContent = `const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// Validation helper
function validateEmail(email) {
  const emailRegex = /^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$/;
  return emailRegex.test(email);
}

// GET /api/${moduleName} - Get all ${moduleName} with pagination and search
router.get('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE ${searchFieldsStr}';
      params = [${searchParamsStr}];
    }

    // Get total count
    const [countResult] = await pool.query(
      \`SELECT COUNT(*) as total FROM ${tableName} \${whereClause}\`,
      params
    );
    const total = countResult[0].total;

    // Get ${moduleName}
    const [rows] = await pool.query(\`
      SELECT ${selectFields}
      FROM ${tableName}
      \${whereClause}
      ORDER BY created_at DESC
      LIMIT \${parsedLimit} OFFSET \${offset}
    \`, params);

    res.json({
      ok: true,
      ${moduleName}: rows,
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

// GET /api/${moduleName}/:id - Get ${moduleName} by ID
router.get('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT ${selectFields} FROM ${tableName} WHERE id = ?',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: '${capitalizedModule} not found' });
    }

    res.json({ ok: true, ${moduleName.slice(-1) === 's' ? moduleName.slice(0, -1) : moduleName}: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/${moduleName} - Create new ${moduleName}
router.post('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { ${fields.map(f => f.name).join(', ')} } = req.body;

${validationCode}
    const [result] = await pool.query(
      'INSERT INTO ${tableName} (${insertFields}) VALUES (${insertPlaceholders})',
      [${insertValues}]
    );

    res.status(201).json({
      ok: true,
      message: '${capitalizedModule} created successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// PUT /api/${moduleName}/:id - Update ${moduleName}
router.put('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { ${fields.map(f => f.name).join(', ')} } = req.body;

    // Check if ${moduleName.slice(-1) === 's' ? moduleName.slice(0, -1) : moduleName} exists
    const [itemRows] = await pool.query('SELECT id FROM ${tableName} WHERE id = ?', [id]);
    if (!itemRows.length) {
      return res.status(404).json({ ok: false, message: '${capitalizedModule} not found' });
    }

    let updateFields = [];
    let updateValues = [];

${updateFieldsCode}

    if (updateFields.length) {
      updateValues.push(id);
      await pool.query(\`UPDATE ${tableName} SET \${updateFields.join(', ')} WHERE id = ?\`, updateValues);
    }

    res.json({ ok: true, message: '${capitalizedModule} updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// DELETE /api/${moduleName}/:id - Delete ${moduleName}
router.delete('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ${moduleName.slice(-1) === 's' ? moduleName.slice(0, -1) : moduleName} exists
    const [itemRows] = await pool.query('SELECT id FROM ${tableName} WHERE id = ?', [id]);
    if (!itemRows.length) {
      return res.status(404).json({ ok: false, message: '${capitalizedModule} not found' });
    }

    await pool.query('DELETE FROM ${tableName} WHERE id = ?', [id]);

    res.json({ ok: true, message: '${capitalizedModule} deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;`;

  // Replace placeholders with actual values
  routeContent = routeContent.replace(/\$\{moduleName\}/g, moduleName);
  routeContent = routeContent.replace(/\$\{tableName\}/g, tableName);
  routeContent = routeContent.replace(/\$\{selectFields\}/g, selectFields);
  routeContent = routeContent.replace(/\$\{insertFields\}/g, insertFields);
  routeContent = routeContent.replace(/\$\{insertPlaceholders\}/g, insertPlaceholders);
  routeContent = routeContent.replace(/\$\{insertValues\}/g, insertValues);
  routeContent = routeContent.replace(/\$\{searchFieldsStr\}/g, searchFieldsStr);
  routeContent = routeContent.replace(/\$\{searchParamsStr\}/g, searchParamsStr);
  routeContent = routeContent.replace(/\$\{updateFieldsCode\}/g, updateFieldsCode);
  routeContent = routeContent.replace(/\$\{capitalizedModule\}/g, capitalizedModule);
  routeContent = routeContent.replace(/\$\{validationCode\}/g, validationCode);

  return routeContent;
}

function generateReactComponent(moduleName, routePath, fields) {
  const capitalizedModule = capitalizeFirst(moduleName);
  const singularModule = moduleName.slice(-1) === 's' ? moduleName.slice(0, -1) : moduleName;

  // Build form fields
  const formFields = fields.map(field => {
    let fieldHtml = '';
    if (field.type === 'select') {
      fieldHtml = `
                    <div>
                      <label className="block text-sm font-medium mb-1">${capitalizeFirst(field.name)}</label>
                      <select
                        value={formData.${field.name}}
                        onChange={(e) => setFormData({ ...formData, ${field.name}: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ${field.required ? 'required' : ''}
                      >
                        <option value="">Select ${capitalizeFirst(field.name)}</option>
                        ${field.options ? field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('\n                        ') : ''}
                      </select>
                    </div>`;
    } else if (field.type === 'textarea') {
      fieldHtml = `
                    <div>
                      <label className="block text-sm font-medium mb-1">${capitalizeFirst(field.name)}</label>
                      <textarea
                        value={formData.${field.name}}
                        onChange={(e) => setFormData({ ...formData, ${field.name}: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        ${field.required ? 'required' : ''}
                      />
                    </div>`;
    } else {
      fieldHtml = `
                    <div>
                      <label className="block text-sm font-medium mb-1">${capitalizeFirst(field.name)}</label>
                      <input
                        type="${field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}"
                        value={formData.${field.name}}
                        onChange={(e) => setFormData({ ...formData, ${field.name}: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ${field.required ? 'required' : ''}
                      />
                    </div>`;
    }
    return fieldHtml;
  }).join('');

  // Build table columns
  const columns = fields.map(field => `
    {
      name: '${capitalizeFirst(field.name)}',
      selector: row => row.${field.name},
      sortable: true,
    },`).join('');

  return `import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import DataTable from 'react-data-table-component'
import Layout from '../components/Layout'
import * as FaIcons from 'react-icons/fa'

export default function ${capitalizedModule}() {
  const [${moduleName}, set${capitalizedModule}] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule}, setEditing${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule}] = useState(null)
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [formData, setFormData] = useState({
${fields.map(field => `    ${field.name}: '',`).join('\n')}
  })

  useEffect(() => {
    fetch${capitalizedModule}()
  }, [pagination.page, limit, search])

  const fetch${capitalizedModule} = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/${moduleName}', {
        params: { page: pagination.page, limit, search },
        withCredentials: true
      })
      set${capitalizedModule}(res.data.${moduleName})
      setPagination(res.data.pagination)
    } catch (err) {
      toast.error('Failed to fetch ${moduleName}')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule}) {
        await axios.put(\`http://localhost:4000/api/${moduleName}/\${editing${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule}.id}\`, formData, { withCredentials: true })
        toast.success('${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule} updated successfully')
      } else {
        await axios.post('http://localhost:4000/api/${moduleName}', formData, { withCredentials: true })
        toast.success('${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule} created successfully')
      }
      setShowModal(false)
      setEditing${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule}(null)
      resetForm()
      fetch${capitalizedModule}()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ${singularModule}?')) return
    try {
      await axios.delete(\`http://localhost:4000/api/${moduleName}/\${id}\`, { withCredentials: true })
      toast.success('${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule} deleted successfully')
      fetch${capitalizedModule}()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleEdit = (${singularModule}) => {
    setEditing${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule}(${singularModule})
    setFormData({
${fields.map(field => `      ${field.name}: ${singularModule}.${field.name} || '',`).join('\n')}
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
${fields.map(field => `      ${field.name}: '',`).join('\n')}
    })
  }

  const columns = [
${columns}
    {
      name: 'Created',
      selector: row => new Date(row.created_at).toLocaleDateString(),
      sortable: true,
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
      width: '150px'
    },
  ]

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: '#f3f4f6',
        fontWeight: 'bold',
        fontSize: '14px',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    cells: {
      style: {
        fontSize: '14px',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
  }

  return (
    <Layout title="${capitalizedModule} Management">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">${capitalizedModule} Management</h2>
          <button
            onClick={() => {
              setEditing${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule}(null)
              resetForm()
              setShowModal(true)
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 btn-xs"
          >
            <FaIcons.FaPlus /> Add ${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule}
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search ${moduleName}..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>

        <div className="relative">
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={${moduleName}}
              progressPending={loading}
              pagination
              paginationServer
              paginationTotalRows={pagination.total}
              paginationPerPage={limit}
              paginationRowsPerPageOptions={[5, 10, 25, 50]}
              onChangePage={(page) => setPagination(prev => ({ ...prev, page }))}
              onChangeRowsPerPage={(newLimit) => setLimit(newLimit)}
              customStyles={customStyles}
              highlightOnHover
              responsive
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editing${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule} ? 'Edit ${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule}' : 'Add ${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule}'}
            </h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
${formFields}
                </div>

                {/* Tombol */}
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {editing${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule} ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditing${capitalizedModule.slice(-1) === 's' ? capitalizedModule.slice(0, -1) : capitalizedModule}(null)
                      resetForm()
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>

          </div>
        </div>
      )}
    </Layout>
  )
}
`;
}

async function createDatabaseTable(moduleName, fields) {
  const tableName = moduleName;

  let createTableSQL = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
`;

  fields.forEach(field => {
    let sqlType = 'VARCHAR(255)';
    switch (field.type) {
      case 'text':
      case 'textarea':
        sqlType = 'TEXT';
        break;
      case 'email':
        sqlType = 'VARCHAR(255)';
        break;
      case 'number':
        sqlType = 'DECIMAL(10,2)';
        break;
      case 'date':
        sqlType = 'DATE';
        break;
      case 'datetime':
        sqlType = 'DATETIME';
        break;
      case 'select':
        sqlType = 'VARCHAR(100)';
        break;
      default:
        sqlType = 'VARCHAR(255)';
    }

    createTableSQL += `  \`${field.name}\` ${sqlType}${field.required ? ' NOT NULL' : ''},\n`;
  });

  createTableSQL += `  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

  try {
    await pool.query(createTableSQL);
    console.log(`Table ${tableName} created successfully`);
  } catch (err) {
    console.error('Error creating table:', err);
    throw err;
  }
}

async function updateServerIndex(moduleName) {
  const indexPath = path.join(__dirname, '../index.js');
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // Add import
  const importLine = `const ${moduleName}Routes = require('./routes/${moduleName}');`;
  if (!indexContent.includes(importLine)) {
    indexContent = indexContent.replace(
      /const menuRoutes = require\('\.\/routes\/menus'\);/,
      `const menuRoutes = require('./routes/menus');\n${importLine}`
    );
  }

  // Add route
  const routeLine = `app.use('/api/${moduleName}', ${moduleName}Routes);`;
  if (!indexContent.includes(routeLine)) {
    indexContent = indexContent.replace(
      /app\.use\('\/api\/menus', menuRoutes\);/,
      `app.use('/api/menus', menuRoutes);\n${routeLine}`
    );
  }

  fs.writeFileSync(indexPath, indexContent);
}

async function updateClientApp(moduleName, routePath) {
  const appPath = path.join(__dirname, '../../client/src/App.jsx');
  let appContent = fs.readFileSync(appPath, 'utf8');

  // Add import
  const capitalizedModule = capitalizeFirst(moduleName);
  const importLine = `import ${capitalizedModule} from './pages/${capitalizedModule}'`;
  if (!appContent.includes(importLine)) {
    appContent = appContent.replace(
      /import Menus from '\.\/pages\/Menus'/,
      `import Menus from './pages/Menus'\nimport ${capitalizedModule} from './pages/${capitalizedModule}'`
    );
  }

  // Add route
  const routeLine = `      <Route path="${routePath}" element={<Protected><${capitalizedModule} /></Protected>} />`;
  if (!appContent.includes(routeLine)) {
    appContent = appContent.replace(
      /      <Route path="\/menus" element=\{<Protected><Menus \/><\/Protected>\} \/>/,
      `      <Route path="/menus" element={<Protected><Menus /></Protected>} />\n${routeLine}`
    );
  }

  fs.writeFileSync(appPath, appContent);
}

async function updateSeedFile(moduleName, fields) {
  const seedPath = path.join(__dirname, '../seed.js');
  let seedContent = fs.readFileSync(seedPath, 'utf8');

  // Add table creation in the appropriate place
  const tableCreationCode = `
  // Create ${moduleName} table
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS ${moduleName} (
      id INT AUTO_INCREMENT PRIMARY KEY,
${fields.map(field => {
  let sqlType = 'VARCHAR(255)';
  switch (field.type) {
    case 'text':
    case 'textarea':
      sqlType = 'TEXT';
      break;
    case 'email':
      sqlType = 'VARCHAR(255)';
      break;
    case 'number':
      sqlType = 'INT';
      break;
    case 'date':
      sqlType = 'DATE';
      break;
    case 'datetime':
      sqlType = 'DATETIME';
      break;
    case 'select':
      sqlType = 'VARCHAR(100)';
      break;
  }
  return `      ${field.name} ${sqlType}${field.required ? ' NOT NULL' : ''},`;
}).join('\n')}
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  \`);`;

  // Insert before the sample data section
  seedContent = seedContent.replace(
    /  \/\/ Insert sample data/,
    `${tableCreationCode}\n\n  // Insert sample data`
  );

  fs.writeFileSync(seedPath, seedContent);
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = router;
