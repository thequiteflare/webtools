import { describe, it, expect } from 'vitest';
import YAML from 'yaml';
import { utf8ToBase64, base64ToUtf8, jsonToTypeScript } from '../../../lib/devUtils';

describe('Developer Utilities Test Suite', () => {
  it('should accurately convert JSON to YAML and back', () => {
    const original = {
      project: 'Webtools',
      private: true,
      tags: ['pdf', 'images', 'dev'],
      stats: { stars: 100, active: true },
    };

    const yamlStr = YAML.stringify(original);
    expect(yamlStr).toContain('project: Webtools');
    expect(yamlStr).toContain('private: true');

    const parsedBack = YAML.parse(yamlStr);
    expect(parsedBack).toEqual(original);
  });

  it('should encode and decode UTF-8 text with emojis safely', () => {
    const message = 'Webtools 🛠️ 100% Private & Open Source! 🌟 üöä';
    const encoded = utf8ToBase64(message);
    expect(encoded).toBeDefined();

    const decoded = base64ToUtf8(encoded);
    expect(decoded).toBe(message);
  });

  it('should generate valid TypeScript interfaces from JSON', () => {
    const data = {
      id: 123,
      username: 'johndoe',
      roles: ['admin', 'editor'],
      settings: {
        darkMode: true,
        timeout: 30,
      },
    };

    const ts = jsonToTypeScript(data, 'User', 'interface');
    expect(ts).toContain('export interface User {');
    expect(ts).toContain('id: number;');
    expect(ts).toContain('username: string;');
    expect(ts).toContain('roles: string[];');
    expect(ts).toContain('settings: Settings;');
    expect(ts).toContain('export interface Settings {');
    expect(ts).toContain('darkMode: boolean;');
  });

  it('should generate valid TypeScript types from array JSON', () => {
    const data = [
      { name: 'Apple', price: 1.2 },
      { name: 'Banana', price: 0.8 },
    ];

    const ts = jsonToTypeScript(data, 'FruitList', 'type');
    expect(ts).toContain('export type FruitList = FruitListItem[];');
    expect(ts).toContain('export type FruitListItem = {');
    expect(ts).toContain('name: string;');
    expect(ts).toContain('price: number;');
  });
});
