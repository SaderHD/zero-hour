import { describe, expect, it } from 'vitest';
import { testCrate } from './testCrate';

describe('test crate', () => {
  it('is one merged, non-indexed geometry made from boxes', () => {
    const geometry = testCrate();

    expect(geometry.index).toBeNull();
    expect(geometry.groups).toHaveLength(0);
    expect(geometry.getAttribute('position').count).toBe(15 * 12 * 3);
    expect(geometry.getAttribute('normal').count).toBe(15 * 12 * 3);
    expect(geometry.getAttribute('color').count).toBe(15 * 12 * 3);

    const again = testCrate();
    expect([...geometry.getAttribute('position').array]).toEqual([
      ...again.getAttribute('position').array,
    ]);
  });
});
