import express from 'express';
import Car from '../models/Car.js';
import { authMiddleware } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// ============================================
// HELPER: Extract Public ID from Cloudinary URL
// ============================================
const extractPublicId = (url) => {
  try {
    if (!url) return null;
    
    // Remove query parameters
    const cleanUrl = url.split('?')[0];
    
    // Cloudinary URL format examples:
    // https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg
    // https://res.cloudinary.com/demo/image/upload/folder/image.jpg
    // https://res.cloudinary.com/demo/image/upload/v1234567890/image.jpg
    
    const parts = cleanUrl.split('/');
    
    // Find 'upload' in the URL
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) {
      // Try 'image/upload' pattern
      const imageIndex = parts.indexOf('image');
      if (imageIndex === -1) return null;
      const uploadIdx = parts.indexOf('upload', imageIndex);
      if (uploadIdx === -1) return null;
    }
    
    // Find version (starts with 'v') or use upload index
    const versionIndex = parts.findIndex(p => p.startsWith('v') && p.length > 1 && /^\d+$/.test(p.substring(1)));
    const startIndex = versionIndex !== -1 ? versionIndex + 1 : parts.indexOf('upload') + 1;
    
    // Build public_id (folder/filename without extension)
    const publicIdParts = parts.slice(startIndex);
    let publicId = publicIdParts.join('/');
    
    // Remove file extension
    publicId = publicId.replace(/\.[^/.]+$/, '');
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
};

// ============================================
// HELPER: Delete Image from Cloudinary
// ============================================
const deleteCloudinaryImage = async (imageUrl) => {
  try {
    const publicId = extractPublicId(imageUrl);
    if (!publicId) {
      console.warn('⚠️ Could not extract public_id from URL:', imageUrl);
      return { success: false, error: 'Invalid URL' };
    }
    
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`✅ Deleted from Cloudinary: ${publicId}`);
    return { success: true, publicId, result };
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// HELPER: Delete Multiple Images from Cloudinary
// ============================================
const deleteMultipleCloudinaryImages = async (imageUrls) => {
  if (!imageUrls || imageUrls.length === 0) return [];
  
  console.log(`🗑️ Deleting ${imageUrls.length} images from Cloudinary...`);
  
  const results = [];
  for (const url of imageUrls) {
    try {
      const result = await deleteCloudinaryImage(url);
      results.push({ url, ...result });
    } catch (error) {
      results.push({ url, success: false, error: error.message });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ ${successCount}/${imageUrls.length} images deleted from Cloudinary`);
  
  return results;
};

// ============================================
// GET ALL CARS (Public)
// ============================================
router.get('/', async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: cars.length,
      data: cars
    });
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cars'
    });
  }
});

// ============================================
// GET SINGLE CAR (Public)
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findOne({ id: req.params.id });
    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }
    res.json({
      success: true,
      data: car
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch car'
    });
  }
});

// ============================================
// ADD NEW CAR (Protected)
// ============================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { images, ...carData } = req.body;

    // Validate required fields
    const requiredFields = ['title', 'brand', 'year', 'price', 'km', 'fuel', 'trans', 'owner'];
    for (const field of requiredFields) {
      if (!carData[field]) {
        return res.status(400).json({
          success: false,
          error: `${field} is required`
        });
      }
    }

    // images already have Cloudinary URLs from frontend
    const imageUrls = images || [];

    const newCar = new Car({
      id: 'car-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      ...carData,
      images: imageUrls,
      createdAt: Date.now()
    });

    await newCar.save();

    res.status(201).json({
      success: true,
      data: newCar
    });
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add car: ' + error.message
    });
  }
});

// ============================================
// UPDATE CAR (Protected)
// ============================================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { images, ...updateData } = req.body;
    const car = await Car.findOne({ id: req.params.id });

    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    // Handle image updates
    let imageUrls = car.images;
    if (images && images.length > 0) {
      // Delete old images from Cloudinary
      if (car.images && car.images.length > 0) {
        console.log('🗑️ Deleting old images from Cloudinary...');
        await deleteMultipleCloudinaryImages(car.images);
      }
      imageUrls = images;
    }

    const updatedCar = await Car.findOneAndUpdate(
      { id: req.params.id },
      { ...updateData, images: imageUrls },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedCar
    });
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update car'
    });
  }
});

// ============================================
// DELETE CAR (Protected) - WITH CLOUDINARY DELETE
// ============================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const car = await Car.findOne({ id: req.params.id });
    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    // ============================================
    // DELETE IMAGES FROM CLOUDINARY
    // ============================================
    if (car.images && car.images.length > 0) {
      console.log(`🗑️ Deleting ${car.images.length} images from Cloudinary...`);
      await deleteMultipleCloudinaryImages(car.images);
    }

    // ============================================
    // DELETE CAR FROM DATABASE
    // ============================================
    await Car.findOneAndDelete({ id: req.params.id });

    res.json({
      success: true,
      message: 'Car and associated images deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete car'
    });
  }
});

// ============================================
// DELETE SINGLE IMAGE FROM CAR (Protected)
// ============================================
router.delete('/:id/image/:imageIndex', authMiddleware, async (req, res) => {
  try {
    const car = await Car.findOne({ id: req.params.id });
    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    const imageIndex = parseInt(req.params.imageIndex);
    if (imageIndex < 0 || imageIndex >= car.images.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image index'
      });
    }

    // Get the image URL to delete
    const imageUrl = car.images[imageIndex];
    
    // Delete from Cloudinary
    console.log(`🗑️ Deleting image ${imageIndex + 1} from Cloudinary...`);
    await deleteCloudinaryImage(imageUrl);

    // Remove image from array
    car.images.splice(imageIndex, 1);
    await car.save();

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: car
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    });
  }
});

// ============================================
// DELETE ALL CARS (Protected - Admin Only)
// ============================================
router.delete('/all', authMiddleware, async (req, res) => {
  try {
    // Get all cars
    const cars = await Car.find();
    
    // Delete all images from Cloudinary
    for (const car of cars) {
      if (car.images && car.images.length > 0) {
        console.log(`🗑️ Deleting images for car: ${car.title}`);
        await deleteMultipleCloudinaryImages(car.images);
      }
    }

    // Delete all cars from database
    await Car.deleteMany({});

    res.json({
      success: true,
      message: 'All cars and associated images deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting all cars:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete all cars'
    });
  }
});

export default router;