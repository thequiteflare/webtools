import { ToolPlaceholder } from '../../components/shared/ToolPlaceholder';

export default function JsonToTs() {
  return (
    <ToolPlaceholder
      title="JSON to TypeScript Interface Generator"
      description="Transform JSON objects into strictly-typed TypeScript declarations."
      phase="Phase 4"
      features={[
        'Nested object interface generation',
        'Optional/nullable field detection',
        'Array type inference',
        'Export as interface or type alias',
      ]}
    />
  );
}
