# Webtools 🛠️

> **Fast, private, and 100% client-side web utilities.**
> Process PDFs, resize images, generate QR codes, convert formats, and more—completely in your browser, with zero backend servers.

---

## 🌟 The Vision

Every day, millions of people need to sign PDFs, merge documents, delete pages, resize images, or convert configuration formats. Yet, mainstream commercial solutions (such as Adobe Acrobat) are proprietary, subscription-gated, and frequently upload personal documents to remote servers for processing. Even when offline apps exist, users can rarely verify what telemetry or file data is collected.

**Webtools** is an open-source, private-by-design alternative:
- 🔒 **100% Client-Side & Private**: Files never leave your browser. Processing runs purely on-device via WebAssembly, Web Workers, and modern browser APIs.
- 📱 **Cross-Platform**: Operates identically on desktop, tablet, and mobile browsers.
- ⚡ **Offline First (PWA)**: Installable as a Progressive Web App, operational even with zero internet connectivity.
- 🧰 **All-in-One Utility Hub**: Comprehensive toolset spanning PDF manipulation, image processing, developer format conversions, and code generation.

---

## 🚀 Tool Suite

### 📄 PDF Utilities
- **Merge PDF**: Combine multiple PDF files into a single document with drag-and-drop page reordering.
- **Organize & Delete Pages**: Visual thumbnail grid to reorder, rotate, or delete specific pages.
- **Image to PDF**: Convert and arrange images (PNG, JPEG, WebP) into custom-sized PDF pages.
- **Visual PDF Signer**: Draw signatures, place image stamps, or add text onto PDF documents locally.

### 🖼️ Image Utilities
- **Image Resizer & Compressor**: Bulk resize by dimensions or percentage with real-time compression preview.
- **Format Converter**: Client-side conversion between PNG, JPEG, WebP, and AVIF.

### 💻 Developer Utilities
- **JSON ⟷ YAML Converter**: Bidirectional parsing with syntax highlighting and validation.
- **JSON to TypeScript**: Instant TypeScript interface and type generation from JSON/YAML payloads.
- **Base64 / URL Encoder & Decoder**: Safe string and binary encoding/decoding utilities.

### 📦 Generators
- **Custom QR Code Generator**: Generate styled QR codes with custom colors, dot styles, gradients, and embedded logos (exportable to PNG/SVG).

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components & Icons**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **PDF Engine**: [`pdf-lib`](https://pdf-lib.js.org/) & [`pdfjs-dist`](https://mozilla.github.io/pdf.js/)
- **Code Editor**: [CodeMirror 6](https://codemirror.net/)
- **QR Engine**: [`qr-code-styling`](https://qr-code-styling.com/)
- **Offline / PWA**: [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/)

---

## 🏁 Getting Started

### Prerequisites
- Node.js `>= 18.0.0`
- npm `>= 9.0.0` (or pnpm / yarn)

### Installation

```bash
# Clone the repository
git clone https://github.com/thequiteflare/webtools.git
cd webtools

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Building for Production

```bash
npm run build
npm run preview
```

The resulting `dist/` directory is purely static HTML/JS/CSS assets and can be hosted anywhere (GitHub Pages, Cloudflare Pages, Vercel, Netlify, or local static servers).

---

## 🛡️ Privacy Guarantee

Webtools does not collect telemetry, track usage, or connect to external backend APIs. All computational operations execute inside your browser's sandboxed JavaScript runtime. You can disconnect your network cable or turn on Airplane Mode and the app will continue to function seamlessly.

---

## 📜 License

[MIT](LICENSE) © 2026 Webtools Contributors
