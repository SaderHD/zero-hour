import { Color } from 'three';
import { describe, expect, it } from 'vitest';
import { color } from '../palette';
import { testLamp } from './testLamp';

describe('test lamp', () => {
  it('merges a glowing bulb and matte post into one geometry', () => {
    const geometry = testLamp();
    const position = geometry.getAttribute('position');
    const vertexColor = geometry.getAttribute('color');
    const mask = geometry.getAttribute('emissiveMask');
    const ember = new Color(color('ember'));
    let glowingVertices = 0;
    let matteVertices = 0;

    expect(geometry.index).toBeNull();
    expect(geometry.groups).toHaveLength(0);
    expect(vertexColor.count).toBe(position.count);
    expect(mask.count).toBe(position.count);

    for (let index = 0; index < position.count; index += 1) {
      if (mask.getX(index) === 1) {
        glowingVertices += 1;
        expect(vertexColor.getX(index)).toBeCloseTo(ember.r, 6);
        expect(vertexColor.getY(index)).toBeCloseTo(ember.g, 6);
        expect(vertexColor.getZ(index)).toBeCloseTo(ember.b, 6);
      } else {
        expect(mask.getX(index)).toBe(0);
        matteVertices += 1;
      }
    }

    expect(glowingVertices).toBeGreaterThan(0);
    expect(matteVertices).toBeGreaterThan(0);
    geometry.dispose();
  });
});
