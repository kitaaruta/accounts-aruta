import { getFirebaseApp, isFirebaseConfigured } from '@/lib/firebase/client';

/**
 * Compresses and centers an image into a 1:1 square avatar using HTML5 Canvas.
 * Generates an optimized JPEG Blob and DataURL.
 */
export async function compressAndCropAvatar(
  file: File,
  size = 360,
  quality = 0.85
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Canvas is only available in browser'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak valid atau korup'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Gagal menginisialisasi canvas context'));
          }

          // Calculate center crop
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Fill white background in case of transparent PNG/WebP
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({ blob, dataUrl });
              } else {
                resolve({ blob: new Blob([dataUrl], { type: 'image/jpeg' }), dataUrl });
              }
            },
            'image/jpeg',
            quality
          );
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads user profile photo to Firebase Storage if available,
 * or gracefully falls back to an optimized base64 data URL.
 */
export async function uploadProfilePhoto(
  file: File,
  userId: string
): Promise<string> {
  const { blob, dataUrl } = await compressAndCropAvatar(file, 360, 0.85);

  // If Firebase is configured, attempt uploading to Firebase Storage
  if (typeof window !== 'undefined' && isFirebaseConfigured()) {
    try {
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const app = getFirebaseApp();
      const storage = getStorage(app);
      
      const fileExt = 'jpg';
      const storagePath = `profile_photos/${userId}_${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
        customMetadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
        },
      });

      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (err: unknown) {
      console.warn(
        '[Storage Service] Firebase Storage upload failed or not enabled yet. Falling back to optimized base64 data URL:',
        err
      );
      // Fallback: Return data URL so user experience is uninterrupted
      return dataUrl;
    }
  }

  // Fallback for local testing / offline dev
  return dataUrl;
}
