import jsQR from 'jsqr';

export type QrPayloadType =
  | 'url'
  | 'wifi'
  | 'email'
  | 'phone'
  | 'sms'
  | 'vcard'
  | 'geo'
  | 'json'
  | 'text';

export interface WifiDetails {
  ssid: string;
  password?: string;
  encryption?: string;
  hidden?: boolean;
}

export interface EmailDetails {
  to: string;
  subject?: string;
  body?: string;
}

export interface PhoneDetails {
  number: string;
}

export interface SmsDetails {
  number: string;
  message?: string;
}

export interface VCardDetails {
  fullName?: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
  url?: string;
  rawText: string;
}

export interface GeoDetails {
  latitude: number;
  longitude: number;
  mapsUrl: string;
}

export interface ParsedQrResult {
  type: QrPayloadType;
  raw: string;
  wifi?: WifiDetails;
  email?: EmailDetails;
  phone?: PhoneDetails;
  sms?: SmsDetails;
  vcard?: VCardDetails;
  geo?: GeoDetails;
  jsonFormatted?: string;
  url?: string;
}

/**
 * Parse a raw QR code string into typed structured details
 */
export function parseQrPayload(raw: string): ParsedQrResult {
  const trimmed = raw.trim();

  // 1. URL
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      type: 'url',
      raw,
      url: trimmed,
    };
  }

  // 2. Wi-Fi: WIFI:S:<SSID>;T:<TYPE>;P:<PASS>;H:<HIDDEN>;;
  if (/^WIFI:/i.test(trimmed)) {
    const wifi: WifiDetails = { ssid: '' };
    const ssidMatch = trimmed.match(/S:([^;]+)/i);
    if (ssidMatch) wifi.ssid = ssidMatch[1];

    const passMatch = trimmed.match(/P:([^;]+)/i);
    if (passMatch) wifi.password = passMatch[1];

    const typeMatch = trimmed.match(/T:([^;]+)/i);
    if (typeMatch) wifi.encryption = typeMatch[1];

    const hiddenMatch = trimmed.match(/H:(true|false)/i);
    if (hiddenMatch) wifi.hidden = hiddenMatch[1].toLowerCase() === 'true';

    return {
      type: 'wifi',
      raw,
      wifi,
    };
  }

  // 3. Email: mailto: or MATMSG:
  if (/^mailto:/i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const to = url.pathname;
      const subject = url.searchParams.get('subject') || undefined;
      const body = url.searchParams.get('body') || undefined;
      return {
        type: 'email',
        raw,
        email: { to, subject, body },
      };
    } catch {
      const emailPart = trimmed.replace(/^mailto:/i, '');
      return {
        type: 'email',
        raw,
        email: { to: emailPart },
      };
    }
  }

  if (/^MATMSG:/i.test(trimmed)) {
    const toMatch = trimmed.match(/TO:([^;]+)/i);
    const subMatch = trimmed.match(/SUB:([^;]+)/i);
    const bodyMatch = trimmed.match(/BODY:([^;]+)/i);
    return {
      type: 'email',
      raw,
      email: {
        to: toMatch ? toMatch[1] : '',
        subject: subMatch ? subMatch[1] : undefined,
        body: bodyMatch ? bodyMatch[1] : undefined,
      },
    };
  }

  // 4. Phone: tel:
  if (/^tel:/i.test(trimmed)) {
    return {
      type: 'phone',
      raw,
      phone: { number: trimmed.replace(/^tel:/i, '') },
    };
  }

  // 5. SMS: sms: or smsto:
  if (/^(sms|smsto):/i.test(trimmed)) {
    const cleaned = trimmed.replace(/^(sms|smsto):/i, '');
    const parts = cleaned.split(/[:?&]/);
    const number = parts[0] || '';
    const bodyMatch = trimmed.match(/[?&]body=([^&]+)/i);
    const message = bodyMatch ? decodeURIComponent(bodyMatch[1]) : parts.slice(1).join(' ');
    return {
      type: 'sms',
      raw,
      sms: { number, message: message || undefined },
    };
  }

  // 6. vCard
  if (/^BEGIN:VCARD/i.test(trimmed)) {
    const fnMatch = trimmed.match(/FN:(.+)/i);
    const nMatch = trimmed.match(/N:(.+)/i);
    const orgMatch = trimmed.match(/ORG:(.+)/i);
    const titleMatch = trimmed.match(/TITLE:(.+)/i);
    const telMatch = trimmed.match(/TEL.*?:(.+)/i);
    const emailMatch = trimmed.match(/EMAIL.*?:(.+)/i);
    const urlMatch = trimmed.match(/URL.*?:(.+)/i);

    const fullName = fnMatch ? fnMatch[1].trim() : nMatch ? nMatch[1].replace(/;/g, ' ').trim() : undefined;

    return {
      type: 'vcard',
      raw,
      vcard: {
        fullName,
        organization: orgMatch ? orgMatch[1].trim() : undefined,
        title: titleMatch ? titleMatch[1].trim() : undefined,
        phone: telMatch ? telMatch[1].trim() : undefined,
        email: emailMatch ? emailMatch[1].trim() : undefined,
        url: urlMatch ? urlMatch[1].trim() : undefined,
        rawText: trimmed,
      },
    };
  }

  // 7. Geo: geo:lat,lng
  if (/^geo:([-\d.]+),([-\d.]+)/i.test(trimmed)) {
    const match = trimmed.match(/^geo:([-\d.]+),([-\d.]+)/i);
    if (match) {
      const latitude = parseFloat(match[1]);
      const longitude = parseFloat(match[2]);
      return {
        type: 'geo',
        raw,
        geo: {
          latitude,
          longitude,
          mapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        },
      };
    }
  }

  // 8. JSON check
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        type: 'json',
        raw,
        jsonFormatted: JSON.stringify(parsed, null, 2),
      };
    } catch {
      // Not valid JSON, fallback to plain text
    }
  }

  // 9. Plain text fallback
  return {
    type: 'text',
    raw,
  };
}

