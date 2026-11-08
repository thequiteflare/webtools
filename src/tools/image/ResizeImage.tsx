import { ToolPlaceholder } from '../../components/shared/ToolPlaceholder';

export default function ResizeImage() {
  return (
    <ToolPlaceholder
      title="Image Resizer & Compressor"
      description="Quickly scale image dimensions and compress file sizes locally."
      phase="Phase 3"
      features={[
        'Maintain or unlock aspect ratio (width/height)',
        'Preset scales (25%, 50%, 75%, custom)',
        'Quality percentage slider with live file size estimate',
        'Batch processing with bulk ZIP download',
      ]}
    />
  );
}
