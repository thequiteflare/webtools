import { ToolPlaceholder } from '../../components/shared/ToolPlaceholder';

export default function QrGenerator() {
  return (
    <ToolPlaceholder
      title="Custom QR Code Generator"
      description="Create beautiful, customizable QR codes with custom styling and logos."
      phase="Phase 3"
      features={[
        'URL, Wi-Fi, vCard, and freeform text support',
        'Custom dot styles (dots, rounded, extra-rounded, classy)',
        'Gradient and solid foreground/background colors',
        'Logo center embedding & high-res SVG / PNG export',
      ]}
    />
  );
}