export interface DecodedResult {
  data: string;
  version?: number;
  location?: {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
  };
}

/**
 * Decode QR code from ImageData using jsQR with multi-pass fallbacks
 */
export function decodeQrFromImageData(imageData: ImageData): DecodedResult | null {
  // Pass 1: standard attemptBoth
  const res = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });
  if (res) {
    return {
      data: res.data,
      version: res.version,
      location: res.location,
    };
  }

  // Pass 2: High-contrast binarization
  const binarized = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < binarized.length; i += 4) {
    const avg = (binarized[i] + binarized[i + 1] + binarized[i + 2]) / 3;
    const v = avg < 128 ? 0 : 255;
    binarized[i] = v;
    binarized[i + 1] = v;
    binarized[i + 2] = v;
  }

  const binarizedRes = jsQR(binarized, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });
  if (binarizedRes) {
    return {
      data: binarizedRes.data,
      version: binarizedRes.version,
      location: binarizedRes.location,
    };
  }

  return null;
}

/**
 * Read image data from an HTML image element or Canvas, testing multiple scales if large
 */
export async function decodeQrFromImage(img: HTMLImageElement): Promise<DecodedResult | null> {
  // Check if browser native BarcodeDetector is available
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const barcodes = await barcodeDetector.detect(img);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        const b = barcodes[0];
        let location = undefined;
        if (b.cornerPoints && b.cornerPoints.length >= 4) {
          location = {
            topLeftCorner: b.cornerPoints[0],
            topRightCorner: b.cornerPoints[1],
            bottomRightCorner: b.cornerPoints[2],
            bottomLeftCorner: b.cornerPoints[3],
          };
        }
        return {
          data: b.rawValue,
          location,
        };
      }
    } catch {
      // Fallback to jsQR
    }
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;

  // Scale passes to try: 1.0, 0.75, 0.5 (for very high-res camera photos)
  const scales = [1.0];
  const maxDim = Math.max(originalWidth, originalHeight);
  if (maxDim > 1200) {
    scales.push(1000 / maxDim);
    scales.push(600 / maxDim);
  }

  for (const scale of scales) {
    const w = Math.round(originalWidth * scale);
    const h = Math.round(originalHeight * scale);
    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const result = decodeQrFromImageData(imageData);
    if (result) {
      // Adjust coordinates back to original scale if needed
      if (scale !== 1.0 && result.location) {
        const inv = 1 / scale;
        return {
          ...result,
          location: {
            topLeftCorner: { x: result.location.topLeftCorner.x * inv, y: result.location.topLeftCorner.y * inv },
            topRightCorner: { x: result.location.topRightCorner.x * inv, y: result.location.topRightCorner.y * inv },
            bottomRightCorner: { x: result.location.bottomRightCorner.x * inv, y: result.location.bottomRightCorner.y * inv },
            bottomLeftCorner: { x: result.location.bottomLeftCorner.x * inv, y: result.location.bottomLeftCorner.y * inv },
          },
        };
      }
      return result;
    }
  }

  return null;
}
