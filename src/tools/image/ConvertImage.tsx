import { useState } from 'react';
import {
  Download,
  Trash2,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Palette,
} from 'lucide-react';
import { FileDropzone } from '../../components/shared/FileDropzone';
import { loadImageFromFile, processImage, downloadZip } from '../../lib/imageUtils';
import { downloadFile, formatBytes } from '../../lib/pdfUtils';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  size: number;
}

type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export default function ConvertImage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/webp');
  const [quality, setQuality] = useState<number>(90);
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [useBackground, setUseBackground] = useState<boolean>(false);

  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    setSuccess(false);

    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setError('Please select valid image files.');
      return;
    }

    try {
      const newItems: ImageItem[] = [];
      for (const file of validFiles) {
        const img = await loadImageFromFile(file);
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          previewUrl: URL.createObjectURL(file),
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
        });
      }
      setImages(prev => [...prev, ...newItems]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load images.');
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setError(null);
    setSuccess(false);
  };

  const getFormatExtension = (fmt: OutputFormat): string => {
    switch (fmt) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
    }
  };

  const convertSingle = async (item: ImageItem): Promise<{ name: string; blob: Blob }> => {
    const img = await loadImageFromFile(item.file);
    const ext = getFormatExtension(outputFormat);
    const baseName = item.file.name.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}.${ext}`;

    const bg = outputFormat === 'image/jpeg' ? (backgroundColor || '#ffffff') : useBackground ? backgroundColor : undefined;

    const blob = await processImage(img, {
      width: item.width,
      height: item.height,
      format: outputFormat,
      quality: quality / 100,
      backgroundColor: bg,
    });

    return { name: outName, blob };
  };

  const handleDownloadSingle = async (item: ImageItem) => {
    setIsConverting(true);
    setError(null);
    try {
      const { name, blob } = await convertSingle(item);
      downloadFile(blob, name, blob.type);
    } catch (err: any) {
      setError(err?.message || 'Failed to convert image.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadAll = async () => {
    if (images.length === 0) return;
    setIsConverting(true);
    setError(null);
    setSuccess(false);

    try {
      if (images.length === 1) {
        await handleDownloadSingle(images[0]);
        setSuccess(true);
        return;
      }

      const results: { name: string; blob: Blob }[] = [];
      for (const item of images) {
        const converted = await convertSingle(item);
        results.push(converted);
      }

      await downloadZip(results, `converted-${getFormatExtension(outputFormat)}-images.zip`);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to convert images.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Successfully converted and downloaded your images!</span>
        </div>
      )}

      {images.length === 0 ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept="image/*"
          multiple={true}
          title="Drag & drop images to convert format"
          subtitle="Convert to WebP, PNG, or JPG. Fast, offline & 100% private."
        />
      ) : (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-card">
            <div>
              <span className="text-sm font-bold text-foreground">
                {images.length} {images.length === 1 ? 'Image' : 'Images'} Selected
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ready to convert to {getFormatExtension(outputFormat).toUpperCase()} format
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors">
                <Plus className="h-3.5 w-3.5" />
                <span>Add More</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => e.target.files && handleFilesSelected(Array.from(e.target.files))}
                  className="hidden"
                />
              </label>

              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-destructive/10 hover:text-destructive text-xs font-semibold text-muted-foreground transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear All</span>
              </button>

              <button
                onClick={handleDownloadAll}
                disabled={isConverting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>{images.length === 1 ? 'Download Converted' : 'Convert All (.ZIP)'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Format Settings Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl border border-border/80 bg-card">
            {/* Target Format */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Target Format</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'image/webp', label: 'WebP', note: 'Modern & Compact' },
                  { id: 'image/jpeg', label: 'JPG', note: 'Standard Photo' },
                  { id: 'image/png', label: 'PNG', note: 'Lossless' },
                ].map(fmt => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setOutputFormat(fmt.id as OutputFormat)}
                    className={`py-2 px-2.5 rounded-xl text-center transition-colors ${
                      outputFormat === fmt.id
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
                    }`}
                  >
                    <div className="text-xs">{fmt.label}</div>
                    <div className={`text-[10px] ${outputFormat === fmt.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {fmt.note}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality (for WebP and JPG) */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quality
              </label>
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Compression Level</span>
                  <span className="font-bold text-foreground">{outputFormat === 'image/png' ? 'Lossless (100%)' : `${quality}%`}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  disabled={outputFormat === 'image/png'}
                  value={quality}
                  onChange={e => setQuality(Number(e.target.value))}
                  className="w-full accent-primary disabled:opacity-40"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {outputFormat === 'image/png'
                    ? 'PNG output preserves lossless quality.'
                    : 'Controls WebP/JPG compression level.'}
                </p>
              </div>
            </div>

            {/* Background Color */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                <span>Background Color</span>
              </label>

              {outputFormat === 'image/jpeg' ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">
                    JPG does not support transparency. Select background replacement color:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={e => setBackgroundColor(e.target.value)}
                      className="h-8 w-12 rounded cursor-pointer border border-border"
                    />
                    <span className="text-xs font-mono text-muted-foreground">{backgroundColor}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useBackground}
                      onChange={e => setUseBackground(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <span>Flatten onto solid background</span>
                  </label>
                  {useBackground && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={e => setBackgroundColor(e.target.value)}
                        className="h-8 w-12 rounded cursor-pointer border border-border"
                      />
                      <span className="text-xs font-mono text-muted-foreground">{backgroundColor}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Images Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {images.map(item => (
              <div
                key={item.id}
                className="relative rounded-2xl border border-border/80 bg-card p-3.5 flex flex-col justify-between space-y-3 group hover:border-primary/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 rounded-xl border border-border/50 bg-muted/40 overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate" title={item.file.name}>
                      {item.file.name}
                    </p>
                    <div className="text-[11px] text-muted-foreground font-mono mt-1 space-y-0.5">
                      <div>Size: {formatBytes(item.size)}</div>
                      <div>Dimensions: {item.width}×{item.height}px</div>
                      <div className="text-primary font-bold">
                        Convert to: .{getFormatExtension(outputFormat)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => removeImage(item.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(item)}
                    disabled={isConverting}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Convert</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
