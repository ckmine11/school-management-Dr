import sharp from 'sharp';
import fs from 'fs';

/**
 * Compress and resize an uploaded image in-place.
 * Converts all formats to JPEG for consistent quality and size.
 * Silently skips on failure so the original upload is preserved.
 */
export async function compressImage(filePath, options = {}) {
  const { maxWidth = 1200, maxHeight = 1200, quality = 85 } = options;
  const tempPath = filePath + '.tmp.jpg';

  try {
    await sharp(filePath)
      .rotate() // auto-rotate based on EXIF orientation
      .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toFile(tempPath);

    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error('[ImageProcessor]', err.message);
    try { fs.unlinkSync(tempPath); } catch {}
  }
}

/** Preset for profile photos — small square-ish, high quality */
export const compressPhoto = (filePath) =>
  compressImage(filePath, { maxWidth: 400, maxHeight: 400, quality: 82 });

/** Preset for gallery images — larger, slightly lower quality */
export const compressGallery = (filePath) =>
  compressImage(filePath, { maxWidth: 1280, maxHeight: 1280, quality: 80 });
