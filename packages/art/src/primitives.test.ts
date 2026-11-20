import { Color, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { color, type PaletteName } from '../palette';
import { box, cone, cylinder, icosphere, wedge } from './primitives';

const cases = [
  [
    'box',
    () => box({ width: 2, height: 3, depth: 4, color: 'wood2' }),
    12,
    'wood2',
  ],
  [
    'wedge',
    () => wedge({ width: 2, height: 3, depth: 4, color: 'rust1' }),
    8,
    'rust1',
  ],
  ['cylinder', () => cylinder({ segments: 6, color: 'metal2' }), 24, 'metal2'],
  ['cone', () => cone({ segments: 6, color: 'gold' }), 12, 'gold'],
  ['icosphere lod 0', () => icosphere({ lod: 0, color: 'frost' }), 20, 'frost'],
  ['icosphere lod 1', () => icosphere({ lod: 1, color: 'ion' }), 80, 'ion'],
] as const;

describe('primitives', () => {
  it.each(cases)(
    '%s is non-indexed with flat normals and palette vertex colors',
    (_name, createGeometry, triangleCount, paletteName) => {
      const geometry = createGeometry();
      const position = geometry.getAttribute('position');
      const normal = geometry.getAttribute('normal');
      const vertexColor = geometry.getAttribute('color');
      const emissiveMask = geometry.getAttribute('emissiveMask');

      expect(geometry.index).toBeNull();
      expect(position.count).toBe(triangleCount * 3);
      expect(normal.count).toBe(position.count);
      expect(vertexColor.count).toBe(position.count);
      expect(emissiveMask.count).toBe(position.count);

      const a = new Vector3();
      const b = new Vector3();
      const c = new Vector3();
      const edgeA = new Vector3();
      const edgeB = new Vector3();
      const faceNormal = new Vector3();
      const actualNormal = new Vector3();
      for (let index = 0; index < position.count; index += 3) {
        a.fromBufferAttribute(position, index);
        b.fromBufferAttribute(position, index + 1);
        c.fromBufferAttribute(position, index + 2);
        edgeA.subVectors(b, a);
        edgeB.subVectors(c, a);
        faceNormal.crossVectors(edgeA, edgeB).normalize();

        for (let corner = 0; corner < 3; corner += 1) {
          actualNormal.fromBufferAttribute(normal, index + corner);
          expect(actualNormal.distanceTo(faceNormal)).toBeCloseTo(0, 5);
        }
      }

      const expectedColor = new Color(color(paletteName as PaletteName));
      for (let index = 0; index < vertexColor.count; index += 1) {
        expect(vertexColor.getX(index)).toBeCloseTo(expectedColor.r, 6);
        expect(vertexColor.getY(index)).toBeCloseTo(expectedColor.g, 6);
        expect(vertexColor.getZ(index)).toBeCloseTo(expectedColor.b, 6);
        expect(emissiveMask.getX(index)).toBe(0);
      }

      geometry.dispose();
    },
  );
});
