const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const pool = require('../db');
const { verifyToken: auth } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
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
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all images for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, filename, original_filename, file_size, watermark_text, watermark_opacity, watermark_color, watermark_font_size, watermark_spacing, watermark_tilt, created_at FROM image_files WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ images: result.rows });
  } catch (err) {
    console.error('Error fetching images:', err);
    res.status(500).json({ message: 'Failed to fetch images' });
  }
});

// Upload a new image file
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const { title } = req.body;
    if (!title) {
      // Delete uploaded file if title is missing
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Title is required' });
    }

    const result = await pool.query(
      'INSERT INTO image_files (title, filename, original_filename, file_path, file_size, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [title, req.file.filename, req.file.originalname, req.file.path, req.file.size, req.user.id]
    );

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: {
        id: result.rows[0].id,
        title,
        filename: req.file.filename,
        original_filename: req.file.originalname,
        file_size: req.file.size,
        created_at: new Date()
      }
    });
  } catch (err) {
    console.error('Error uploading image:', err);
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

// Apply watermark to an image
router.post('/:id/watermark', auth, async (req, res) => {
  try {
    const { watermark_text, opacity, color, font_size, spacing, tilt } = req.body;

    if (!watermark_text || watermark_text.trim().length === 0) {
      return res.status(400).json({ message: 'Watermark text is required' });
    }

    // Get image details
    const result = await pool.query(
      'SELECT * FROM image_files WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const image = result.rows[0];
    if (!fs.existsSync(image.file_path)) {
      return res.status(404).json({ message: 'Image file not found on disk' });
    }

    // Parse parameters with defaults
    const watermarkOpacity = parseFloat(opacity) || 0.5;
    const watermarkColor = color || '#ffffff';
    const watermarkFontSize = parseInt(font_size) || 24;
    const watermarkSpacing = parseInt(spacing) || 100;
    const watermarkTilt = parseFloat(tilt) || 0.0;

    // Create watermarked image
    const watermarkedFilename = `watermarked_${Date.now()}_${image.filename}`;
    const watermarkedPath = path.join(uploadsDir, watermarkedFilename);

    // Get image dimensions
    const metadata = await sharp(image.file_path).metadata();
    const { width, height } = metadata;

    // Create SVG watermark
    const svgWatermark = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="watermark" patternUnits="userSpaceOnUse" width="${watermarkSpacing}" height="${watermarkSpacing}" patternTransform="rotate(${watermarkTilt})">
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${watermarkFontSize}" fill="${watermarkColor}" fill-opacity="${watermarkOpacity}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${watermarkTilt})">
              ${watermark_text}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#watermark)" />
      </svg>
    `;

    // Apply watermark
    await sharp(image.file_path)
      .composite([{
        input: Buffer.from(svgWatermark),
        top: 0,
        left: 0
      }])
      .jpeg({ quality: 90 })
      .toFile(watermarkedPath);

    // Update database
    await pool.query(
      'UPDATE image_files SET watermarked_path = $1, watermark_text = $2, watermark_opacity = $3, watermark_color = $4, watermark_font_size = $5, watermark_spacing = $6, watermark_tilt = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8',
      [watermarkedPath, watermark_text, watermarkOpacity, watermarkColor, watermarkFontSize, watermarkSpacing, watermarkTilt, req.params.id]
    );

    res.json({
      message: 'Watermark applied successfully',
      watermarked_filename: watermarkedFilename
    });
  } catch (err) {
    console.error('Error applying watermark:', err);
    res.status(500).json({ message: 'Failed to apply watermark' });
  }
});

// Get a specific image file
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM image_files WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const image = result.rows[0];
    res.json({ image });
  } catch (err) {
    console.error('Error fetching image:', err);
    res.status(500).json({ message: 'Failed to fetch image' });
  }
});

// Download original image file
router.get('/:id/download', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM image_files WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const image = result.rows[0];
    if (!fs.existsSync(image.file_path)) {
      return res.status(404).json({ message: 'Image file not found on disk' });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${image.original_filename}"`);
    res.sendFile(image.file_path);
  } catch (err) {
    console.error('Error downloading image:', err);
    res.status(500).json({ message: 'Failed to download image' });
  }
});

// Download watermarked image file
router.get('/:id/download/watermarked', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM image_files WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const image = result.rows[0];
    if (!image.watermarked_path || !fs.existsSync(image.watermarked_path)) {
      return res.status(404).json({ message: 'Watermarked image not found' });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="watermarked_${image.original_filename}"`);
    res.sendFile(image.watermarked_path);
  } catch (err) {
    console.error('Error downloading watermarked image:', err);
    res.status(500).json({ message: 'Failed to download watermarked image' });
  }
});

// Delete image file
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM image_files WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const image = result.rows[0];

    // Delete files from disk
    if (fs.existsSync(image.file_path)) {
      fs.unlinkSync(image.file_path);
    }
    if (image.watermarked_path && fs.existsSync(image.watermarked_path)) {
      fs.unlinkSync(image.watermarked_path);
    }

    // Delete from database
    await pool.query('DELETE FROM image_files WHERE id = $1', [req.params.id]);

    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Error deleting image:', err);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

module.exports = router;
