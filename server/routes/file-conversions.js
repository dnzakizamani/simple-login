const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const mammoth = require('mammoth');
const { exec } = require('child_process');
const pool = require('../db');
const { verifyToken: auth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/conversions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/tiff',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Get supported conversions
router.get('/supported', auth, (req, res) => {
  const conversions = {
    image: {
      'jpg': ['png', 'webp', 'tiff', 'bmp'],
      'jpeg': ['png', 'webp', 'tiff', 'bmp'],
      'png': ['jpg', 'webp', 'tiff', 'bmp'],
      'gif': ['png', 'jpg', 'webp'],
      'bmp': ['png', 'jpg', 'webp', 'tiff'],
      'webp': ['png', 'jpg', 'tiff'],
      'tiff': ['png', 'jpg', 'webp']
    },
    document: {
      'pdf': ['docx', 'txt'],
      'docx': ['pdf', 'txt'],
      'doc': ['pdf', 'docx', 'txt'],
      'xls': ['xlsx', 'csv'],
      'xlsx': ['xls', 'csv'],
      'txt': ['pdf'],
      'csv': ['xlsx', 'xls']
    }
  };

  res.json({ conversions });
});

// Upload and convert file
router.post('/convert', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { targetFormat } = req.body;
    const userId = req.user.id;
    const originalFilename = req.file.originalname;
    const filePath = req.file.path;
    const fileSize = req.file.size;

    // Get file extension
    const originalExt = path.extname(originalFilename).toLowerCase().slice(1);
    const targetExt = targetFormat.toLowerCase();

    // Validate conversion
    const supportedConversions = {
      image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'],
      document: ['pdf', 'docx', 'doc', 'xls', 'xlsx', 'txt', 'csv']
    };

    const isImageConversion = supportedConversions.image.includes(originalExt) &&
                             supportedConversions.image.includes(targetExt);
    const isDocumentConversion = supportedConversions.document.includes(originalExt) &&
                                supportedConversions.document.includes(targetExt);

    if (!isImageConversion && !isDocumentConversion) {
      fs.unlinkSync(filePath); // Clean up uploaded file
      return res.status(400).json({ error: 'Unsupported conversion' });
    }

    // Create conversion record
    const result = await pool.query(
      `INSERT INTO file_conversions
       (original_filename, original_file_path, original_format, target_format, file_size, user_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id`,
      [originalFilename, filePath, originalExt, targetExt, fileSize, userId]
    );

    const conversionId = result.rows[0].id;

    // Start conversion process asynchronously
    convertFile(conversionId, filePath, originalExt, targetExt, originalFilename);

    res.json({
      message: 'File uploaded successfully. Conversion in progress.',
      conversionId,
      status: 'processing'
    });

  } catch (error) {
    console.error('Upload error:', error);
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get conversion status
router.get('/status/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM file_conversions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversion not found' });
    }

    const conversion = result.rows[0];
    res.json({
      id: conversion.id,
      status: conversion.status,
      original_filename: conversion.original_filename,
      converted_filename: conversion.converted_filename,
      original_format: conversion.original_format,
      target_format: conversion.target_format,
      error_message: conversion.error_message,
      created_at: conversion.created_at,
      download_url: conversion.status === 'completed' ? `/api/file-conversions/download/${conversion.id}` : null
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to get conversion status' });
  }
});

// Download converted file
router.get('/download/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM file_conversions WHERE id = $1 AND user_id = $2 AND status = $3',
      [req.params.id, req.user.id, 'completed']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found or not ready' });
    }

    const conversion = result.rows[0];
    const filePath = conversion.converted_file_path;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(filePath, conversion.converted_filename);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Get user's conversion history
router.get('/history', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, original_filename, converted_filename, original_format, target_format, status, error_message, created_at FROM file_conversions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );

    res.json({ conversions: result.rows });

  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to get conversion history' });
  }
});

// Delete conversion record and files
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM file_conversions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversion not found' });
    }

    const conversion = result.rows[0];

    // Delete files if they exist
    if (conversion.original_file_path && fs.existsSync(conversion.original_file_path)) {
      fs.unlinkSync(conversion.original_file_path);
    }
    if (conversion.converted_file_path && fs.existsSync(conversion.converted_file_path)) {
      fs.unlinkSync(conversion.converted_file_path);
    }

    // Delete record
    await pool.query('DELETE FROM file_conversions WHERE id = $1', [req.params.id]);

    res.json({ message: 'Conversion deleted successfully' });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete conversion' });
  }
});

// Conversion function
async function convertFile(conversionId, inputPath, fromFormat, toFormat, originalFilename) {
  try {
    // Update status to processing
    await pool.query('UPDATE file_conversions SET status = $1 WHERE id = $2', ['processing', conversionId]);

    const outputDir = path.join(__dirname, '../uploads/conversions');
    const baseName = path.basename(originalFilename, path.extname(originalFilename));
    const outputFilename = `${baseName}_converted.${toFormat}`;
    const outputPath = path.join(outputDir, `conv_${conversionId}_${Date.now()}.${toFormat}`);

    // Perform conversion based on type
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'].includes(fromFormat)) {
      // Image conversion using Sharp
      await sharp(inputPath)
        .toFormat(toFormat)
        .toFile(outputPath);
    } else {
      // Document conversion using pandoc or mammoth
      if (fromFormat === 'docx' && toFormat === 'txt') {
        // Use mammoth for docx to text
        const result = await mammoth.extractRawText({ path: inputPath });
        fs.writeFileSync(outputPath, result.value);
      } else {
        // Use pandoc for other document conversions
        await new Promise((resolve, reject) => {
          exec(`pandoc "${inputPath}" -o "${outputPath}"`, (error, stdout, stderr) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }
    }

    // Update database with success
    await pool.query(
      'UPDATE file_conversions SET status = $1, converted_filename = $2, converted_file_path = $3 WHERE id = $4',
      ['completed', outputFilename, outputPath, conversionId]
    );

  } catch (error) {
    console.error('Conversion error:', error);

    // Update database with failure
    await pool.query(
      'UPDATE file_conversions SET status = $1, error_message = $2 WHERE id = $3',
      ['failed', error.message, conversionId]
    );
  }
}

module.exports = router;
