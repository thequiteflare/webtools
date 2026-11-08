import { Sparkles, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

interface ToolPlaceholderProps {
  title: string;
  description: string;
  phase: string;
  features: string[];
}

export const ToolPlaceholder: React.FC<ToolPlaceholderProps> = ({
  title,
  description,
  phase,
  features,
}) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cpu className="h-4 w-4 text-primary" />
            <span>Implementation Target:</span>
            <span className="font-semibold text-foreground px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs">
              {phase}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="h-4 w-4" />
            <span>100% In-Browser Privacy</span>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Planned Capabilities</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-background/50">
                <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground/90">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
