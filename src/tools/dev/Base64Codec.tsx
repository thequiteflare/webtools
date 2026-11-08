import { ToolPlaceholder } from '../../components/shared/ToolPlaceholder';

export default function Base64Codec() {
  return (
    <ToolPlaceholder
      title="Base64 & URL Encoder / Decoder"
      description="Encode and decode text, binary files, and URL components."
      phase="Phase 4"
      features={[
        'UTF-8 safe text Base64 encode & decode',
        'URL encode / decode (decodeURIComponent)',
        'File to Base64 Data URL generator',
        'Direct download of decoded binary blobs',
      ]}
    />
  );
}
