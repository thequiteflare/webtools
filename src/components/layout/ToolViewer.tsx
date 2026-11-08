import { Suspense } from 'react';
import { ArrowLeft, ChevronRight, ShieldCheck, Loader2 } from 'lucide-react';
import { IconRenderer } from '../shared/IconRenderer';
import { CATEGORIES } from '../../config/tools';
import type { ToolDefinition } from '../../types/tool';

interface ToolViewerProps {
  tool: ToolDefinition;
  onBack: () => void;
  onSelectCategory: (cat: any) => void;
}

export const ToolViewer: React.FC<ToolViewerProps> = ({
  tool,
  onBack,
  onSelectCategory,
}) => {
  const categoryInfo = CATEGORIES.find(c => c.id === tool.category);
  const ToolComponent = tool.component;

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            onClick={onBack}
            className="hover:text-foreground transition-colors font-medium"
          >
            All Utilities
          </button>
          <ChevronRight className="h-3.5 w-3.5" />
          <button
            onClick={() => {
              onSelectCategory(tool.category);
              onBack();
            }}
            className="hover:text-foreground transition-colors font-medium capitalize"
          >
            {categoryInfo?.name || tool.category}
          </button>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-semibold">{tool.title}</span>
        </div>

        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Utilities</span>
        </button>
      </div>

      {/* Tool Header Banner */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-primary/10 text-primary">
            <IconRenderer name={tool.iconName} className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{tool.title}</h1>
              {tool.badge && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {tool.badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 self-start sm:self-auto">
          <ShieldCheck className="h-4 w-4" />
          <span>Local execution only</span>
        </div>
      </div>

      {/* Tool Execution Body */}
      <div className="min-h-[400px]">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading utility module...</p>
            </div>
          }
        >
          <ToolComponent />
        </Suspense>
      </div>
    </div>
  );
};
