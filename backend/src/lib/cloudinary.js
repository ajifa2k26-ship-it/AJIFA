import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config.js';

const { cloudName, apiKey, apiSecret, folder } = config.cloudinary;
export const cloudinaryEnabled = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryEnabled) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

export function uploadBuffer(buffer, subfolder = 'produits') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${folder}/${subfolder}`,
        resource_type: 'image',
        // Redimensionne les photos trop grandes et optimise le poids automatiquement
        transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
        format: 'webp',
      },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

export async function destroyImage(publicId) {
  if (!cloudinaryEnabled || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.warn('Suppression Cloudinary échouée :', publicId, e.message);
  }
}
