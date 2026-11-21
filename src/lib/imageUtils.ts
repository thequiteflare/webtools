import JSZip from 'jszip';
import { downloadFile } from './pdfUtils';

export interface ImageProcessOptions {
  width: number;
  height: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number; // 0.1 to 1.0
  backgroundColor?: string; // Hex color for non-transparent backgrounds (e.g. #ffffff)
}

/**
 * Load a File into an HTMLImageElement
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

/**
 * Resize and compress an image using HTML5 Canvas
 */
export function processImage(
  img: HTMLImageElement,
  options: ImageProcessOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(options.width));
    canvas.height = Math.max(1, Math.round(options.height));

    const ctx = canvas.getContext('2d', { alpha: options.format !== 'image/jpeg' });
    if (!ctx) {
      reject(new Error('Canvas 2D context is not available'));
      return;
    }

    // High quality downscaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // If converting to JPEG or specified background, fill canvas first
    if (options.format === 'image/jpeg' || options.backgroundColor) {
      ctx.fillStyle = options.backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate image blob'));
        }
      },
      options.format,
      options.quality
    );
  });
}

/**
 * Create and download a ZIP file containing multiple processed items
 */
export async function downloadZip(
  files: { name: string; blob: Blob }[],
  zipFilename = 'webtools-images.zip'
) {
  const zip = new JSZip();
  files.forEach(f => {
    zip.file(f.name, f.blob);
  });
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadFile(zipBlob, zipFilename, 'application/zip');
}
