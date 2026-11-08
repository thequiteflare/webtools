import { describe, it, expect } from 'vitest';
import { PDFDocument, degrees } from 'pdf-lib';

describe('PDF Engine Core Operations', () => {
  it('should create an empty PDF and add pages', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([400, 600]);
    doc.addPage([400, 600]);
    expect(doc.getPageCount()).toBe(2);

    const bytes = await doc.save();
    expect(bytes.length).toBeGreaterThan(0);

    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBe(2);
  });

  it('should merge two PDF documents into one', async () => {
    const doc1 = await PDFDocument.create();
    doc1.addPage([500, 500]);
    doc1.addPage([500, 500]);
    const bytes1 = await doc1.save();

    const doc2 = await PDFDocument.create();
    doc2.addPage([500, 500]);
    doc2.addPage([500, 500]);
    doc2.addPage([500, 500]);
    const bytes2 = await doc2.save();

    // Perform merge
    const mergedDoc = await PDFDocument.create();
    const loaded1 = await PDFDocument.load(bytes1);
    const loaded2 = await PDFDocument.load(bytes2);

    const copied1 = await mergedDoc.copyPages(loaded1, loaded1.getPageIndices());
    copied1.forEach(p => mergedDoc.addPage(p));

    const copied2 = await mergedDoc.copyPages(loaded2, loaded2.getPageIndices());
    copied2.forEach(p => mergedDoc.addPage(p));

    expect(mergedDoc.getPageCount()).toBe(5);
  });

  it('should organize, delete, and rotate pages', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([400, 600]); // Page 1
    doc.addPage([400, 600]); // Page 2
    doc.addPage([400, 600]); // Page 3
    const bytes = await doc.save();

    // Reorganize: delete page 2 (index 1), rotate page 3 by 90deg, and place page 3 first
    const sourcePdf = await PDFDocument.load(bytes);
    const organizedPdf = await PDFDocument.create();

    const [page3] = await organizedPdf.copyPages(sourcePdf, [2]);
    page3.setRotation(degrees(90));
    organizedPdf.addPage(page3);

    const [page1] = await organizedPdf.copyPages(sourcePdf, [0]);
    organizedPdf.addPage(page1);

    expect(organizedPdf.getPageCount()).toBe(2);
    expect(organizedPdf.getPage(0).getRotation().angle).toBe(90);
    expect(organizedPdf.getPage(1).getRotation().angle).toBe(0);
  });

  it('should embed dummy PNG signature into a PDF page', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([600, 800]);

    // Smallest valid 1x1 transparent PNG byte array
    const pngBytes = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1,
      0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84,
      120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69,
      78, 68, 174, 66, 96, 130,
    ]);

    const embedded = await doc.embedPng(pngBytes);
    page.drawImage(embedded, {
      x: 50,
      y: 50,
      width: 100,
      height: 50,
    });

    const saved = await doc.save();
    expect(saved.length).toBeGreaterThan(0);
  });
});
