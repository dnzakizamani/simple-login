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

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Server running on', PORT));
