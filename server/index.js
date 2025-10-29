/**
 * Express server setup
 * Developed by D.N. Zaki Zamani
 */
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const menuRoutes = require('./routes/menus');
const booksRoutes = require('./routes/books');
const bookReviewsRoutes = require('./routes/book-reviews');
const pdfFilesRoutes = require('./routes/pdf-files');
const crudGeneratorRoutes = require('./routes/crud-generator');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/book-reviews', bookReviewsRoutes);
app.use('/api/pdf-files', pdfFilesRoutes);
app.use('/api/crud-generator', crudGeneratorRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Server running on', PORT));
