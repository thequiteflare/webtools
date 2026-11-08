import { ToolPlaceholder } from '../../components/shared/ToolPlaceholder';

export default function ImageToPdf() {
  return (
    <ToolPlaceholder
      title="Image to PDF"
      description="Convert JPG, PNG, and WebP images into formatted PDF documents."
      phase="Phase 2 (Next Step)"
      features={[
        'Batch image upload and reordering',
        'Custom page sizes: A4, Letter, or Fit to Image',
        'Configurable margins and orientation (Portrait/Landscape)',
        'Zero compression loss or server transmission',
      ]}
    />
  );
}
