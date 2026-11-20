import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
} from 'three';
import { color, type PaletteName } from '../palette';

export interface BoxOptions {
  width?: number;
  height?: number;
  depth?: number;
  color?: PaletteName;
}

export interface RadialPrimitiveOptions {
  radius?: number;
  height?: number;
  segments?: number;
  color?: PaletteName;
}

export interface IcosphereOptions {
  radius?: number;
  lod?: 0 | 1;
  color?: PaletteName;
}

type Vertex = readonly [number, number, number];

function finishGeometry(
  source: BufferGeometry,
  paletteName: PaletteName,
): BufferGeometry {
  const geometry = source.index === null ? source : source.toNonIndexed();
  if (geometry !== source) {
    source.dispose();
  }

  geometry.deleteAttribute('uv');
  geometry.computeVertexNormals();

  const position = geometry.getAttribute('position');
  const vertexColor = new Color(color(paletteName));
  const colors = new Float32Array(position.count * 3);
  for (let index = 0; index < position.count; index += 1) {
    const offset = index * 3;
    colors[offset] = vertexColor.r;
    colors[offset + 1] = vertexColor.g;
    colors[offset + 2] = vertexColor.b;
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

  return geometry;
}

export function box({
  width = 1,
  height = 1,
  depth = 1,
  color: paletteName = 'concrete2',
}: BoxOptions = {}): BufferGeometry {
  return finishGeometry(new BoxGeometry(width, height, depth), paletteName);
}

export function wedge({
  width = 1,
  height = 1,
  depth = 1,
  color: paletteName = 'concrete2',
}: BoxOptions = {}): BufferGeometry {
  const x = width / 2;
  const y = height / 2;
  const z = depth / 2;
  const backLeftBottom: Vertex = [-x, -y, -z];
  const backRightBottom: Vertex = [x, -y, -z];
  const backLeftTop: Vertex = [-x, y, -z];
  const backRightTop: Vertex = [x, y, -z];
  const frontLeftBottom: Vertex = [-x, -y, z];
  const frontRightBottom: Vertex = [x, -y, z];
  const triangles: Vertex[] = [
    backLeftBottom,
    backLeftTop,
    backRightTop,
    backLeftBottom,
    backRightTop,
    backRightBottom,
    backLeftBottom,
    backRightBottom,
    frontRightBottom,
    backLeftBottom,
    frontRightBottom,
    frontLeftBottom,
    backLeftTop,
    frontLeftBottom,
    frontRightBottom,
    backLeftTop,
    frontRightBottom,
    backRightTop,
    backLeftBottom,
    frontLeftBottom,
    backLeftTop,
    backRightBottom,
    backRightTop,
    frontRightBottom,
  ];
  const geometry = new BufferGeometry().setAttribute(
    'position',
    new Float32BufferAttribute(triangles.flat(), 3),
  );

  return finishGeometry(geometry, paletteName);
}

export function cylinder({
  radius = 0.5,
  height = 1,
  segments = 8,
  color: paletteName = 'concrete2',
}: RadialPrimitiveOptions = {}): BufferGeometry {
  return finishGeometry(
    new CylinderGeometry(radius, radius, height, segments),
    paletteName,
  );
}

export function cone({
  radius = 0.5,
  height = 1,
  segments = 8,
  color: paletteName = 'concrete2',
}: RadialPrimitiveOptions = {}): BufferGeometry {
  return finishGeometry(
    new CylinderGeometry(0, radius, height, segments),
    paletteName,
  );
}

export function icosphere({
  radius = 0.5,
  lod = 0,
  color: paletteName = 'concrete2',
}: IcosphereOptions = {}): BufferGeometry {
  return finishGeometry(new IcosahedronGeometry(radius, lod), paletteName);
}
