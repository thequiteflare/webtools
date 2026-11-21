import { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  FileCode,
  Copy,
  Check,
  Download,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import { jsonToTypeScript, downloadTextFile } from '../../lib/devUtils';

const SAMPLE_JSON = {
  id: 'usr_98231',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  isActive: true,
  roles: ['admin', 'developer'],
  profile: {
    avatar: 'https://example.com/avatar.png',
    age: 29,
    bio: 'Software engineer passionate about privacy and web tools.',
    location: {
      city: 'San Francisco',
      country: 'USA',
      coordinates: [37.7749, -122.4194],
    },
  },
  stats: {
    totalProjects: 14,
    contributions: 482,
    rating: 4.95,
  },
};

export default function JsonToTs() {
  const [jsonInput, setJsonInput] = useState<string>(
    JSON.stringify(SAMPLE_JSON, null, 2)
  );
  const [rootName, setRootName] = useState<string>('UserProfile');
  const [declarationStyle, setDeclarationStyle] = useState<'interface' | 'type'>('interface');
  const [generatedTs, setGeneratedTs] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!jsonInput.trim()) {
      setGeneratedTs('// Enter or paste JSON on the left to generate TypeScript types');
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const tsCode = jsonToTypeScript(
        parsed,
        rootName.trim() || 'RootObject',
        declarationStyle
      );
      setGeneratedTs(tsCode);
      setError(null);
    } catch (err: any) {
      setError(`Invalid JSON: ${err?.message || 'Syntax error'}`);
    }
  }, [jsonInput, rootName, declarationStyle]);

  const copyTsCode = async () => {
    if (!generatedTs) return;
    await navigator.clipboard.writeText(generatedTs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSample = () => {
    setJsonInput(JSON.stringify(SAMPLE_JSON, null, 2));
    setRootName('UserProfile');
    setError(null);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err: any) {
      setError(`Cannot format: ${err?.message}`);
    }
  };

  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Action Header & Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-card">
        <div className="flex items-center gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Root Type Name
            </label>
            <input
              type="text"
              value={rootName}
              onChange={e => setRootName(e.target.value.replace(/[^a-zA-Z0-9_$]/g, ''))}
              placeholder="RootObject"
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-mono font-bold w-40 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Style
            </label>
            <div className="flex items-center gap-1 border border-border rounded-xl p-1 bg-background text-xs">
              {(['interface', 'type'] as const).map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setDeclarationStyle(style)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    declarationStyle === style
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={formatJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            <Wand2 className="h-3.5 w-3.5 text-primary" />
            <span>Prettify JSON</span>
          </button>

          <button
            type="button"
            onClick={loadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Sample</span>
          </button>

          <button
            type="button"
            onClick={() => setJsonInput('')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-destructive/10 hover:text-destructive text-xs font-semibold text-muted-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Split Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* JSON Input */}
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/40">
            <span className="font-bold text-xs uppercase tracking-wider text-foreground">
              JSON Input
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              Paste object or array
            </span>
          </div>

          <div className="flex-1 min-h-[440px] text-xs font-mono">
            <CodeMirror
              value={jsonInput}
              height="440px"
              extensions={[json()]}
              theme={isDarkMode ? oneDark : 'light'}
              onChange={val => setJsonInput(val)}
              className="text-xs"
            />
          </div>
        </div>

        {/* TypeScript Output */}
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/40">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-primary" />
              <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                TypeScript Declarations
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={copyTsCode}
                disabled={!generatedTs}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground disabled:opacity-40 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy TS</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    generatedTs,
                    `${rootName.toLowerCase() || 'types'}.d.ts`,
                    'application/typescript'
                  )
                }
                disabled={!generatedTs}
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                title="Download .d.ts"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[440px] text-xs font-mono">
            <CodeMirror
              value={generatedTs}
              height="440px"
              extensions={[javascript({ typescript: true })]}
              theme={isDarkMode ? oneDark : 'light'}
              editable={false}
              className="text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
