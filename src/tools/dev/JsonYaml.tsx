import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { yaml as yamlLang } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import YAML from 'yaml';
import {
  ArrowLeftRight,
  Copy,
  Check,
  Download,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { downloadTextFile } from '../../lib/devUtils';

const SAMPLE_DATA = {
  name: 'webtools',
  version: '1.0.0',
  description: '100% Client-side privacy-first web utilities',
  private: true,
  features: [
    'PDF Signing & Merging',
    'Image Resizing & Compression',
    'QR Code Generator',
    'JSON ⟷ YAML Converter',
  ],
  author: {
    name: 'Sanish',
    github: 'https://github.com/thequiteflare/webtools',
  },
  settings: {
    offlineFirst: true,
    zeroTelemetry: true,
    maxFileSizeMB: 100,
  },
};

export default function JsonYaml() {
  const [jsonContent, setJsonContent] = useState<string>(
    JSON.stringify(SAMPLE_DATA, null, 2)
  );
  const [yamlContent, setYamlContent] = useState<string>(
    YAML.stringify(SAMPLE_DATA, { indent: 2 })
  );

  const [indentSize, setIndentSize] = useState<2 | 4>(2);
  const [error, setError] = useState<string | null>(null);
  const [copiedPane, setCopiedPane] = useState<'json' | 'yaml' | null>(null);

  const handleJsonChange = (val: string) => {
    setJsonContent(val);
    if (!val.trim()) {
      setYamlContent('');
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(val);
      const convertedYaml = YAML.stringify(parsed, { indent: indentSize });
      setYamlContent(convertedYaml);
      setError(null);
    } catch (err: any) {
      setError(`JSON Parse Error: ${err?.message || 'Invalid syntax'}`);
    }
  };

  const handleYamlChange = (val: string) => {
    setYamlContent(val);
    if (!val.trim()) {
      setJsonContent('');
      setError(null);
      return;
    }

    try {
      const parsed = YAML.parse(val);
      const convertedJson = JSON.stringify(parsed, null, indentSize);
      setJsonContent(convertedJson);
      setError(null);
    } catch (err: any) {
      setError(`YAML Parse Error: ${err?.message || 'Invalid syntax'}`);
    }
  };

  const handleIndentChange = (size: 2 | 4) => {
    setIndentSize(size);
    try {
      if (jsonContent.trim()) {
        const parsed = JSON.parse(jsonContent);
        setJsonContent(JSON.stringify(parsed, null, size));
        setYamlContent(YAML.stringify(parsed, { indent: size }));
      }
    } catch {
      // Keep existing text if currently invalid syntax
    }
  };

  const loadSample = () => {
    const j = JSON.stringify(SAMPLE_DATA, null, indentSize);
    const y = YAML.stringify(SAMPLE_DATA, { indent: indentSize });
    setJsonContent(j);
    setYamlContent(y);
    setError(null);
  };

  const clearAll = () => {
    setJsonContent('');
    setYamlContent('');
    setError(null);
  };

  const copyToClipboard = async (pane: 'json' | 'yaml') => {
    const text = pane === 'json' ? jsonContent : yamlContent;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedPane(pane);
    setTimeout(() => setCopiedPane(null), 2000);
  };

  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-card">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold">
            <ArrowLeftRight className="h-4 w-4" />
            <span>Two-Way Live Sync</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Edit either pane to update the other in real-time
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs border border-border rounded-xl p-1 bg-background">
            <span className="text-muted-foreground px-1.5">Indent:</span>
            {[2, 4].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => handleIndentChange(s as 2 | 4)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                  indentSize === s
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s} sp
              </button>
            ))}
          </div>

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
            onClick={clearAll}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-destructive/10 hover:text-destructive text-xs font-semibold text-muted-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Error or Success Status Bar */}
      {error ? (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Syntax valid • Real-time synchronized</span>
        </div>
      )}

      {/* Editor Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* JSON Pane */}
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                JSON
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {jsonContent ? `${jsonContent.split('\n').length} lines` : 'empty'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => copyToClipboard('json')}
                disabled={!jsonContent}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                title="Copy JSON"
              >
                {copiedPane === 'json' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => downloadTextFile(jsonContent, 'data.json', 'application/json')}
                disabled={!jsonContent}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                title="Download JSON"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[420px] text-xs font-mono">
            <CodeMirror
              value={jsonContent}
              height="420px"
              extensions={[json()]}
              theme={isDarkMode ? oneDark : 'light'}
              onChange={handleJsonChange}
              className="text-xs"
            />
          </div>
        </div>

        {/* YAML Pane */}
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                YAML
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {yamlContent ? `${yamlContent.split('\n').length} lines` : 'empty'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => copyToClipboard('yaml')}
                disabled={!yamlContent}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                title="Copy YAML"
              >
                {copiedPane === 'yaml' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => downloadTextFile(yamlContent, 'data.yaml', 'application/x-yaml')}
                disabled={!yamlContent}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                title="Download YAML"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[420px] text-xs font-mono">
            <CodeMirror
              value={yamlContent}
              height="420px"
              extensions={[yamlLang()]}
              theme={isDarkMode ? oneDark : 'light'}
              onChange={handleYamlChange}
              className="text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
