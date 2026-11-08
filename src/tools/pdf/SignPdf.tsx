import { ToolPlaceholder } from '../../components/shared/ToolPlaceholder';

export default function SignPdf() {
  return (
    <ToolPlaceholder
      title="Visual PDF Signer"
      description="Draw a signature, upload a stamp, or type text directly onto PDF pages."
      phase="Phase 2 (Next Step)"
      features={[
        'Interactive signature drawing pad with smoothing',
        'Custom signature image upload (transparent PNG)',
        'Drag, resize, and place signature onto PDF preview canvas',
        'Burn signature directly into PDF bytes using pdf-lib',
      ]}
    />
  );
}
