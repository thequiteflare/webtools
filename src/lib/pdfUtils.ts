import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for pdfjs in Vite
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

export { pdfjsLib };

/**
 * Trigger browser download of a Blob or Uint8Array
 */
export function downloadFile(data: Uint8Array | Blob, filename: string, mimeType = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Format bytes into human-readable string (KB, MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Render a single PDF page to a canvas and return data URL
 */
export async function renderPageThumbnail(
  doc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale = 0.4
): Promise<string> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get 2D canvas context');

  // Clear background with white
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvas: canvas,
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.85);
}
