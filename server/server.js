const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menus');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const pdfFileRoutes = require('./routes/pdf-files');
const imageFileRoutes = require('./routes/image-files');
const moodboardRoutes = require('./routes/moodboards');
const fileConversionRoutes = require('./routes/file-conversions');
const crudGeneratorRoutes = require('./routes/crud-generator');
const transactionRoutes = require('./routes/transactions');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pdf-files', pdfFileRoutes);
app.use('/api/image-files', imageFileRoutes);
app.use('/api/moodboards', moodboardRoutes);
app.use('/api/file-conversions', fileConversionRoutes);
app.use('/api/crud-generator', crudGeneratorRoutes);
app.use('/api/transactions', transactionRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;