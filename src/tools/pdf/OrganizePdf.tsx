import { ToolPlaceholder } from '../../components/shared/ToolPlaceholder';

export default function OrganizePdf() {
  return (
    <ToolPlaceholder
      title="Organize & Delete PDF Pages"
      description="View page thumbnails, select & delete pages, and rotate orientation."
      phase="Phase 2 (Next Step)"
      features={[
        'Interactive thumbnail rendering using pdfjs-dist',
        'Multi-page selection and one-click removal',
        '90° / 180° page rotation controls',
        'Export updated PDF completely offline',
      ]}
    />
  );
}
