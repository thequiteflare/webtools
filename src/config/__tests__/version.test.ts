import { describe, it, expect } from 'vitest';
import { APP_VERSION } from '../version';
import packageJson from '../../../package.json';

describe('App Version', () => {
  it('should match package.json version', () => {
    expect(APP_VERSION).toBe(packageJson.version);
    expect(APP_VERSION).toBeTruthy();
  });
});
