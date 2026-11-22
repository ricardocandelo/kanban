/**
 * Utilidad de Renderizado y Compresión de Imágenes en Cliente
 * Redimensiona y comprime fotos pesadas (ej: 5-10MB a ~20KB) antes de subirlas a Cloudinary
 */
export interface CompressedImageResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
}

export const compressAndRenderImage = (
  file: File,
  maxDimension = 256,
  quality = 0.85
): Promise<CompressedImageResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calcular dimensiones para avatar cuadrado centrado
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        const targetSize = Math.min(maxDimension, size);

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto de canvas'));
          return;
        }

        // Renderizado suavizado de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Recorte y reescalado en canvas
        ctx.drawImage(
          img,
          startX,
          startY,
          size,
          size,
          0,
          0,
          targetSize,
          targetSize
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al generar blob comprimido'));
              return;
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
              type: 'image/webp',
            });

            const originalSize = file.size;
            const compressedSize = blob.size;
            const reduction = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

            resolve({
              file: compressedFile,
              previewUrl: URL.createObjectURL(blob),
              originalSize,
              compressedSize,
              reductionPercentage: reduction,
            });
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
};
