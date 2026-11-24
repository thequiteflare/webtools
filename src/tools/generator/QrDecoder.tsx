import { useState, useEffect, useRef, useCallback } from 'react';
import QRCodeStyling from 'qr-code-styling';
import {
  UploadCloud,
  Copy,
  Check,
  ExternalLink,
  Download,
  AlertCircle,
  CheckCircle2,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  User,
  MapPin,
  Code2,
  FileText,
  Sparkles,
  Camera,
  CameraOff,
  RotateCcw,
  Eye,
  EyeOff,
  QrCode,
  FileCheck,
} from 'lucide-react';
import {
  parseQrPayload,
  decodeQrFromImage,
  decodeQrFromImageData,
  type ParsedQrResult,
  type DecodedResult,
} from '../../lib/qrUtils';
import { formatBytes } from '../../lib/pdfUtils';

export default function QrDecoder() {
  const [, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number; size: number } | null>(null);

  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [decodedResult, setDecodedResult] = useState<DecodedResult | null>(null);
  const [parsedPayload, setParsedPayload] = useState<ParsedQrResult | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const [wifiPassCopied, setWifiPassCopied] = useState<boolean>(false);
  const [showWifiPass, setShowWifiPass] = useState<boolean>(false);

  // Camera scanner state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Highlight QR code bounding box on canvas
  const drawOverlay = useCallback(
    (img: HTMLImageElement, location?: DecodedResult['location']) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      // Draw base image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (location) {
        const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = location;

        // Draw glowing polygon
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(topLeftCorner.x, topLeftCorner.y);
        ctx.lineTo(topRightCorner.x, topRightCorner.y);
        ctx.lineTo(bottomRightCorner.x, bottomRightCorner.y);
        ctx.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
        ctx.closePath();

        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'; // Emerald translucent fill
        ctx.fill();

        ctx.lineWidth = Math.max(3, Math.min(canvas.width, canvas.height) * 0.008);
        ctx.strokeStyle = '#10b981'; // Emerald 500
        ctx.shadowColor = '#059669';
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Draw corner points
        const corners = [topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner];
        const pointRadius = Math.max(4, Math.min(canvas.width, canvas.height) * 0.012);

        for (const pt of corners) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pointRadius, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.lineWidth = pointRadius * 0.4;
          ctx.strokeStyle = '#10b981';
          ctx.stroke();
        }

        ctx.restore();
      }
    },
    []
  );

  // Process an image element to decode QR
  const processImageElement = useCallback(
    async (img: HTMLImageElement, fileMeta?: { size: number }) => {
      setIsDecoding(true);
      setDecodeError(null);
      setDecodedResult(null);
      setParsedPayload(null);

      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      setImageInfo({
        width,
        height,
        size: fileMeta?.size || 0,
      });

      try {
        const result = await decodeQrFromImage(img);

        if (result && result.data) {
          setDecodedResult(result);
          setParsedPayload(parseQrPayload(result.data));
          drawOverlay(img, result.location);
        } else {
          setDecodeError('No QR code could be found in this image. Try an image with higher contrast or sharper focus.');
          drawOverlay(img);
        }
      } catch (err: any) {
        setDecodeError(err?.message || 'Error occurred while decoding QR code.');
        drawOverlay(img);
      } finally {
        setIsDecoding(false);
      }
    },
    [drawOverlay]
  );

  // Handle selected file
  const handleFileChange = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        setDecodeError('Please provide a valid image file (PNG, JPG, WebP, SVG, etc.).');
        return;
      }

      stopCamera();
      setImageFile(file);

      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        setImageSrc(dataUrl);

        const img = new Image();
        img.onload = () => {
          processImageElement(img, { size: file.size });
        };
        img.onerror = () => {
          setDecodeError('Failed to read and render image file.');
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [processImageElement]
  );

  // Paste from clipboard listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleFileChange(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFileChange]);

  // Try sample QR code
  const handleLoadSample = async () => {
    stopCamera();
    try {
      setIsDecoding(true);
      setDecodeError(null);

      // Generate a stylish sample QR using QRCodeStyling
      const sampleQr = new QRCodeStyling({
        width: 400,
        height: 400,
        data: 'https://thewebtools.vercel.app',
        dotsOptions: {
          color: '#3b82f6',
          type: 'rounded',
        },
        backgroundOptions: {
          color: '#ffffff',
        },
        cornersSquareOptions: {
          color: '#1d4ed8',
          type: 'extra-rounded',
        },
        cornersDotOptions: {
          color: '#1d4ed8',
          type: 'dot',
        },
      });

      const rawBlob = await sampleQr.getRawData('png');
      if (!rawBlob) throw new Error('Could not generate sample QR');

      const sampleBlob = rawBlob instanceof Blob ? rawBlob : new Blob([rawBlob as unknown as Uint8Array<ArrayBuffer>], { type: 'image/png' });
      const sampleFile = new File([sampleBlob], 'sample-qr.png', { type: 'image/png' });
      handleFileChange(sampleFile);
    } catch (err: any) {
      setDecodeError('Failed to generate sample QR code: ' + (err?.message || ''));
      setIsDecoding(false);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setImageFile(null);
    setImageSrc(null);
    setDecodedResult(null);
    setParsedPayload(null);
    setDecodeError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        scanCameraFrame();
      }
    } catch (err: any) {
      setCameraError(err?.message || 'Could not access camera. Please grant camera permissions.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Frame scanning loop for camera
  const scanCameraFrame = () => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanCameraFrame);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = decodeQrFromImageData(imgData);

      if (result && result.data) {
        // Snapshot to preview canvas
        const previewCanvas = canvasRef.current;
        if (previewCanvas) {
          previewCanvas.width = canvas.width;
          previewCanvas.height = canvas.height;
          const pCtx = previewCanvas.getContext('2d');
          if (pCtx) {
            pCtx.drawImage(canvas, 0, 0);
          }
        }

        setImageInfo({
          width: canvas.width,
          height: canvas.height,
          size: 0,
        });
        setDecodedResult(result);
        setParsedPayload(parseQrPayload(result.data));
        stopCamera();
        return;
      }
    }

    animFrameRef.current = requestAnimationFrame(scanCameraFrame);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleCopy = (text: string, isWifiPass = false) => {
    navigator.clipboard.writeText(text);
    if (isWifiPass) {
      setWifiPassCopied(true);
      setTimeout(() => setWifiPassCopied(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!decodedResult) return;
    const blob = new Blob([decodedResult.data], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'decoded-qr-data.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenInGenerator = () => {
    if (!decodedResult) return;
    try {
      sessionStorage.setItem('webtools_qr_import', decodedResult.data);
    } catch (err) {
      console.error('Failed to save to sessionStorage', err);
    }
    window.location.hash = 'gen-qrcode';
    window.dispatchEvent(new CustomEvent('webtools_qr_import', { detail: decodedResult.data }));
  };

  const handleClear = () => {
    stopCamera();
    setImageFile(null);
    setImageSrc(null);
    setImageInfo(null);
    setDecodedResult(null);
    setParsedPayload(null);
    setDecodeError(null);
    setCameraError(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Render type-specific parsed details
  const renderParsedContent = () => {
    if (!parsedPayload) return null;

    switch (parsedPayload.type) {
      case 'url':
        return (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <ExternalLink className="h-4 w-4" />
              <span>Website Link</span>
            </div>
            <a
              href={parsedPayload.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-base font-semibold text-primary hover:underline break-all"
            >
              {parsedPayload.url}
            </a>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={parsedPayload.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open URL in New Tab</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopy(parsedPayload.url || '')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium hover:bg-muted transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied URL' : 'Copy URL'}</span>
              </button>
            </div>
          </div>
        );

      case 'wifi':
        return (
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-500">
              <Wifi className="h-4 w-4" />
              <span>Wi-Fi Network Credentials</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-2.5 rounded-lg bg-card/80 border border-border/60">
                <span className="text-xs text-muted-foreground block mb-0.5">Network Name (SSID)</span>
                <span className="font-semibold text-foreground select-all">{parsedPayload.wifi?.ssid || 'Unknown'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-card/80 border border-border/60">
                <span className="text-xs text-muted-foreground block mb-0.5">Security Encryption</span>
                <span className="font-semibold text-foreground">{parsedPayload.wifi?.encryption || 'WPA/WPA2'}</span>
              </div>
              {parsedPayload.wifi?.password && (
                <div className="sm:col-span-2 p-2.5 rounded-lg bg-card/80 border border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">Password</span>
                    <span className="font-mono font-medium text-foreground">
                      {showWifiPass ? parsedPayload.wifi.password : '••••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowWifiPass(!showWifiPass)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title={showWifiPass ? 'Hide password' : 'Show password'}
                    >
                      {showWifiPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(parsedPayload.wifi?.password || '', true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                    >
                      {wifiPassCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{wifiPassCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-500">
              <Mail className="h-4 w-4" />
              <span>Email Message</span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Recipient:</span>
                <span className="font-medium text-foreground select-all">{parsedPayload.email?.to}</span>
              </div>
              {parsedPayload.email?.subject && (
                <div>
                  <span className="text-xs text-muted-foreground block">Subject:</span>
                  <span className="font-medium text-foreground">{parsedPayload.email.subject}</span>
                </div>
              )}
              {parsedPayload.email?.body && (
                <div>
                  <span className="text-xs text-muted-foreground block">Message:</span>
                  <p className="font-sans text-xs bg-card/60 p-2.5 rounded-lg border border-border/60 whitespace-pre-wrap">
                    {parsedPayload.email.body}
                  </p>
                </div>
              )}
            </div>
            <a
              href={`mailto:${parsedPayload.email?.to || ''}?subject=${encodeURIComponent(
                parsedPayload.email?.subject || ''
              )}&body=${encodeURIComponent(parsedPayload.email?.body || '')}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Compose Email</span>
            </a>
          </div>
        );

      case 'phone':
        return (
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-500">
              <Phone className="h-4 w-4" />
              <span>Phone Number</span>
            </div>
            <p className="text-lg font-mono font-semibold text-foreground select-all">{parsedPayload.phone?.number}</p>
            <div className="flex gap-2">
              <a
                href={`tel:${parsedPayload.phone?.number}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Call Number</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopy(parsedPayload.phone?.number || '')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium hover:bg-muted transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        );

      case 'sms':
        return (
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-500">
              <MessageSquare className="h-4 w-4" />
              <span>SMS Message</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Phone:</span>
              <span className="font-mono font-semibold text-foreground">{parsedPayload.sms?.number}</span>
            </div>
            {parsedPayload.sms?.message && (
              <div>
                <span className="text-xs text-muted-foreground block">Message:</span>
                <p className="text-xs bg-card/60 p-2.5 rounded-lg border border-border/60">{parsedPayload.sms.message}</p>
              </div>
            )}
            <a
              href={`sms:${parsedPayload.sms?.number}?body=${encodeURIComponent(parsedPayload.sms?.message || '')}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Send SMS</span>
            </a>
          </div>
        );

      case 'vcard':
        return (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <User className="h-4 w-4" />
              <span>Contact Card (vCard)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {parsedPayload.vcard?.fullName && (
                <div>
                  <span className="text-muted-foreground block">Full Name:</span>
                  <span className="font-semibold text-foreground text-sm">{parsedPayload.vcard.fullName}</span>
                </div>
              )}
              {parsedPayload.vcard?.organization && (
                <div>
                  <span className="text-muted-foreground block">Organization:</span>
                  <span className="font-medium text-foreground">{parsedPayload.vcard.organization}</span>
                </div>
              )}
              {parsedPayload.vcard?.title && (
                <div>
                  <span className="text-muted-foreground block">Title / Position:</span>
                  <span className="font-medium text-foreground">{parsedPayload.vcard.title}</span>
                </div>
              )}
              {parsedPayload.vcard?.phone && (
                <div>
                  <span className="text-muted-foreground block">Phone:</span>
                  <span className="font-mono font-medium text-foreground">{parsedPayload.vcard.phone}</span>
                </div>
              )}
              {parsedPayload.vcard?.email && (
                <div>
                  <span className="text-muted-foreground block">Email:</span>
                  <span className="font-medium text-foreground">{parsedPayload.vcard.email}</span>
                </div>
              )}
              {parsedPayload.vcard?.url && (
                <div>
                  <span className="text-muted-foreground block">Website:</span>
                  <a
                    href={parsedPayload.vcard.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline truncate block"
                  >
                    {parsedPayload.vcard.url}
                  </a>
                </div>
              )}
            </div>
          </div>
        );

      case 'geo':
        return (
          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-500">
              <MapPin className="h-4 w-4" />
              <span>Geographic Coordinates</span>
            </div>
            <p className="font-mono text-sm text-foreground">
              Lat: {parsedPayload.geo?.latitude}, Long: {parsedPayload.geo?.longitude}
            </p>
            <a
              href={parsedPayload.geo?.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>View in Google Maps</span>
            </a>
          </div>
        );

      case 'json':
        return (
          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-500">
              <Code2 className="h-4 w-4" />
              <span>Parsed JSON Data</span>
            </div>
            <pre className="text-xs font-mono bg-muted/60 p-3 rounded-lg overflow-x-auto max-h-48 border border-border/60">
              {parsedPayload.jsonFormatted}
            </pre>
          </div>
        );

      case 'text':
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Input & Scanning (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                <span>Upload QR Image</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  title="Test scanner with a generated QR code"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Sample</span>
                </button>
                {imageSrc || isCameraActive ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear current image"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Camera View Mode */}
            {isCameraActive ? (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-square flex items-center justify-center border border-border">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-emerald-500/80 rounded-xl pointer-events-none animate-pulse m-8" />
                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute bottom-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold shadow-lg hover:bg-destructive/90 transition-all"
                >
                  <CameraOff className="h-4 w-4" />
                  <span>Stop Camera</span>
                </button>
              </div>
            ) : (
              /* Drag & drop upload box */
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className="group relative cursor-pointer rounded-xl border-2 border-dashed border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-muted/30 p-6 sm:p-8 text-center transition-all"
              >
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3.5 rounded-2xl bg-primary/10 text-primary group-hover:scale-105 transition-transform duration-200">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      Drop QR image here, or browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Supports PNG, JPG, WebP, SVG • Paste with <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">Ctrl+V</kbd>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90 transition-all pointer-events-none"
                  >
                    Select File
                  </button>
                </div>
              </div>
            )}

            {/* Camera Trigger Button */}
            {!isCameraActive && (
              <button
                type="button"
                onClick={startCamera}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border/80 bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
              >
                <Camera className="h-4 w-4 text-primary" />
                <span>Scan Live with Camera</span>
              </button>
            )}

            {cameraError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Image & Detection Preview Canvas */}
          <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Image Preview
              </span>
              {imageInfo && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  {imageInfo.width}×{imageInfo.height}px
                  {imageInfo.size > 0 && ` • ${formatBytes(imageInfo.size)}`}
                </span>
              )}
            </div>

            <div className="relative rounded-xl overflow-hidden bg-muted/40 border border-border/60 min-h-[160px] flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className={`max-h-72 w-full object-contain ${!imageSrc && !decodedResult ? 'hidden' : 'block'}`}
              />

              {!imageSrc && !decodedResult && (
                <div className="text-center p-6 text-muted-foreground">
                  <QrCode className="h-10 w-10 mx-auto stroke-1 opacity-40 mb-2" />
                  <p className="text-xs">No image uploaded yet</p>
                </div>
              )}

              {isDecoding && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-xs font-medium text-foreground">Analyzing QR code...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Decoded Results & Action Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Status Message / Empty State */}
          {!decodedResult && !decodeError && !isDecoding && (
            <div className="p-8 rounded-2xl border border-dashed border-border/80 bg-card text-center space-y-3">
              <div className="inline-flex p-3 rounded-2xl bg-muted text-muted-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Waiting for QR Code</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Upload or drag an image containing a QR code, paste from your clipboard, or click the{' '}
                <strong className="text-foreground">Sample</strong> button above.
              </p>
            </div>
          )}

          {decodeError && (
            <div className="p-4 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Detection Failed</span>
              </div>
              <p className="text-xs text-destructive/90">{decodeError}</p>
            </div>
          )}

          {/* Decoded Content Display */}
          {decodedResult && (
            <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-5">
              {/* Header with success badge */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">QR Code Decoded</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Successfully read and parsed payload
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 capitalize">
                    {parsedPayload?.type || 'text'}
                  </span>
                  {decodedResult.version && (
                    <span className="px-2 py-1 rounded-full text-[10px] font-mono bg-muted text-muted-foreground">
                      v{decodedResult.version}
                    </span>
                  )}
                </div>
              </div>

              {/* Specialized Parsed Content View */}
              {renderParsedContent()}

              {/* Raw Payload Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                    Raw Decoded Data
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {decodedResult.data.length} characters ({new TextEncoder().encode(decodedResult.data).length} bytes)
                  </span>
                </div>

                <div className="relative group">
                  <textarea
                    readOnly
                    value={decodedResult.data}
                    rows={4}
                    className="w-full p-3 rounded-xl bg-muted/40 border border-border/80 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                  />
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy(decodedResult.data)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-95"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Content'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/80 bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Download .txt</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenInGenerator}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/80 bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
                  title="Generate or restyle this QR code in Generator"
                >
                  <QrCode className="h-3.5 w-3.5 text-primary" />
                  <span>Open in QR Generator</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Help Card */}
          <div className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-2 text-xs text-muted-foreground">
            <h4 className="font-semibold text-foreground">Tips for Best Results:</h4>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Ensure the QR code is centered and not heavily blurred or obstructed.</li>
              <li>Supports all standard QR code formats including URLs, Wi-Fi keys, vCards, emails, and plain text.</li>
              <li>You can paste an image directly from your clipboard (<kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">Ctrl+V</kbd> / <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">Cmd+V</kbd>).</li>
              <li>All decoding runs 100% locally in your browser. No files are uploaded to any server.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
