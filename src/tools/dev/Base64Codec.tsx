import { useState } from 'react';
import {
  Binary,
  Globe,
  FileUp,
  FileDown,
  Copy,
  Check,
  Download,
  RotateCcw,
  ArrowUpDown,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { utf8ToBase64, base64ToUtf8, fileToBase64DataUrl, downloadTextFile } from '../../lib/devUtils';
import { downloadFile, formatBytes } from '../../lib/pdfUtils';
import { FileDropzone } from '../../components/shared/FileDropzone';

type CodecTab = 'text-base64' | 'url' | 'file-to-base64' | 'base64-to-file';

export default function Base64Codec() {
  const [activeTab, setActiveTab] = useState<CodecTab>('text-base64');

  // Text Base64 states
  const [b64InputText, setB64InputText] = useState('Hello, Webtools! 🛠️ 100% private & client-side.');
  const [b64OutputText, setB64OutputText] = useState('');
  const [b64Mode, setB64Mode] = useState<'encode' | 'decode'>('encode');

  // URL Encode/Decode states
  const [urlInput, setUrlInput] = useState('https://example.com/search?query=web utilities & tools#section');
  const [urlOutput, setUrlOutput] = useState('');
  const [urlMode, setUrlMode] = useState<'encode' | 'decode'>('encode');

  // File to Base64 states
  const [fileDataUrl, setFileDataUrl] = useState('');
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; size: number; type: string } | null>(null);

  // Base64 to File states
  const [rawBase64Input, setRawBase64Input] = useState('');
  const [downloadFileName, setDownloadFileName] = useState('decoded-file.bin');

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Text Base64 conversion
  const handleConvertTextBase64 = (text = b64InputText, mode = b64Mode) => {
    setError(null);
    if (!text.trim()) {
      setB64OutputText('');
      return;
    }

    try {
      if (mode === 'encode') {
        const encoded = utf8ToBase64(text);
        setB64OutputText(encoded);
      } else {
        const decoded = base64ToUtf8(text);
        setB64OutputText(decoded);
      }
    } catch (err: any) {
      setError(`Base64 ${mode === 'encode' ? 'encoding' : 'decoding'} failed: ${err?.message}`);
    }
  };

  // Handle URL encode/decode
  const handleConvertUrl = (text = urlInput, mode = urlMode) => {
    setError(null);
    if (!text.trim()) {
      setUrlOutput('');
      return;
    }

    try {
      if (mode === 'encode') {
        setUrlOutput(encodeURIComponent(text));
      } else {
        setUrlOutput(decodeURIComponent(text));
      }
    } catch (err: any) {
      setError(`URL ${mode === 'encode' ? 'encoding' : 'decoding'} failed: ${err?.message}`);
    }
  };

  const swapTextBase64 = () => {
    const nextMode = b64Mode === 'encode' ? 'decode' : 'encode';
    setB64Mode(nextMode);
    setB64InputText(b64OutputText);
    handleConvertTextBase64(b64OutputText, nextMode);
  };

  const swapUrl = () => {
    const nextMode = urlMode === 'encode' ? 'decode' : 'encode';
    setUrlMode(nextMode);
    setUrlInput(urlOutput);
    handleConvertUrl(urlOutput, nextMode);
  };

  const handleFileUpload = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setError(null);
    setUploadedFileInfo({ name: file.name, size: file.size, type: file.type || 'application/octet-stream' });

    try {
      const dataUrl = await fileToBase64DataUrl(file);
      setFileDataUrl(dataUrl);
    } catch (err: any) {
      setError(`Failed to read file: ${err?.message}`);
    }
  };

  const handleBase64ToFileDownload = () => {
    setError(null);
    if (!rawBase64Input.trim()) {
      setError('Please paste a Base64 string or Data URI.');
      return;
    }

    try {
      let mimeType = 'application/octet-stream';
      let b64Data = rawBase64Input.trim();

      // Check if data URI
      const dataUriMatch = b64Data.match(/^data:(.*?);base64,(.*)$/);
      if (dataUriMatch) {
        mimeType = dataUriMatch[1];
        b64Data = dataUriMatch[2];
      }

      const binaryStr = atob(b64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      downloadFile(bytes, downloadFileName.trim() || 'decoded-file.bin', mimeType);
    } catch (err: any) {
      setError(`Base64 decode error: ${err?.message || 'Invalid base64 string'}`);
    }
  };

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-border/80 bg-card overflow-x-auto scrollbar-none">
        {[
          { id: 'text-base64', label: 'Text Base64', icon: Binary },
          { id: 'url', label: 'URL Codec', icon: Globe },
          { id: 'file-to-base64', label: 'File ➔ Base64', icon: FileUp },
          { id: 'base64-to-file', label: 'Base64 ➔ File', icon: FileDown },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as CodecTab);
                setError(null);
                if (tab.id === 'text-base64') handleConvertTextBase64();
                if (tab.id === 'url') handleConvertUrl();
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Text Base64 */}
      {activeTab === 'text-base64' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-card">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Mode:</span>
              {(['encode', 'decode'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setB64Mode(m);
                    handleConvertTextBase64(b64InputText, m);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                    b64Mode === m
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={swapTextBase64}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Swap</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                {b64Mode === 'encode' ? 'UTF-8 Text Input' : 'Base64 Input'}
              </label>
              <textarea
                rows={10}
                value={b64InputText}
                onChange={e => {
                  setB64InputText(e.target.value);
                  handleConvertTextBase64(e.target.value, b64Mode);
                }}
                placeholder="Enter string..."
                className="w-full p-3 rounded-xl border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {b64Mode === 'encode' ? 'Base64 Output' : 'Decoded Text'}
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(b64OutputText)}
                  disabled={!b64OutputText}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold disabled:opacity-40"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                rows={10}
                readOnly
                value={b64OutputText}
                placeholder="Result will appear here..."
                className="w-full p-3 rounded-xl border border-border bg-muted/40 text-xs font-mono text-foreground focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: URL Codec */}
      {activeTab === 'url' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-card">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Mode:</span>
              {(['encode', 'decode'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setUrlMode(m);
                    handleConvertUrl(urlInput, m);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                    urlMode === m
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={swapUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Swap</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                {urlMode === 'encode' ? 'URL / Query Input' : 'Encoded URL Input'}
              </label>
              <textarea
                rows={10}
                value={urlInput}
                onChange={e => {
                  setUrlInput(e.target.value);
                  handleConvertUrl(e.target.value, urlMode);
                }}
                placeholder="Enter URL or parameters..."
                className="w-full p-3 rounded-xl border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {urlMode === 'encode' ? 'Encoded Result' : 'Decoded URL'}
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(urlOutput)}
                  disabled={!urlOutput}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold disabled:opacity-40"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                rows={10}
                readOnly
                value={urlOutput}
                placeholder="Result will appear here..."
                className="w-full p-3 rounded-xl border border-border bg-muted/40 text-xs font-mono text-foreground focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: File to Base64 */}
      {activeTab === 'file-to-base64' && (
        <div className="space-y-4">
          <FileDropzone
            onFilesSelected={handleFileUpload}
            multiple={false}
            accept="*/*"
            title="Upload any file to convert into Base64 Data URI"
            subtitle="Images, PDFs, fonts, or binaries. Converted 100% in browser memory."
          />

          {fileDataUrl && uploadedFileInfo && (
            <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">{uploadedFileInfo.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    ({formatBytes(uploadedFileInfo.size)} • {uploadedFileInfo.type})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(fileDataUrl)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Data URI'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadTextFile(fileDataUrl, `${uploadedFileInfo.name}.b64.txt`)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download TXT</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={8}
                readOnly
                value={fileDataUrl}
                className="w-full p-3 rounded-xl border border-border bg-muted/40 text-[11px] font-mono text-foreground focus:outline-none resize-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Base64 to File */}
      {activeTab === 'base64-to-file' && (
        <div className="p-6 rounded-2xl border border-border/80 bg-card space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Paste Base64 String or Data URI
            </label>
            <textarea
              rows={8}
              value={rawBase64Input}
              onChange={e => setRawBase64Input(e.target.value)}
              placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA..."
              className="w-full p-3 rounded-xl border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-semibold">Download Filename:</label>
              <input
                type="text"
                value={downloadFileName}
                onChange={e => setDownloadFileName(e.target.value)}
                placeholder="decoded-file.png"
                className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-mono text-foreground focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRawBase64Input('')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>

              <button
                type="button"
                onClick={handleBase64ToFileDownload}
                disabled={!rawBase64Input.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/90 disabled:opacity-40 transition-all active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Decode & Download File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
