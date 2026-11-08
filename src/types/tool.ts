import type { ComponentType, LazyExoticComponent } from 'react';

export type ToolCategory = 'pdf' | 'image' | 'dev' | 'generator';

export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  description: string;
  iconName: string;
}

export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  category: ToolCategory;
  iconName: string;
  keywords: string[];
  badge?: 'new' | 'popular' | 'beta';
  component: LazyExoticComponent<ComponentType>;
}
