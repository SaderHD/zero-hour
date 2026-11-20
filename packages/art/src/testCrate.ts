import type { BufferGeometry } from 'three';
import type { PaletteName } from '../palette';
import {
  colorize,
  jitter,
  merge,
  mirrorX,
  rotate,
  scale,
  translate,
} from './operators';
import { box } from './primitives';

function plank(
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
  paletteName: PaletteName,
): BufferGeometry {
  const geometry = scale(box(), width, height, depth);
  return translate(colorize(geometry, paletteName), x, y, z);
}

export function testCrate(): BufferGeometry {
  const parts = [colorize(scale(box(), 1.4, 1.4, 1.4), 'wood2')];

  for (const x of [-0.73, 0.73]) {
    for (const z of [-0.73, 0.73]) {
      parts.push(plank(0.12, 1.54, 0.12, x, 0, z, 'wood1'));
    }
  }

  for (const z of [-0.73, 0.73]) {
    for (const y of [-0.57, 0.57]) {
      parts.push(plank(1.54, 0.14, 0.12, 0, y, z, 'wood3'));
    }

    const diagonal = rotate(
      plank(0.14, 1.75, 0.12, 0, 0, z, 'wood1'),
      0,
      0,
      -Math.PI / 4,
    );
    parts.push(diagonal, mirrorX(diagonal));
  }

  for (const y of [-0.73, 0.73]) {
    parts.push(plank(1.54, 0.12, 1.54, 0, y, 0, 'wood2'));
  }

  const geometry = jitter(merge(parts), 0.008, 1404);
  geometry.name = 'test-crate';
  return geometry;
}
