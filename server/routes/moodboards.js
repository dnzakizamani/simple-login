const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Get all moodboard projects for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, created_at, updated_at FROM moodboard_projects WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json({ projects: result.rows });
  } catch (err) {
    console.error('Error fetching moodboard projects:', err);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// Get a specific moodboard project
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, created_at, updated_at FROM moodboard_projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ project: result.rows[0] });
  } catch (err) {
    console.error('Error fetching moodboard project:', err);
    res.status(500).json({ message: 'Failed to fetch project' });
  }
});

// Create a new moodboard project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const result = await pool.query(
      'INSERT INTO moodboard_projects (name, description, user_id) VALUES ($1, $2, $3) RETURNING id',
      [name, description || '', req.user.id]
    );

    res.status(201).json({
      message: 'Project created successfully',
      project: {
        id: result.rows[0].id,
        name,
        description,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  } catch (err) {
    console.error('Error creating moodboard project:', err);
    res.status(500).json({ message: 'Failed to create project' });
  }
});

// Update a moodboard project
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    // Check if project belongs to user
    const projectResult = await pool.query(
      'SELECT id FROM moodboard_projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await pool.query(
      'UPDATE moodboard_projects SET name = $1, description = $2 WHERE id = $3 AND user_id = $4',
      [name, description || '', req.params.id, req.user.id]
    );

    res.json({ message: 'Project updated successfully' });
  } catch (err) {
    console.error('Error updating moodboard project:', err);
    res.status(500).json({ message: 'Failed to update project' });
  }
});

// Delete a moodboard project
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if project belongs to user
    const projectResult = await pool.query(
      'SELECT id FROM moodboard_projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get all images in the project to delete files
    const imageResult = await pool.query(
      'SELECT file_path FROM moodboard_images WHERE project_id = $1',
      [req.params.id]
    );

    // Delete image files
    for (const image of imageResult.rows) {
      try {
        if (fs.existsSync(image.file_path)) {
          fs.unlinkSync(image.file_path);
        }
      } catch (fileErr) {
        console.error('Error deleting file:', fileErr);
      }
    }

    // Delete project (cascade will delete images from database)
    await pool.query('DELETE FROM moodboard_projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Error deleting moodboard project:', err);
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

// Get images for a specific project
router.get('/:id/images', auth, async (req, res) => {
  try {
    // Check if project belongs to user
    const projectResult = await pool.query(
      'SELECT id FROM moodboard_projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const result = await pool.query(
      'SELECT id, filename, original_filename, file_path, file_size, position_x, position_y, width, height, rotation, z_index, created_at FROM moodboard_images WHERE project_id = $1 ORDER BY z_index ASC, created_at ASC',
      [req.params.id]
    );

    res.json({ images: result.rows });
  } catch (err) {
    console.error('Error fetching moodboard images:', err);
    res.status(500).json({ message: 'Failed to fetch images' });
  }
});

// Upload images to a project
router.post('/:id/images', auth, upload.array('images', 20), async (req, res) => {
  try {
    // Check if project belongs to user
    const projectResult = await pool.query(
      'SELECT id FROM moodboard_projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      // Generate random position (within reasonable bounds)
      const position_x = Math.floor(Math.random() * 600) + 50; // 50-650px
      const position_y = Math.floor(Math.random() * 400) + 50; // 50-450px
      // Generate random rotation between -20 to -5 and 5 to 20 degrees
      const rotation = Math.random() < 0.5
        ? -(Math.random() * 15 + 5) // -20 to -5 degrees
        : Math.random() * 15 + 5;   // 5 to 20 degrees

      const result = await pool.query(
        'INSERT INTO moodboard_images (project_id, filename, original_filename, file_path, file_size, position_x, position_y, width, height, rotation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
        [req.params.id, file.filename, file.originalname, file.path, file.size, position_x, position_y, 200, 200, rotation]
      );

      uploadedImages.push({
        id: result.rows[0].id,
        filename: file.filename,
        original_filename: file.originalname,
        file_path: file.path,
        file_size: file.size,
        position_x,
        position_y,
        width: 200,
        height: 200,
        rotation,
        z_index: 0,
        created_at: new Date()
      });
    }

    // Update project updated_at
    await pool.query(
      'UPDATE moodboard_projects SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.params.id]
    );

    res.status(201).json({
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      images: uploadedImages
    });
  } catch (err) {
    console.error('Error uploading moodboard images:', err);
    res.status(500).json({ message: 'Failed to upload images' });
  }
});

// Update image position/size/rotation
router.put('/:id/images/:imageId', auth, async (req, res) => {
  try {
    const { position_x, position_y, width, height, rotation, z_index } = req.body;

    // Check if project belongs to user
    const projectResult = await pool.query(
      'SELECT id FROM moodboard_projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if image belongs to project
    const imageResult = await pool.query(
      'SELECT id FROM moodboard_images WHERE id = $1 AND project_id = $2',
      [req.params.imageId, req.params.id]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    await pool.query(
      'UPDATE moodboard_images SET position_x = $1, position_y = $2, width = $3, height = $4, rotation = $5, z_index = $6 WHERE id = $7 AND project_id = $8',
      [position_x, position_y, width, height, rotation, z_index, req.params.imageId, req.params.id]
    );

    // Update project updated_at
    await pool.query(
      'UPDATE moodboard_projects SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.params.id]
    );

    res.json({ message: 'Image updated successfully' });
  } catch (err) {
    console.error('Error updating moodboard image:', err);
    res.status(500).json({ message: 'Failed to update image' });
  }
});

// Delete an image from a project
router.delete('/:id/images/:imageId', auth, async (req, res) => {
  try {
    // Check if project belongs to user
    const projectResult = await pool.query(
      'SELECT id FROM moodboard_projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get image info to delete file
    const imageResult = await pool.query(
      'SELECT file_path FROM moodboard_images WHERE id = $1 AND project_id = $2',
      [req.params.imageId, req.params.id]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete file
    try {
      if (fs.existsSync(imageResult.rows[0].file_path)) {
        fs.unlinkSync(imageResult.rows[0].file_path);
      }
    } catch (fileErr) {
      console.error('Error deleting file:', fileErr);
    }

    // Delete from database
    await pool.query('DELETE FROM moodboard_images WHERE id = $1 AND project_id = $2', [req.params.imageId, req.params.id]);

    // Update project updated_at
    await pool.query(
      'UPDATE moodboard_projects SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.params.id]
    );

    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Error deleting moodboard image:', err);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

module.exports = router;
