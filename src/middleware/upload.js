import cloudinary from '../config/cloudinary.js';

export const uploadToCloudinary = async (file, folder = 'cars') => {
  try {
    // Convert base64 to buffer if needed
    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

export const uploadMultipleToCloudinary = async (files, folder = 'cars') => {
  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
    const results = await Promise.all(uploadPromises);
    return results.map(result => result.url);
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw new Error('Failed to upload images');
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

export const extractPublicId = (url) => {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  const publicId = fileName.split('.')[0];
  return `cars/${publicId}`;
};