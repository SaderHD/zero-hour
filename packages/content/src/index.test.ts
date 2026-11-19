import { describe, expect, it } from 'vitest';
import { contentPackage } from './index';

describe('content package', () => {
  it('exposes its workspace identity', () => {
    expect(contentPackage).toBe('@zero-hour/content');
  });
});
