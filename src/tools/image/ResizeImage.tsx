import { useState } from 'react';
import {
  Download,
  Trash2,
  Lock,
  Unlock,
  Percent,
  Scaling,
  Sliders,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  HardDrive,
} from 'lucide-react';
import { FileDropzone } from '../../components/shared/FileDropzone';
import {
  loadImageFromFile,
  processImage,
  compressToTargetSize,
  downloadZip,
} from '../../lib/imageUtils';
import { downloadFile, formatBytes } from '../../lib/pdfUtils';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  origWidth: number;
  origHeight: number;
  origSize: number;
  newWidth: number;
  newHeight: number;
  processedBlob?: Blob;
}

type ResizeMode = 'percentage' | 'dimensions' | 'file-size';
type TargetFormat = 'original' | 'image/jpeg' | 'image/png' | 'image/webp';
type SizeUnit = 'KB' | 'MB';

export default function ResizeImage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [resizeMode, setResizeMode] = useState<ResizeMode>('percentage');

  // Percentage mode states
  const [percentage, setPercentage] = useState<number>(50);

  // Exact dimensions mode states
  const [customWidth, setCustomWidth] = useState<number>(800);
  const [customHeight, setCustomHeight] = useState<number>(600);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);

  // Target file size mode states
  const [targetSizeValue, setTargetSizeValue] = useState<number>(500);
  const [targetSizeUnit, setTargetSizeUnit] = useState<SizeUnit>('KB');

  // Quality & Format states
  const [quality, setQuality] = useState<number>(85); // 10 to 100
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('original');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const calculateTargetBytes = (val = targetSizeValue, unit = targetSizeUnit): number => {
    return unit === 'MB' ? Math.round(val * 1024 * 1024) : Math.round(val * 1024);
  };

  const calculateDimensions = (
    origWidth: number,
    origHeight: number,
    mode = resizeMode,
    pct = percentage,
    cWidth = customWidth,
    cHeight = customHeight,
    keepRatio = lockAspectRatio
  ): { newWidth: number; newHeight: number } => {
    if (mode === 'percentage') {
      const factor = pct / 100;
      return {
        newWidth: Math.max(1, Math.round(origWidth * factor)),
        newHeight: Math.max(1, Math.round(origHeight * factor)),
      };
    } else if (mode === 'dimensions') {
      if (keepRatio) {
        const ratio = origWidth / origHeight;
        if (cWidth && !cHeight) {
          return { newWidth: cWidth, newHeight: Math.max(1, Math.round(cWidth / ratio)) };
        }
        return {
          newWidth: cWidth,
          newHeight: Math.max(1, Math.round(cWidth / ratio)),
        };
      }
      return { newWidth: cWidth, newHeight: cHeight };
    } else {
      // File-size mode preserves original aspect unless compressed
      return { newWidth: origWidth, newHeight: origHeight };
    }
  };

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
        const { newWidth, newHeight } = calculateDimensions(img.naturalWidth, img.naturalHeight);

        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          previewUrl: URL.createObjectURL(file),
          origWidth: img.naturalWidth,
          origHeight: img.naturalHeight,
          origSize: file.size,
          newWidth,
          newHeight,
        });

        if (images.length === 0 && newItems.length === 1) {
          setCustomWidth(Math.round(img.naturalWidth * 0.5));
          setCustomHeight(Math.round(img.naturalHeight * 0.5));
        }
      }

      setImages(prev => [...prev, ...newItems]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load images.');
    }
  };

  const updateCalculations = (
    mode: ResizeMode,
    pct: number,
    cWidth: number,
    cHeight: number,
    keepRatio: boolean
  ) => {
    setImages(prev =>
      prev.map(item => {
        const { newWidth, newHeight } = calculateDimensions(
          item.origWidth,
          item.origHeight,
          mode,
          pct,
          cWidth,
          cHeight,
          keepRatio
        );
        return { ...item, newWidth, newHeight };
      })
    );
  };

  const handlePercentageChange = (pct: number) => {
    setPercentage(pct);
    updateCalculations('percentage', pct, customWidth, customHeight, lockAspectRatio);
  };

  const handleWidthChange = (val: number) => {
    setCustomWidth(val);
    let newH = customHeight;
    if (lockAspectRatio && images.length > 0) {
      const first = images[0];
      const ratio = first.origWidth / first.origHeight;
      newH = Math.max(1, Math.round(val / ratio));
      setCustomHeight(newH);
    }
    updateCalculations('dimensions', percentage, val, newH, lockAspectRatio);
  };

  const handleHeightChange = (val: number) => {
    setCustomHeight(val);
    let newW = customWidth;
    if (lockAspectRatio && images.length > 0) {
      const first = images[0];
      const ratio = first.origWidth / first.origHeight;
      newW = Math.max(1, Math.round(val * ratio));
      setCustomWidth(newW);
    }
    updateCalculations('dimensions', percentage, newW, val, lockAspectRatio);
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

  const processSingleItem = async (item: ImageItem): Promise<{ name: string; blob: Blob }> => {
    const img = await loadImageFromFile(item.file);
    const baseName = item.file.name.replace(/\.[^/.]+$/, '');

    // Target file size mode: iterative quality & scale search
    if (resizeMode === 'file-size') {
      const targetBytes = calculateTargetBytes();
      const preferredFormat = targetFormat === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
      const ext = preferredFormat === 'image/jpeg' ? 'jpg' : 'webp';

      const result = await compressToTargetSize(
        img,
        targetBytes,
        preferredFormat,
        item.origWidth,
        item.origHeight
      );

      const outputFileName = `${baseName}-under-${targetSizeValue}${targetSizeUnit}.${ext}`;
      return { name: outputFileName, blob: result.blob };
    }

    // Percentage or Dimensions mode
    let format: 'image/jpeg' | 'image/png' | 'image/webp';
    if (targetFormat === 'original') {
      if (item.file.type === 'image/jpeg' || item.file.type === 'image/jpg') {
        format = 'image/jpeg';
      } else if (item.file.type === 'image/webp') {
        format = 'image/webp';
      } else {
        format = 'image/png';
      }
    } else {
      format = targetFormat;
    }

    const blob = await processImage(img, {
      width: item.newWidth,
      height: item.newHeight,
      format,
      quality: quality / 100,
    });

    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    const outputFileName = `${baseName}-${item.newWidth}x${item.newHeight}.${ext}`;

    return { name: outputFileName, blob };
  };

  const downloadSingle = async (item: ImageItem) => {
    setIsProcessing(true);
    setError(null);
    try {
      const { name, blob } = await processSingleItem(item);
      downloadFile(blob, name, blob.type);
    } catch (err: any) {
      setError(err?.message || 'Failed to resize image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAll = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      if (images.length === 1) {
        await downloadSingle(images[0]);
        setSuccess(true);
        return;
      }

      const processedFiles: { name: string; blob: Blob }[] = [];
      for (const item of images) {
        const processed = await processSingleItem(item);
        processedFiles.push(processed);
      }

      await downloadZip(processedFiles, 'resized-images.zip');
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to process images.');
    } finally {
      setIsProcessing(false);
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
          <span>Successfully processed and downloaded your images!</span>
        </div>
      )}

      {images.length === 0 ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept="image/*"
          multiple={true}
          title="Drag & drop images to resize, compress & reduce file size"
          subtitle="Supports PNG, JPG, JPEG, and WebP. 100% in-browser processing."
        />
      ) : (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-card">
            <div>
              <span className="text-sm font-bold text-foreground">
                {images.length} {images.length === 1 ? 'Image' : 'Images'} Loaded
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total input size: {formatBytes(images.reduce((a, b) => a + b.origSize, 0))}
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
                onClick={downloadAll}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>{images.length === 1 ? 'Download Resized' : 'Download All (.ZIP)'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Configuration Settings Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl border border-border/80 bg-card">
            {/* Mode Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Resize & Compress Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setResizeMode('percentage');
                    updateCalculations('percentage', percentage, customWidth, customHeight, lockAspectRatio);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                    resizeMode === 'percentage'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Percent className="h-3.5 w-3.5" />
                  <span>Percent</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResizeMode('dimensions');
                    updateCalculations('dimensions', percentage, customWidth, customHeight, lockAspectRatio);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                    resizeMode === 'dimensions'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Scaling className="h-3.5 w-3.5" />
                  <span>Dimensions</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResizeMode('file-size');
                    updateCalculations('file-size', percentage, customWidth, customHeight, lockAspectRatio);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                    resizeMode === 'file-size'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <HardDrive className="h-3.5 w-3.5" />
                  <span>Target Size</span>
                </button>
              </div>

              {/* Mode Specific Controls */}
              {resizeMode === 'percentage' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Scale Factor</span>
                    <span className="font-bold text-foreground">{percentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={percentage}
                    onChange={e => handlePercentageChange(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex gap-1.5 pt-1">
                    {[25, 50, 75].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePercentageChange(p)}
                        className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${
                          percentage === p
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {resizeMode === 'dimensions' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                        Width (px)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={customWidth}
                        onChange={e => handleWidthChange(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setLockAspectRatio(!lockAspectRatio)}
                      className={`p-2 rounded-lg border mt-4 transition-colors ${
                        lockAspectRatio
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                      title={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                    >
                      {lockAspectRatio ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    </button>

                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                        Height (px)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={customHeight}
                        onChange={e => handleHeightChange(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {resizeMode === 'file-size' && (
                <div className="space-y-2 pt-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Target Max File Size
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step={targetSizeUnit === 'MB' ? '0.1' : '10'}
                      value={targetSizeValue}
                      onChange={e => setTargetSizeValue(Math.max(1, Number(e.target.value)))}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-mono font-bold"
                    />

                    <div className="grid grid-cols-2 gap-1 bg-muted/60 p-1 rounded-lg border border-border/60">
                      {(['KB', 'MB'] as SizeUnit[]).map(u => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => {
                            if (u === 'MB' && targetSizeUnit === 'KB') {
                              setTargetSizeValue(Number((targetSizeValue / 1024).toFixed(1)) || 1);
                            } else if (u === 'KB' && targetSizeUnit === 'MB') {
                              setTargetSizeValue(Math.round(targetSizeValue * 1024) || 500);
                            }
                            setTargetSizeUnit(u);
                          }}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                            targetSizeUnit === u
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {[
                      { val: 100, unit: 'KB' },
                      { val: 250, unit: 'KB' },
                      { val: 500, unit: 'KB' },
                      { val: 1, unit: 'MB' },
                      { val: 2, unit: 'MB' },
                    ].map(preset => (
                      <button
                        key={`${preset.val}-${preset.unit}`}
                        type="button"
                        onClick={() => {
                          setTargetSizeValue(preset.val);
                          setTargetSizeUnit(preset.unit as SizeUnit);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded border font-medium transition-colors ${
                          targetSizeValue === preset.val && targetSizeUnit === preset.unit
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {preset.val} {preset.unit}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quality / Compression Slider */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" />
                <span>Quality & Compression</span>
              </label>

              {resizeMode === 'file-size' ? (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed space-y-1.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Auto-Optimized Quality</span>
                  </div>
                  <p className="text-[11px]">
                    Quality and scale will automatically be tuned via binary search to ensure file size stays under{' '}
                    <strong className="text-foreground">{targetSizeValue} {targetSizeUnit}</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Output Quality</span>
                    <span className="font-bold text-foreground">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={quality}
                    onChange={e => setQuality(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Higher quality increases visual sharpness and file size. 80-85% is ideal for web usage.
                  </p>
                </div>
              )}
            </div>

            {/* Output Format Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Output Format
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'original', label: 'Original', disabled: resizeMode === 'file-size' },
                  { id: 'image/webp', label: 'WebP (Best)', disabled: false },
                  { id: 'image/jpeg', label: 'JPG', disabled: false },
                  { id: 'image/png', label: 'PNG', disabled: resizeMode === 'file-size' },
                ].map(fmt => (
                  <button
                    key={fmt.id}
                    type="button"
                    disabled={fmt.disabled}
                    onClick={() => setTargetFormat(fmt.id as TargetFormat)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-30 ${
                      (targetFormat === fmt.id && (!fmt.disabled || resizeMode !== 'file-size')) ||
                      (resizeMode === 'file-size' && targetFormat === 'original' && fmt.id === 'image/webp')
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
              {resizeMode === 'file-size' && (
                <p className="text-[10px] text-muted-foreground">
                  Target size compression utilizes WebP or JPG for high compression efficiency.
                </p>
              )}
            </div>
          </div>

          {/* Interactive Image Gallery */}
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
                      <div>
                        Original: {item.origWidth}×{item.origHeight}px ({formatBytes(item.origSize)})
                      </div>
                      {resizeMode === 'file-size' ? (
                        <div className="text-primary font-bold">
                          Target: ≤ {targetSizeValue} {targetSizeUnit}
                        </div>
                      ) : (
                        <div className="text-primary font-bold">
                          Target: {item.newWidth}×{item.newHeight}px
                        </div>
                      )}
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
                    onClick={() => downloadSingle(item)}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
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
