import { downloadFile } from './pdfUtils';

/**
 * Safely encode UTF-8 string to Base64 without Latin1 btoa exceptions
 */
export function utf8ToBase64(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Safely decode Base64 string to UTF-8
 */
export function base64ToUtf8(b64: string): string {
  // Clean up whitespace or data URLs
  const cleanB64 = b64.replace(/^data:.*?;base64,/, '').trim();
  const binary = atob(cleanB64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}

/**
 * Convert any File into a Base64 data URL
 */
export function fileToBase64DataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file into Base64'));
    reader.readAsDataURL(file);
  });
}

/**
 * Download arbitrary text or code as a file
 */
export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  downloadFile(blob, filename, mimeType);
}

/**
 * Convert a JavaScript object/value into clean TypeScript definitions
 */
export function jsonToTypeScript(
  input: any,
  rootName = 'RootObject',
  style: 'interface' | 'type' = 'interface'
): string {
  const interfaces: Record<string, string> = {};

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function getType(val: any, propName: string): string {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';

    const t = typeof val;
    if (t === 'string' || t === 'number' || t === 'boolean') {
      return t;
    }

    if (Array.isArray(val)) {
      if (val.length === 0) return 'any[]';
      // Get unique types of array elements
      const elementTypes = Array.from(
        new Set(val.slice(0, 10).map((el, i) => getType(el, `${propName}Item${i}`)))
      );
      if (elementTypes.length === 1) {
        return `${elementTypes[0]}[]`;
      }
      return `(${elementTypes.join(' | ')})[]`;
    }

    if (t === 'object') {
      const typeName = capitalize(propName);
      buildInterface(val, typeName);
      return typeName;
    }

    return 'any';
  }

  function buildInterface(obj: Record<string, any>, name: string) {
    if (interfaces[name]) return; // Already generated

    const lines: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      const propType = getType(val, key);
      const isIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
      const formattedKey = isIdentifier ? key : JSON.stringify(key);
      lines.push(`  ${formattedKey}: ${propType};`);
    }

    if (style === 'interface') {
      interfaces[name] = `export interface ${name} {\n${lines.join('\n')}\n}`;
    } else {
      interfaces[name] = `export type ${name} = {\n${lines.join('\n')}\n};`;
    }
  }

  if (Array.isArray(input)) {
    if (input.length > 0 && typeof input[0] === 'object' && input[0] !== null) {
      buildInterface(input[0], `${rootName}Item`);
      if (style === 'interface') {
        return `export type ${rootName} = ${rootName}Item[];\n\n${Object.values(interfaces).join('\n\n')}`;
      } else {
        return `export type ${rootName} = ${rootName}Item[];\n\n${Object.values(interfaces).join('\n\n')}`;
      }
    } else {
      const elType = input.length > 0 ? typeof input[0] : 'any';
      return `export type ${rootName} = ${elType}[];`;
    }
  }

  if (typeof input === 'object' && input !== null) {
    buildInterface(input, rootName);
    // Put root interface first, then sub-interfaces
    const rootDef = interfaces[rootName];
    const otherDefs = Object.entries(interfaces)
      .filter(([k]) => k !== rootName)
      .map(([, v]) => v);

    return [rootDef, ...otherDefs].join('\n\n');
  }

  return `export type ${rootName} = ${typeof input};`;
}
