import { ToolPlaceholder } from '../../components/shared/ToolPlaceholder';

export default function MergePdf() {
  return (
    <ToolPlaceholder
      title="Merge PDF"
      description="Combine multiple PDF files into one clean document."
      phase="Phase 2 (Next Step)"
      features={[
        'Drag-and-drop multiple PDF files',
        'Visual reordering before merging',
        'Extract bookmarks and page numbers',
        'Direct browser binary download via pdf-lib',
      ]}
    />
  );
}
