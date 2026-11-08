# Contributing to Webtools 🛠️

First off, thank you for considering contributing to Webtools! It is people like you that make Webtools a fantastic, private, and powerful suite of utilities for everyone.

Please take a moment to review this document to make the contribution process simple and effective.

---

## 🔒 The Core Privacy Rule

**Webtools is strictly 100% client-side.**
- **NO external server calls or backend processing**: All computation, file transformations, and parsing must happen purely in the user's browser.
- **NO tracking or telemetry**: Do not include Google Analytics, Mixpanel, Sentry, or third-party tracking scripts.
- **NO cloud storage**: Files must stay in memory, Blob URLs, or sandboxed IndexedDB.

Any Pull Request introducing external data transmission or server dependencies will be rejected.

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) `>= 18.0.0`
- [npm](https://www.npmjs.com/) `>= 9.0.0` (or `pnpm` / `yarn`)
- Git

### 2. Fork & Clone
```bash
git clone https://github.com/<your-username>/webtools.git
cd webtools
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧰 How to Add a New Utility

Adding a utility is straightforward thanks to the modular tool registry pattern:

### Step 1: Create Your Tool Component
Create a new component under the relevant category folder:
`src/tools/<category>/<ToolName>.tsx`

Example: `src/tools/dev/JwtDecoder.tsx`
```tsx
import { useState } from 'react';

export default function JwtDecoder() {
  const [jwt, setJwt] = useState('');
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tool UI */}
    </div>
  );
}
```

### Step 2: Register the Tool in `src/config/tools.ts`
Add your tool definition to the `TOOLS` array:

```ts
{
  id: 'dev-jwt-decoder',
  title: 'JWT Token Decoder',
  description: 'Decode and inspect JSON Web Tokens locally without sending secret data.',
  category: 'dev',
  iconName: 'Key', // Name from lucide-react
  keywords: ['jwt', 'token', 'decode', 'auth', 'bearer'],
  badge: 'new',
  component: lazy(() => import('../tools/dev/JwtDecoder')),
}
```

If you use a new icon, make sure it is added to the `ICONS` map in `src/components/shared/IconRenderer.tsx`.

### Step 3: Test and Build
Ensure your changes compile without TypeScript or bundle errors:
```bash
npm run build
```

---

## 🧪 Verification & Guidelines

Before opening a pull request, ensure:
1. **Type Safety**: `npm run build` passes with zero TypeScript warnings or errors.
2. **Responsive Design**: Verify your tool works on both desktop and mobile screen sizes.
3. **Accessibility**: Use accessible semantic HTML, keyboard navigation, and proper contrast ratios.
4. **Theme Support**: Ensure all text, backgrounds, and borders look great in both **Light** and **Dark** modes.

---

## 📝 Commit Convention

We follow conventional commit format:
- `feat:` A new feature or utility (e.g., `feat: add pdf page rotation tool`)
- `fix:` A bug fix (e.g., `fix: resolve canvas coordinate offset on mobile`)
- `docs:` Documentation changes (e.g., `docs: update tool list in README`)
- `style:` Formatting or UI styling polish
- `refactor:` Code refactoring without behavioral changes
- `chore:` Dependency updates or build tooling maintenance

---

## 🤝 Submitting a Pull Request

1. Create a feature branch:
   ```bash
   git checkout -b feat/my-new-utility
   ```
2. Commit your changes with a clear message:
   ```bash
   git commit -m "feat: add my new utility"
   ```
3. Push to your fork:
   ```bash
   git push origin feat/my-new-utility
   ```
4. Open a Pull Request on GitHub against the `main` branch.
5. Provide a summary of the utility, screenshots/GIFs, and note any testing done.

Thank you for helping keep Webtools fast, private, and open for everyone!
