import type { ComponentType } from 'react';
import {
  FileText,
  Image,
  Code2,
  QrCode,
  Layers,
  Trash2,
  FileImage,
  PenTool,
  Maximize2,
  RefreshCw,
  Binary,
  FileCode,
  Hash,
  HelpCircle,
  type LucideProps,
} from 'lucide-react';

const ICONS: Record<string, ComponentType<LucideProps>> = {
  FileText,
  Image,
  Code2,
  QrCode,
  Layers,
  Trash2,
  FileImage,
  PenTool,
  Maximize2,
  RefreshCw,
  Binary,
  FileCode,
  Hash,
};

interface IconRendererProps extends LucideProps {
  name: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, ...props }) => {
  const IconComponent = ICONS[name] || HelpCircle;
  return <IconComponent {...props} />;
};
