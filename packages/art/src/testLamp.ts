import type { BufferGeometry } from 'three';
import { emissive, merge, translate } from './operators';
import { cone, cylinder, icosphere } from './primitives';

export function testLamp(): BufferGeometry {
  const parts = [
    translate(
      cylinder({ radius: 0.32, height: 0.16, segments: 8, color: 'metal0' }),
      0,
      -1.2,
      0,
    ),
    translate(
      cylinder({ radius: 0.08, height: 2.4, segments: 8, color: 'metal1' }),
      0,
      0,
      0,
    ),
    translate(
      emissive(icosphere({ radius: 0.24, lod: 1, color: 'ember' })),
      0,
      1.25,
      0,
    ),
    translate(
      cone({ radius: 0.42, height: 0.35, segments: 8, color: 'metal1' }),
      0,
      1.55,
      0,
    ),
  ];

  const geometry = merge(parts);
  geometry.name = 'test-lamp';
  return geometry;
}
