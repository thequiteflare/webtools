import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  PenTool,
  Upload,
  Type,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Move,
  FileText,
} from 'lucide-react';
import { FileDropzone } from '../../components/shared/FileDropzone';
import { pdfjsLib, downloadFile } from '../../lib/pdfUtils';

type SignatureMode = 'draw' | 'type' | 'upload';

interface PlacedSignature {
  dataUrl: string;
  pageNumber: number; // 1-based
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100) from top
  widthPercent: number; // percentage of page width
  aspectRatio: number;
}

export default function SignPdf() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Signature creation modal state
  const [showSignModal, setShowSignModal] = useState(false);
  const [signMode, setSignMode] = useState<SignatureMode>('draw');
  const [typedName, setTypedName] = useState('');
  const [sigColor, setSigColor] = useState('#0f172a');
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);

  // Placed signatures
  const [signatures, setSignatures] = useState<PlacedSignature[]>([]);
  const [selectedSigIndex, setSelectedSigIndex] = useState<number | null>(null);

  // Drawing canvas refs
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // PDF display canvas
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

  // Dragging signature state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, origX: 0, origY: 0 });

  const handleFileSelected = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setSourceFile(file);
    setSignatures([]);
    setSelectedSigIndex(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const proxy = await loadingTask.promise;
      setPdfDocProxy(proxy);
      setNumPages(proxy.numPages);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not load PDF document for signing.');
      setSourceFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Render current PDF page on canvas
  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!pdfDocProxy || !pdfCanvasRef.current || !pdfContainerRef.current) return;

      try {
        const page = await pdfDocProxy.getPage(currentPage);
        if (isCancelled) return;

        const containerWidth = Math.min(pdfContainerRef.current.clientWidth - 32, 700);
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = pdfCanvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvas: canvas,
          canvasContext: context,
          viewport: viewport,
        }).promise;
      } catch (err) {
        console.warn('Page render error:', err);
      }
    }

    renderPage();
    return () => {
      isCancelled = true;
    };
  }, [pdfDocProxy, currentPage]);

  // Drawing Pad Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = sigColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearDrawing = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Convert typed text to signature image
  const generateTypedSignature = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.font = 'italic 44px "Brush Script MT", "Segoe Script", "Great Vibes", cursive, sans-serif';
    ctx.fillStyle = sigColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName || 'Sign Here', 200, 60);

    return canvas.toDataURL('image/png');
  };

  const saveSignature = () => {
    let sigUrl = '';
    if (signMode === 'draw') {
      const canvas = drawCanvasRef.current;
      if (!canvas) return;
      sigUrl = canvas.toDataURL('image/png');
    } else if (signMode === 'type') {
      sigUrl = generateTypedSignature();
    } else if (signMode === 'upload' && currentSignature) {
      sigUrl = currentSignature;
    }

    if (!sigUrl) return;

    // Calculate aspect ratio
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.naturalWidth / (img.naturalHeight || 1);
      const newSig: PlacedSignature = {
        dataUrl: sigUrl,
        pageNumber: currentPage,
        x: 40, // center default (percent)
        y: 70, // bottom area default (percent)
        widthPercent: 25,
        aspectRatio,
      };
      setSignatures(prev => [...prev, newSig]);
      setSelectedSigIndex(signatures.length);
      setShowSignModal(false);
    };
    img.src = sigUrl;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setCurrentSignature(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Signature Drag Handlers
  const handleMouseDownSig = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setSelectedSigIndex(index);
    isDraggingRef.current = true;
    const sig = signatures[index];
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      origX: sig.x,
      origY: sig.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || selectedSigIndex === null || !pdfCanvasRef.current) return;
    const canvas = pdfCanvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();

    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    const dxPercent = (dx / canvasRect.width) * 100;
    const dyPercent = (dy / canvasRect.height) * 100;

    setSignatures(prev =>
      prev.map((s, idx) => {
        if (idx !== selectedSigIndex) return s;
        const newX = Math.max(0, Math.min(100 - s.widthPercent, dragStartRef.current.origX + dxPercent));
        const newY = Math.max(0, Math.min(95, dragStartRef.current.origY + dyPercent));
        return { ...s, x: newX, y: newY };
      })
    );
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const updateSelectedSigWidth = (widthPercent: number) => {
    if (selectedSigIndex === null) return;
    setSignatures(prev =>
      prev.map((s, i) => (i === selectedSigIndex ? { ...s, widthPercent } : s))
    );
  };

  const removeSelectedSig = () => {
    if (selectedSigIndex === null) return;
    setSignatures(prev => prev.filter((_, i) => i !== selectedSigIndex));
    setSelectedSigIndex(null);
  };

  // Export signed PDF
  const handleSignAndDownload = async () => {
    if (!sourceFile) return;
    if (signatures.length === 0) {
      setError('Please add at least one signature to your document.');
      return;
    }

    setIsExporting(true);
    setError(null);
    setSuccess(false);

    try {
      const buffer = await sourceFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);

      for (const sig of signatures) {
        // Embed signature PNG
        const pngBytes = await fetch(sig.dataUrl).then(r => r.arrayBuffer());
        const embeddedPng = await pdfDoc.embedPng(pngBytes);

        const page = pdfDoc.getPage(sig.pageNumber - 1);
        const { width: pageWidth, height: pageHeight } = page.getSize();

        // Calculate PDF coordinate placement
        const sigPdfWidth = (sig.widthPercent / 100) * pageWidth;
        const sigPdfHeight = sigPdfWidth / sig.aspectRatio;

        const sigPdfX = (sig.x / 100) * pageWidth;
        // In PDF coordinates, Y=0 is bottom
        const sigPdfY = pageHeight - (sig.y / 100) * pageHeight - sigPdfHeight;

        page.drawImage(embeddedPng, {
          x: sigPdfX,
          y: Math.max(0, sigPdfY),
          width: sigPdfWidth,
          height: sigPdfHeight,
        });
      }

      const signedBytes = await pdfDoc.save();
      const baseName = sourceFile.name.replace(/\.[^/.]+$/, '');
      downloadFile(signedBytes, `${baseName}-signed.pdf`);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to apply signatures to document.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Successfully signed and downloaded your document!</span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading PDF for signing...</span>
        </div>
      )}

      {!sourceFile && !isLoading ? (
        <FileDropzone
          onFilesSelected={handleFileSelected}
          accept=".pdf,application/pdf"
          multiple={false}
          title="Upload PDF to sign"
          subtitle="Draw, stamp, or type your signature directly in your browser."
        />
      ) : sourceFile && (
        <div className="space-y-6">
          {/* Main Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-card">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-foreground truncate max-w-sm">
                  {sourceFile.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Page {currentPage} of {numPages} • {signatures.length} signature(s) placed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowSignModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90 transition-colors"
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>+ Add Signature</span>
              </button>

              <button
                onClick={handleSignAndDownload}
                disabled={isExporting || signatures.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-sm hover:bg-emerald-700 disabled:opacity-40 transition-colors"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Signing...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Sign & Download</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Page Navigation & Controls */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-semibold text-foreground">
                Page {currentPage} of {numPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {selectedSigIndex !== null && (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Move className="h-3 w-3" /> Drag to move
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Size:</span>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={signatures[selectedSigIndex]?.widthPercent || 25}
                    onChange={e => updateSelectedSigWidth(Number(e.target.value))}
                    className="w-20 accent-primary"
                  />
                </div>
                <button
                  onClick={removeSelectedSig}
                  className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"
                  title="Delete signature"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Interactive PDF Viewing & Signature Placement Canvas */}
          <div
            ref={pdfContainerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="relative flex justify-center p-4 rounded-2xl border border-border/80 bg-muted/30 overflow-auto select-none"
          >
            <div className="relative shadow-xl rounded-lg overflow-hidden border border-border/60 bg-white">
              <canvas ref={pdfCanvasRef} className="block max-w-full" />

              {/* Render placed signatures for current page */}
              {signatures.map((sig, idx) => {
                if (sig.pageNumber !== currentPage) return null;
                const isSelected = selectedSigIndex === idx;

                return (
                  <div
                    key={idx}
                    onMouseDown={e => handleMouseDownSig(e, idx)}
                    style={{
                      left: `${sig.x}%`,
                      top: `${sig.y}%`,
                      width: `${sig.widthPercent}%`,
                    }}
                    className={`absolute cursor-move transition-shadow ${
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-background shadow-lg'
                        : 'hover:ring-1 hover:ring-primary/60'
                    }`}
                  >
                    <img
                      src={sig.dataUrl}
                      alt="Signature"
                      className="w-full pointer-events-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Signature Creation Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold text-base text-foreground">Create Signature</h3>
              <button
                onClick={() => setShowSignModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                Cancel
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSignMode('draw')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  signMode === 'draw'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>Draw</span>
              </button>

              <button
                type="button"
                onClick={() => setSignMode('type')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  signMode === 'type'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <Type className="h-3.5 w-3.5" />
                <span>Type</span>
              </button>

              <button
                type="button"
                onClick={() => setSignMode('upload')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  signMode === 'upload'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload</span>
              </button>
            </div>

            {/* Drawing Area */}
            {signMode === 'draw' && (
              <div className="space-y-3">
                <div className="relative rounded-xl border border-border bg-white overflow-hidden shadow-inner">
                  <canvas
                    ref={drawCanvasRef}
                    width={450}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 cursor-crosshair touch-none"
                  />
                  <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/60 pointer-events-none select-none">
                    Sign with mouse or stylus
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {['#0f172a', '#1e40af', '#991b1b'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSigColor(c)}
                        style={{ backgroundColor: c }}
                        className={`h-5 w-5 rounded-full border-2 transition-transform ${
                          sigColor === c ? 'scale-125 border-primary ring-2 ring-primary/20' : 'border-border'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={clearDrawing}
                    className="text-xs text-muted-foreground hover:text-destructive font-medium"
                  >
                    Clear Drawing
                  </button>
                </div>
              </div>
            )}

            {/* Typing Area */}
            {signMode === 'type' && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={typedName}
                  onChange={e => setTypedName(e.target.value)}
                  placeholder="Type your name..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />

                <div className="h-28 rounded-xl border border-border bg-white flex items-center justify-center p-4">
                  <span
                    style={{
                      fontFamily: '"Brush Script MT", "Segoe Script", "Great Vibes", cursive, sans-serif',
                      color: sigColor,
                    }}
                    className="text-4xl italic"
                  >
                    {typedName || 'Your Signature'}
                  </span>
                </div>
              </div>
            )}

            {/* Upload Area */}
            {signMode === 'upload' && (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer bg-muted/20">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs font-semibold text-foreground">
                    Upload transparent signature PNG
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    Images are processed locally without upload
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {currentSignature && (
                  <div className="h-24 rounded-xl border border-border bg-white flex items-center justify-center p-2">
                    <img src={currentSignature} alt="Preview" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSignature}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90"
              >
                Place on Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
