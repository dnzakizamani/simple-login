const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const auth = require('../middleware/auth');
const axios = require('axios');
const { translate } = require('@vitalets/google-translate-api');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Get all PDF files for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, filename, original_filename, file_size, created_at FROM pdf_files WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ pdfs: rows });
  } catch (err) {
    console.error('Error fetching PDFs:', err);
    res.status(500).json({ message: 'Failed to fetch PDFs' });
  }
});

// Upload a new PDF file
router.post('/upload', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file provided' });
    }

    const { title } = req.body;
    if (!title) {
      // Delete uploaded file if title is missing
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Title is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO pdf_files (title, filename, original_filename, file_path, file_size, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, req.file.filename, req.file.originalname, req.file.path, req.file.size, req.user.id]
    );

    res.status(201).json({
      message: 'PDF uploaded successfully',
      pdf: {
        id: result.insertId,
        title,
        filename: req.file.filename,
        original_filename: req.file.originalname,
        file_size: req.file.size,
        created_at: new Date()
      }
    });
  } catch (err) {
    console.error('Error uploading PDF:', err);
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to upload PDF' });
  }
});

// Get a specific PDF file
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM pdf_files WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    const pdf = rows[0];
    res.json({ pdf });
  } catch (err) {
    console.error('Error fetching PDF:', err);
    res.status(500).json({ message: 'Failed to fetch PDF' });
  }
});

// Download PDF file
router.get('/:id/download', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM pdf_files WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    const pdf = rows[0];
    if (!fs.existsSync(pdf.file_path)) {
      return res.status(404).json({ message: 'PDF file not found on disk' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.original_filename}"`);
    res.sendFile(pdf.file_path);
  } catch (err) {
    console.error('Error downloading PDF:', err);
    res.status(500).json({ message: 'Failed to download PDF' });
  }
});

// Delete PDF file
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM pdf_files WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    const pdf = rows[0];

    // Delete file from disk
    if (fs.existsSync(pdf.file_path)) {
      fs.unlinkSync(pdf.file_path);
    }

    // Delete from database
    await pool.query('DELETE FROM pdf_files WHERE id = ?', [req.params.id]);

    res.json({ message: 'PDF deleted successfully' });
  } catch (err) {
    console.error('Error deleting PDF:', err);
    res.status(500).json({ message: 'Failed to delete PDF' });
  }
});

// Get reading progress for a PDF
router.get('/:id/progress', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM pdf_reading_progress WHERE pdf_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.json({ progress: null });
    }

    res.json({ progress: rows[0] });
  } catch (err) {
    console.error('Error fetching reading progress:', err);
    res.status(500).json({ message: 'Failed to fetch reading progress' });
  }
});

// Update reading progress
router.post('/:id/progress', auth, async (req, res) => {
  try {
    const { current_page, total_pages } = req.body;

    await pool.query(
      `INSERT INTO pdf_reading_progress (user_id, pdf_id, current_page, total_pages)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE current_page = VALUES(current_page), total_pages = VALUES(total_pages)`,
      [req.user.id, req.params.id, current_page, total_pages]
    );

    res.json({ message: 'Reading progress updated' });
  } catch (err) {
    console.error('Error updating reading progress:', err);
    res.status(500).json({ message: 'Failed to update reading progress' });
  }
});

// Translate text endpoint with fallback to multiple services
router.post('/:id/translate', auth, async (req, res) => {
  try {
    const { text, from = 'en', to = 'id' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Text is required for translation' });
    }

    // Try Google Translate first (with rate limiting handling)
    try {
      const result = await translate(text, { from, to });
      return res.json({ translatedText: result.text });
    } catch (googleErr) {
      console.log('Google Translate failed, trying LibreTranslate...');

      // Fallback to LibreTranslate (requires API key for production)
      try {
        const response = await axios.post('https://libretranslate.com/translate', {
          q: text,
          source: from,
          target: to,
          format: 'text'
        });
        return res.json({ translatedText: response.data.translatedText });
      } catch (libreErr) {
        console.log('LibreTranslate failed, trying MyMemory...');

        // Final fallback to MyMemory (no API key needed)
        try {
          const response = await axios.get('https://api.mymemory.translated.net/get', {
            params: {
              q: text,
              langpair: `${from}|${to}`
            }
          });
          return res.json({ translatedText: response.data.responseData.translatedText });
        } catch (memoryErr) {
          console.error('All translation services failed');
          return res.status(500).json({ message: 'All translation services are currently unavailable' });
        }
      }
    }
  } catch (err) {
    console.error('Error in translation endpoint:', err);
    res.status(500).json({ message: 'Failed to translate text' });
  }
});

module.exports = router;
