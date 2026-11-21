import { useState, useEffect, useRef } from 'react';
import QRCodeStyling, {
  type DotType,
  type CornerSquareType,
  type CornerDotType,
  type ErrorCorrectionLevel,
} from 'qr-code-styling';
import {
  Link as LinkIcon,
  FileText,
  Wifi,
  Mail,
  Phone,
  Download,
  Image as ImageIcon,
  Palette,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

type InputType = 'url' | 'text' | 'wifi' | 'email' | 'phone';

const COLOR_PRESETS = [
  { name: 'Midnight', dots: '#0f172a', bg: '#ffffff', corners: '#0f172a' },
  { name: 'Emerald', dots: '#059669', bg: '#ecfdf5', corners: '#047857' },
  { name: 'Indigo', dots: '#4338ca', bg: '#eef2ff', corners: '#3730a3' },
  { name: 'Ruby', dots: '#be123c', bg: '#fff1f2', corners: '#9f1239' },
  { name: 'Dark Mode', dots: '#f8fafc', bg: '#090d16', corners: '#38bdf8' },
];

export default function QrGenerator() {
  const [inputType, setInputType] = useState<InputType>('url');

  // Input states
  const [urlValue, setUrlValue] = useState('https://thewebtools.vercel.app');
  const [textValue, setTextValue] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Styling states
  const [dotType, setDotType] = useState<DotType>('rounded');
  const [cornerSquareType, setCornerSquareType] = useState<CornerSquareType>('extra-rounded');
  const [cornerDotType, setCornerDotType] = useState<CornerDotType>('dot');
  const [dotsColor, setDotsColor] = useState('#0f172a');
  const [cornersColor, setCornersColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('H');
  const [qrSize, setQrSize] = useState<number>(320);

  const containerRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<QRCodeStyling | null>(null);

  // Compute standard payload string based on active mode
  const getPayload = (): string => {
    switch (inputType) {
      case 'url':
        return urlValue.trim() || 'https://thewebtools.vercel.app';
      case 'text':
        return textValue || 'Hello from Webtools!';
      case 'wifi': {
        const h = wifiHidden ? 'H:true;' : '';
        return `WIFI:S:${wifiSsid};T:${wifiEncryption};P:${wifiPassword};${h};`;
      }
      case 'email': {
        const sub = emailSubject ? `&subject=${encodeURIComponent(emailSubject)}` : '';
        const body = emailBody ? `&body=${encodeURIComponent(emailBody)}` : '';
        return `mailto:${emailTo}?${sub}${body}`;
      }
      case 'phone':
        return `tel:${phoneNumber.trim()}`;
    }
  };

  // Initialize and update QR code
  useEffect(() => {
    const payload = getPayload();

    const options = {
      width: qrSize,
      height: qrSize,
      data: payload,
      image: logoImage || undefined,
      dotsOptions: {
        color: dotsColor,
        type: dotType,
      },
      backgroundOptions: {
        color: bgColor,
      },
      cornersSquareOptions: {
        color: cornersColor,
        type: cornerSquareType,
      },
      cornersDotOptions: {
        color: cornersColor,
        type: cornerDotType,
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 6,
        imageSize: 0.35,
      },
      qrOptions: {
        errorCorrectionLevel: errorCorrection,
      },
    };

    if (!qrCodeInstance.current) {
      qrCodeInstance.current = new QRCodeStyling(options);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        qrCodeInstance.current.append(containerRef.current);
      }
    } else {
      qrCodeInstance.current.update(options);
    }
  }, [
    inputType,
    urlValue,
    textValue,
    wifiSsid,
    wifiPassword,
    wifiEncryption,
    wifiHidden,
    emailTo,
    emailSubject,
    emailBody,
    phoneNumber,
    dotType,
    cornerSquareType,
    cornerDotType,
    dotsColor,
    cornersColor,
    bgColor,
    logoImage,
    errorCorrection,
    qrSize,
  ]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setLogoImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const applyPreset = (preset: (typeof COLOR_PRESETS)[0]) => {
    setDotsColor(preset.dots);
    setBgColor(preset.bg);
    setCornersColor(preset.corners);
  };

  const handleDownload = (format: 'png' | 'svg') => {
    if (!qrCodeInstance.current) return;
    qrCodeInstance.current.download({
      name: 'webtools-qrcode',
      extension: format,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form & Styling Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Content Type Selector */}
          <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'url', label: 'URL', icon: LinkIcon },
                { id: 'text', label: 'Text', icon: FileText },
                { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'phone', label: 'Phone', icon: Phone },
              ].map(tab => {
                const Icon = tab.icon;
                const isSelected = inputType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setInputType(tab.id as InputType)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Body */}
            <div>
              {inputType === 'url' && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Website or Link URL
                  </label>
                  <input
                    type="url"
                    value={urlValue}
                    onChange={e => setUrlValue(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              )}

              {inputType === 'text' && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Plain Text Message
                  </label>
                  <textarea
                    rows={3}
                    value={textValue}
                    onChange={e => setTextValue(e.target.value)}
                    placeholder="Enter any note or plain text..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
              )}

              {inputType === 'wifi' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Network Name (SSID)
                    </label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={e => setWifiSsid(e.target.value)}
                      placeholder="e.g. Home_Network"
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={e => setWifiPassword(e.target.value)}
                      placeholder="Wi-Fi Password"
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Encryption:</span>
                      {(['WPA', 'WEP', 'nopass'] as const).map(enc => (
                        <button
                          key={enc}
                          type="button"
                          onClick={() => setWifiEncryption(enc)}
                          className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${
                            wifiEncryption === enc
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted/40 border-border text-muted-foreground'
                          }`}
                        >
                          {enc === 'nopass' ? 'None' : enc}
                        </button>
                      ))}
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                      <input
                        type="checkbox"
                        checked={wifiHidden}
                        onChange={e => setWifiHidden(e.target.checked)}
                        className="rounded accent-primary"
                      />
                      <span>Hidden SSID</span>
                    </label>
                  </div>
                </div>
              )}

              {inputType === 'email' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Recipient Email
                    </label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={e => setEmailTo(e.target.value)}
                      placeholder="hello@example.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={e => setEmailSubject(e.target.value)}
                        placeholder="Inquiry"
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Body Text
                      </label>
                      <input
                        type="text"
                        value={emailBody}
                        onChange={e => setEmailBody(e.target.value)}
                        placeholder="Hello..."
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {inputType === 'phone' && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Style Customization Card */}
          <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                <span>Visual Styling</span>
              </h4>

              {/* Color Presets */}
              <div className="flex items-center gap-1.5">
                {COLOR_PRESETS.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    title={p.name}
                    className="h-5 w-5 rounded-full border-2 border-border transition-transform hover:scale-125"
                    style={{ backgroundColor: p.dots }}
                  />
                ))}
              </div>
            </div>

            {/* Dot & Corner Styles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                  Pattern / Dots
                </label>
                <select
                  value={dotType}
                  onChange={e => setDotType(e.target.value as DotType)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
                >
                  <option value="rounded">Rounded</option>
                  <option value="dots">Dots</option>
                  <option value="classy">Classy</option>
                  <option value="classy-rounded">Classy Rounded</option>
                  <option value="square">Square</option>
                  <option value="extra-rounded">Extra Rounded</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                  Corner Square
                </label>
                <select
                  value={cornerSquareType}
                  onChange={e => setCornerSquareType(e.target.value as CornerSquareType)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
                >
                  <option value="extra-rounded">Extra Rounded</option>
                  <option value="square">Square</option>
                  <option value="dot">Dot</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                  Corner Center Dot
                </label>
                <select
                  value={cornerDotType}
                  onChange={e => setCornerDotType(e.target.value as CornerDotType)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
                >
                  <option value="dot">Dot</option>
                  <option value="square">Square</option>
                </select>
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <span className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Dots Color
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={dotsColor}
                    onChange={e => setDotsColor(e.target.value)}
                    className="h-7 w-9 rounded cursor-pointer border border-border"
                  />
                  <span className="text-[10px] font-mono text-muted-foreground">{dotsColor}</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Corner Color
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={cornersColor}
                    onChange={e => setCornersColor(e.target.value)}
                    className="h-7 w-9 rounded cursor-pointer border border-border"
                  />
                  <span className="text-[10px] font-mono text-muted-foreground">{cornersColor}</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Background
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    className="h-7 w-9 rounded cursor-pointer border border-border"
                  />
                  <span className="text-[10px] font-mono text-muted-foreground">{bgColor}</span>
                </div>
              </div>
            </div>

            {/* Logo Embed Option */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Center Logo:</span>
                {logoImage ? (
                  <span className="text-xs text-emerald-600 font-medium">Custom logo embedded</span>
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {logoImage && (
                  <button
                    type="button"
                    onClick={() => setLogoImage(null)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                )}
                <label className="cursor-pointer px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground">
                  <span>Upload Logo</span>
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Resolution & Error Correction */}
            <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Resolution: {qrSize}×{qrSize}px
                </label>
                <input
                  type="range"
                  min="200"
                  max="600"
                  step="20"
                  value={qrSize}
                  onChange={e => setQrSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Error Correction
                </label>
                <select
                  value={errorCorrection}
                  onChange={e => setErrorCorrection(e.target.value as ErrorCorrectionLevel)}
                  className="w-full px-2.5 py-1 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none"
                >
                  <option value="L">L - Low (7%)</option>
                  <option value="M">M - Medium (15%)</option>
                  <option value="Q">Q - High (25%)</option>
                  <option value="H">H - Maximum (30%)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Live Preview & Download (5 cols) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-sm flex flex-col items-center justify-center space-y-5">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Live Preview</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  setDotType('rounded');
                  setCornerSquareType('extra-rounded');
                  setCornerDotType('dot');
                  setDotsColor('#0f172a');
                  setCornersColor('#0f172a');
                  setBgColor('#ffffff');
                  setLogoImage(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                title="Reset to default style"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* QR Rendering Canvas Mount */}
            <div
              className="p-3 rounded-2xl border border-border/60 shadow-inner flex items-center justify-center transition-all overflow-hidden"
              style={{ backgroundColor: bgColor }}
            >
              <div ref={containerRef} className="flex items-center justify-center" />
            </div>

            {/* Download Buttons */}
            <div className="w-full space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload('png')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload('svg')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted font-semibold text-xs text-foreground transition-all active:scale-95"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download SVG</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 pt-1">
                <span>Error Correction: {errorCorrection}</span>
                <span>100% Client-side Vector / PNG</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
