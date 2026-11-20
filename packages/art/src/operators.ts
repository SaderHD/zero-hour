import {
  type BufferGeometry,
  Color,
  Euler,
  Float32BufferAttribute,
  Matrix4,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { color, type PaletteName } from '../palette';

export type FaceColor = (faceIndex: number) => PaletteName;

function copyAsNonIndexed(geometry: BufferGeometry): BufferGeometry {
  const copy = geometry.clone();
  if (copy.index === null) {
    return copy;
  }

  const nonIndexed = copy.toNonIndexed();
  copy.dispose();
  return nonIndexed;
}

function transform(geometry: BufferGeometry, matrix: Matrix4): BufferGeometry {
  return copyAsNonIndexed(geometry).applyMatrix4(matrix);
}

export function translate(
  geometry: BufferGeometry,
  x: number,
  y: number,
  z: number,
): BufferGeometry {
  return copyAsNonIndexed(geometry).translate(x, y, z);
}

export function rotate(
  geometry: BufferGeometry,
  x: number,
  y: number,
  z: number,
): BufferGeometry {
  const rotation = new Matrix4().makeRotationFromEuler(new Euler(x, y, z));
  return transform(geometry, rotation);
}

export function scale(
  geometry: BufferGeometry,
  x: number,
  y: number,
  z: number,
): BufferGeometry {
  return copyAsNonIndexed(geometry).scale(x, y, z);
}

export function merge(geometries: readonly BufferGeometry[]): BufferGeometry {
  if (geometries.length === 0) {
    throw new Error('merge requires at least one geometry.');
  }

  const copies = geometries.map(copyAsNonIndexed);
  try {
    const merged = mergeGeometries(copies, false);
    if (merged === null) {
      throw new Error('merge requires geometries with matching attributes.');
    }
    return merged;
  } finally {
    for (const copy of copies) {
      copy.dispose();
    }
  }
}

export function mirrorX(geometry: BufferGeometry): BufferGeometry {
  const mirrored = transform(geometry, new Matrix4().makeScale(-1, 1, 1));
  const position = mirrored.getAttribute('position');

  for (const attribute of Object.values(mirrored.attributes)) {
    for (let index = 0; index < position.count; index += 3) {
      for (let component = 0; component < attribute.itemSize; component += 1) {
        const second = attribute.getComponent(index + 1, component);
        attribute.setComponent(
          index + 1,
          component,
          attribute.getComponent(index + 2, component),
        );
        attribute.setComponent(index + 2, component, second);
      }
    }
    attribute.needsUpdate = true;
  }

  mirrored.computeVertexNormals();
  return mirrored;
}

export function colorize(
  geometry: BufferGeometry,
  paletteName: PaletteName | FaceColor,
): BufferGeometry {
  const colored = copyAsNonIndexed(geometry);
  const position = colored.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  const vertexColor = new Color();

  for (let index = 0; index < position.count; index += 3) {
    const name =
      typeof paletteName === 'function' ? paletteName(index / 3) : paletteName;
    vertexColor.set(color(name));
    for (let corner = 0; corner < 3; corner += 1) {
      const offset = (index + corner) * 3;
      colors[offset] = vertexColor.r;
      colors[offset + 1] = vertexColor.g;
      colors[offset + 2] = vertexColor.b;
    }
  }

  colored.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return colored;
}

function coordinateNoise(
  x: number,
  y: number,
  z: number,
  seed: number,
  channel: number,
): number {
  let hash =
    Math.trunc(seed) ^
    Math.imul(x, 0x8da6b343) ^
    Math.imul(y, 0xd8163841) ^
    Math.imul(z, 0xcb1ab31f) ^
    Math.imul(channel + 1, 0x165667b1);
  hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
  hash = Math.imul(hash ^ (hash >>> 12), 0x297a2d39);
  hash ^= hash >>> 15;
  return ((hash >>> 0) / 0xffffffff) * 2 - 1;
}

export function jitter(
  geometry: BufferGeometry,
  amount: number,
  seed = 0,
): BufferGeometry {
  const jittered = copyAsNonIndexed(geometry);
  const position = jittered.getAttribute('position');
  const strength = Math.abs(amount);

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const quantizedX = Math.round(x * 1_000_000);
    const quantizedY = Math.round(y * 1_000_000);
    const quantizedZ = Math.round(z * 1_000_000);
    position.setXYZ(
      index,
      x +
        coordinateNoise(quantizedX, quantizedY, quantizedZ, seed, 0) * strength,
      y +
        coordinateNoise(quantizedX, quantizedY, quantizedZ, seed, 1) * strength,
      z +
        coordinateNoise(quantizedX, quantizedY, quantizedZ, seed, 2) * strength,
    );
  }

  position.needsUpdate = true;
  jittered.computeVertexNormals();
  jittered.boundingBox = null;
  jittered.boundingSphere = null;
  return jittered;
}
