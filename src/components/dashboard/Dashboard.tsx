import { useState } from 'react';
import { Search, ShieldCheck, Zap, Lock, Sparkles, ArrowUpRight } from 'lucide-react';
import { TOOLS, CATEGORIES } from '../../config/tools';
import { IconRenderer } from '../shared/IconRenderer';
import type { ToolCategory, ToolDefinition } from '../../types/tool';

interface DashboardProps {
  selectedCategory: ToolCategory | 'all';
  onSelectCategory: (cat: ToolCategory | 'all') => void;
  onSelectTool: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedCategory,
  onSelectCategory,
  onSelectTool,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = TOOLS.filter(tool => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      tool.title.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.keywords.some(k => k.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card to-card/50 p-6 sm:p-10 shadow-sm">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fast, Free & Open Source</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Everyday web utilities, <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">100% in your browser</span>
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed">
            Manage PDFs, resize images, generate QR codes, and convert code formats. No accounts, no upload queues, and zero bytes leaving your device.
          </p>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-background/60 border border-border/50 text-foreground/80">
              <Lock className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Zero server uploads</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-background/60 border border-border/50 text-foreground/80">
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Instant client execution</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-background/60 border border-border/50 text-foreground/80">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span>Works offline (PWA)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => onSelectCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              All Tools ({TOOLS.length})
            </button>
            {CATEGORIES.map(cat => {
              const count = TOOLS.filter(t => t.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                      : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter utilities..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border/80 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Tool Cards Grid */}
      {filteredTools.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border/80 bg-card/40">
          <p className="text-sm text-muted-foreground">No utilities found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool: ToolDefinition) => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="group relative flex flex-col justify-between p-5 rounded-2xl border border-border/80 bg-card hover:bg-card/90 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 text-left"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                    <IconRenderer name={tool.iconName} className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tool.badge && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        tool.badge === 'popular'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {tool.badge}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      {tool.category}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                  {tool.title}
                  <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all text-primary" />
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap gap-1.5">
                {tool.keywords.slice(0, 3).map((kw, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono">
                    #{kw}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
