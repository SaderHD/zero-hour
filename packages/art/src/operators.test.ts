import { Color, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { color } from '../palette';
import {
  colorize,
  emissive,
  jitter,
  merge,
  mirrorX,
  rotate,
  scale,
  translate,
} from './operators';
import { box, wedge } from './primitives';

function positions(geometry: ReturnType<typeof box>): number[] {
  return [...geometry.getAttribute('position').array];
}

function expectFlatNormals(geometry: ReturnType<typeof box>): void {
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const faceNormal = new Vector3();
  const actualNormal = new Vector3();

  for (let index = 0; index < position.count; index += 3) {
    a.fromBufferAttribute(position, index);
    b.fromBufferAttribute(position, index + 1);
    c.fromBufferAttribute(position, index + 2);
    faceNormal.crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
    for (let corner = 0; corner < 3; corner += 1) {
      actualNormal.fromBufferAttribute(normal, index + corner);
      expect(actualNormal.distanceTo(faceNormal)).toBeCloseTo(0, 5);
    }
  }
}

describe('geometry operators', () => {
  it('translates, rotates and scales without mutating the source', () => {
    const source = box();
    const original = positions(source);
    const moved = translate(source, 2, 3, 4);
    moved.computeBoundingBox();

    expect(positions(source)).toEqual(original);
    expect(moved.boundingBox?.min.toArray()).toEqual([1.5, 2.5, 3.5]);
    expect(moved.boundingBox?.max.toArray()).toEqual([2.5, 3.5, 4.5]);

    const rotated = rotate(
      box({ width: 2, height: 4, depth: 6 }),
      0,
      0,
      Math.PI / 2,
    );
    rotated.computeBoundingBox();
    expect(rotated.boundingBox?.min.x).toBeCloseTo(-2);
    expect(rotated.boundingBox?.max.x).toBeCloseTo(2);
    expect(rotated.boundingBox?.min.y).toBeCloseTo(-1);
    expect(rotated.boundingBox?.max.y).toBeCloseTo(1);
    expect(rotated.boundingBox?.min.z).toBeCloseTo(-3);
    expect(rotated.boundingBox?.max.z).toBeCloseTo(3);

    const sized = scale(source, 2, 3, 4);
    sized.computeBoundingBox();
    expect(sized.boundingBox?.min.toArray()).toEqual([-1, -1.5, -2]);
    expect(sized.boundingBox?.max.toArray()).toEqual([1, 1.5, 2]);
  });

  it('merges boxes into one non-indexed geometry without groups', () => {
    const first = translate(box({ color: 'wood1' }), -1, 0, 0);
    const second = translate(box({ color: 'wood3' }), 1, 0, 0);
    const merged = merge([first, second]);

    expect(merged.index).toBeNull();
    expect(merged.groups).toHaveLength(0);
    expect(merged.getAttribute('position').count).toBe(72);
    expect(merged.getAttribute('color').count).toBe(72);
    expect(positions(first)).toHaveLength(108);
  });

  it('mirrors positions while preserving outward flat normals and colors', () => {
    const source = colorize(wedge({ color: 'rust1' }), 'gold');
    const mirrored = mirrorX(source);
    const sourcePosition = source.getAttribute('position');
    const mirroredPosition = mirrored.getAttribute('position');

    for (let index = 0; index < sourcePosition.count; index += 3) {
      const corners = [0, 2, 1];
      for (let corner = 0; corner < 3; corner += 1) {
        const mirroredIndex = index + corners[corner];
        expect(mirroredPosition.getX(index + corner)).toBeCloseTo(
          -sourcePosition.getX(mirroredIndex),
        );
        expect(mirroredPosition.getY(index + corner)).toBeCloseTo(
          sourcePosition.getY(mirroredIndex),
        );
        expect(mirroredPosition.getZ(index + corner)).toBeCloseTo(
          sourcePosition.getZ(mirroredIndex),
        );
      }
    }
    expectFlatNormals(mirrored);
    expect([...mirrored.getAttribute('color').array]).toEqual([
      ...source.getAttribute('color').array,
    ]);
  });

  it('marks a copy with an emissive mask without mutating the source', () => {
    const source = box();
    const masked = emissive(source, 0.75);
    const sourceMask = source.getAttribute('emissiveMask');
    const copiedMask = masked.getAttribute('emissiveMask');

    expect(masked).not.toBe(source);
    expect(copiedMask.count).toBe(sourceMask.count);
    for (let index = 0; index < sourceMask.count; index += 1) {
      expect(sourceMask.getX(index)).toBe(0);
      expect(copiedMask.getX(index)).toBe(0.75);
    }
  });

  it('colorizes the whole geometry or individual faces', () => {
    const source = box();
    const gold = new Color(color('gold'));
    const rust = new Color(color('rust1'));
    const colored = colorize(source, (faceIndex) =>
      faceIndex % 2 === 0 ? 'gold' : 'rust1',
    );
    const vertexColor = colored.getAttribute('color');

    for (let index = 0; index < vertexColor.count; index += 3) {
      const expected = index % 6 === 0 ? gold : rust;
      for (let corner = 0; corner < 3; corner += 1) {
        expect(vertexColor.getX(index + corner)).toBeCloseTo(expected.r, 6);
        expect(vertexColor.getY(index + corner)).toBeCloseTo(expected.g, 6);
        expect(vertexColor.getZ(index + corner)).toBeCloseTo(expected.b, 6);
      }
    }

    const uniform = colorize(source, 'gold');
    expect(uniform.getAttribute('color').getX(0)).toBeCloseTo(gold.r, 6);
    expect(source.getAttribute('color').getX(0)).not.toBeCloseTo(gold.r, 6);
  });

  it('jitters deterministically within the requested amount', () => {
    const source = box();
    const original = positions(source);
    const first = jitter(source, 0.05, 42);
    const second = jitter(source, 0.05, 42);
    const different = jitter(source, 0.05, 43);

    expect(positions(first)).toEqual(positions(second));
    expect(positions(first)).not.toEqual(positions(different));
    expect(positions(source)).toEqual(original);

    const sourcePosition = source.getAttribute('position');
    const jitteredPosition = first.getAttribute('position');
    const offsets = new Map<string, string>();
    for (let index = 0; index < sourcePosition.count; index += 1) {
      const sourceVertex = [
        sourcePosition.getX(index),
        sourcePosition.getY(index),
        sourcePosition.getZ(index),
      ];
      const offset = sourceVertex.map((value, axis) => {
        const delta = jitteredPosition.getComponent(index, axis) - value;
        expect(Math.abs(delta)).toBeLessThanOrEqual(0.05);
        return delta;
      });
      const key = sourceVertex.join(',');
      const value = offset.join(',');
      if (offsets.has(key)) {
        expect(value).toBe(offsets.get(key));
      }
      offsets.set(key, value);
    }
    expectFlatNormals(first);
  });

  it('rejects an empty merge', () => {
    expect(() => merge([])).toThrow('merge requires at least one geometry.');
  });
});
