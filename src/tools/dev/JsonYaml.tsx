import { ToolPlaceholder } from '../../components/shared/ToolPlaceholder';

export default function JsonYaml() {
  return (
    <ToolPlaceholder
      title="JSON ⟷ YAML Converter"
      description="Bidirectional converter with instant syntax error validation."
      phase="Phase 4"
      features={[
        'Real-time two-way conversion',
        'Syntax highlighting via CodeMirror 6',
        'Configurable indentation (2 or 4 spaces)',
        'Copy-to-clipboard and file download',
      ]}
    />
  );
}
