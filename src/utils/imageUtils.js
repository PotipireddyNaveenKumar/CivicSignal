/**
 * CivicSignal Image Processing & Validation Utilities
 *
 * Provides client-side validation, dimension normalization, and compression
 * using native HTML5 Canvas without external dependencies.
 */

export const MAX_PHOTO_BYTES = 1 * 1024 * 1024; // 1 MB
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates file size and MIME type.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePhotoFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  const fileType = (file.type || '').toLowerCase();
  if (!ALLOWED_PHOTO_TYPES.includes(fileType)) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a JPEG, PNG, or WebP image.',
    };
  }

  if (file.size > MAX_PHOTO_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Photo exceeds the 1 MB limit (selected file is ${sizeInMb} MB). Please choose a smaller image.`,
    };
  }

  return { valid: true };
}

/**
 * Compresses and resizes an image file to reduce storage footprint.
 * @param {File} file
 * @param {Object} [options]
 * @param {number} [options.maxWidth=1000]
 * @param {number} [options.maxHeight=1000]
 * @param {number} [options.quality=0.8]
 * @returns {Promise<string>} Base64 Data URL
 */
export function processAndCompressPhoto(
  file,
  { maxWidth = 1000, maxHeight = 1000, quality = 0.8 } = {}
) {
  return new Promise((resolve, reject) => {
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read the selected photo file.'));
    };

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Unable to decode image file. File may be corrupted.'));
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Compute proportional downscale if exceeding bounds
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to raw data url if canvas context unavailable
            resolve(e.target.result);
            return;
          }

          // Draw scaled image
          ctx.drawImage(img, 0, 0, width, height);

          // Use JPEG for photographic compression, or WebP if supported/source
          const outputType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(outputType, quality);

          resolve(compressedDataUrl);
        } catch (err) {
          console.warn('Canvas compression encountered an issue, falling back to original data URL:', err);
          resolve(e.target.result);
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}
