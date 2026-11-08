import { ToolPlaceholder } from '../../components/shared/ToolPlaceholder';

export default function ConvertImage() {
  return (
    <ToolPlaceholder
      title="Image Format Converter"
      description="Convert images between PNG, JPEG, WebP, and AVIF."
      phase="Phase 3"
      features={[
        'Fast in-browser format conversion via Canvas/OffscreenCanvas',
        'Batch multi-image processing',
        'Transparent background handling for PNG -> WebP',
        'Download individual files or all as a ZIP',
      ]}
    />
  );
}
