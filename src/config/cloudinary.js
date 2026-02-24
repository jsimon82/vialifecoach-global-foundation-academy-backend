import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadImage(filePath, folder = 'deepcoach_academy') {
  try {
    logger.info('Uploading image to Cloudinary', { filePath, folder });
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
    });
    logger.info('Image uploaded successfully', { publicId: result.public_id, url: result.secure_url });
    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    logger.error('Error uploading image to Cloudinary', { error: error.message });
    throw error;
  }
}

export async function uploadVideo(filePath, folder = 'deepcoach_academy/videos') {
  try {
    logger.info('Uploading video to Cloudinary', { filePath, folder });
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'video',
    });
    logger.info('Video uploaded successfully', { publicId: result.public_id, url: result.secure_url });
    return {
      publicId: result.public_id,
      url: result.secure_url,
      duration: result.duration,
      format: result.format,
    };
  } catch (error) {
    logger.error('Error uploading video to Cloudinary', { error: error.message });
    throw error;
  }
}

export async function deleteFile(publicId) {
  try {
    logger.info('Deleting file from Cloudinary', { publicId });
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info('File deleted successfully', { publicId, result });
    return result;
  } catch (error) {
    logger.error('Error deleting file from Cloudinary', { publicId, error: error.message });
    throw error;
  }
}
