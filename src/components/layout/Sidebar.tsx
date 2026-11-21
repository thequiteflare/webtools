import { LayoutGrid } from 'lucide-react';
import { CATEGORIES, TOOLS } from '../../config/tools';
import { IconRenderer } from '../shared/IconRenderer';
import type { ToolCategory } from '../../types/tool';

interface SidebarProps {
  selectedCategory: ToolCategory | 'all';
  onSelectCategory: (cat: ToolCategory | 'all') => void;
  selectedToolId: string | null;
  onSelectTool: (id: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedToolId,
  onSelectTool,
  isOpen,
  onClose,
}) => {
  const getToolCount = (catId: ToolCategory) => {
    return TOOLS.filter(t => t.category === catId).length;
  };

  const handleCategoryClick = (cat: ToolCategory | 'all') => {
    onSelectCategory(cat);
    onSelectTool(null);
    onClose();
  };

  const handleToolClick = (toolId: string) => {
    onSelectTool(toolId);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-border/80 bg-card/95 md:bg-card/50 backdrop-blur-sm transition-transform duration-200 ease-in-out md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:z-30 md:transform-none md:shrink-0 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Categories
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => handleCategoryClick('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === 'all' && selectedToolId === null
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutGrid className="h-4 w-4" />
                  <span>All Utilities</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedCategory === 'all' && selectedToolId === null
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {TOOLS.length}
                </span>
              </button>

              {CATEGORIES.map(cat => {
                const count = getToolCount(cat.id);
                const isActive = selectedCategory === cat.id && selectedToolId === null;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconRenderer name={cat.iconName} className="h-4 w-4" />
                      <span>{cat.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Tool Links */}
          <div className="pt-4 border-t border-border/80">
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Quick Utilities
            </div>
            <div className="space-y-1">
              {TOOLS.map(tool => {
                const isSelected = selectedToolId === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <IconRenderer name={tool.iconName} className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{tool.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
