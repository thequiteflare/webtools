import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';

describe('Image & ZIP Utilities', () => {
  it('should create and populate a JSZip archive of blobs', async () => {
    const zip = new JSZip();
    const mockBlob1 = new Blob(['sample-image-data-1'], { type: 'image/png' });
    const mockBlob2 = new Blob(['sample-image-data-2'], { type: 'image/jpeg' });

    zip.file('photo-1.png', mockBlob1);
    zip.file('photo-2.jpg', mockBlob2);

    const generatedZipBlob = await zip.generateAsync({ type: 'blob' });
    expect(generatedZipBlob).toBeDefined();
    expect(generatedZipBlob.size).toBeGreaterThan(0);

    // Read back archive
    const unzipped = await JSZip.loadAsync(generatedZipBlob);
    expect(Object.keys(unzipped.files)).toContain('photo-1.png');
    expect(Object.keys(unzipped.files)).toContain('photo-2.jpg');
  });

  it('should correctly calculate scaled dimensions with locked aspect ratio', () => {
    const origWidth = 1920;
    const origHeight = 1080;
    const ratio = origWidth / origHeight;

    // Scaling by 50%
    const scale50Width = Math.round(origWidth * 0.5);
    const scale50Height = Math.round(origHeight * 0.5);
    expect(scale50Width).toBe(960);
    expect(scale50Height).toBe(540);

    // Given custom width = 800, calculate proportional height
    const customWidth = 800;
    const customHeight = Math.round(customWidth / ratio);
    expect(customHeight).toBe(450);
  });

  it('should correctly calculate target byte sizes for KB and MB', () => {
    const calculateTargetBytes = (val: number, unit: 'KB' | 'MB') =>
      unit === 'MB' ? Math.round(val * 1024 * 1024) : Math.round(val * 1024);

    expect(calculateTargetBytes(500, 'KB')).toBe(512000);
    expect(calculateTargetBytes(1, 'MB')).toBe(1048576);
    expect(calculateTargetBytes(2.5, 'MB')).toBe(2621440);
    expect(calculateTargetBytes(100, 'KB')).toBe(102400);
  });
});
