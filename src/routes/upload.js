import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { uploadToCloudinary, uploadMultipleToCloudinary, deleteFromCloudinary } from '../middleware/upload.js';

const router = express.Router();

// Upload single image (protected)
router.post('/single', authMiddleware, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image is required'
      });
    }

    const result = await uploadToCloudinary(image);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

// Upload multiple images (protected)
router.post('/multiple', authMiddleware, async (req, res) => {
  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Images array is required'
      });
    }

    const results = await uploadMultipleToCloudinary(images);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload images'
    });
  }
});

// Delete image (protected)
router.delete('/:publicId', authMiddleware, async (req, res) => {
  try {
    const { publicId } = req.params;
    await deleteFromCloudinary(publicId);
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    });
  }
});

export default router;