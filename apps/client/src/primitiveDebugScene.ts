import {
  box,
  color,
  cone,
  cylinder,
  emissiveMaterial,
  flatMaterial,
  icosphere,
  testCrate,
  testLamp,
  wedge,
} from '@zero-hour/art';
import { Color, Mesh, PerspectiveCamera, Scene } from 'three';

export interface PrimitiveDebugScene {
  scene: Scene;
  camera: PerspectiveCamera;
  update(deltaSeconds: number): void;
  dispose(): void;
}

export function createPrimitiveDebugScene(): PrimitiveDebugScene {
  const scene = new Scene();
  scene.background = new Color(color('sky0'));

  const camera = new PerspectiveCamera(50, 1, 0.1, 150);
  camera.position.set(10, 7, 12);
  camera.lookAt(0, 0, 0);

  const plane = new Mesh(
    box({ width: 24, height: 0.2, depth: 24, color: 'concrete1' }),
    flatMaterial,
  );
  plane.name = 'testPlane';
  plane.position.y = -0.1;
  scene.add(plane);
  const meshes = [plane];

  const primitives = [
    {
      name: 'box',
      geometry: box({ width: 1.25, height: 1.25, depth: 1.25, color: 'wood2' }),
    },
    {
      name: 'wedge',
      geometry: wedge({ width: 1.4, height: 1.25, depth: 1.4, color: 'rust1' }),
    },
    {
      name: 'cylinder',
      geometry: cylinder({
        radius: 0.65,
        height: 1.5,
        segments: 8,
        color: 'metal2',
      }),
    },
    {
      name: 'cone',
      geometry: cone({ radius: 0.75, height: 1.5, segments: 7, color: 'gold' }),
    },
    {
      name: 'icosphere',
      geometry: icosphere({ radius: 0.8, lod: 1, color: 'frost' }),
    },
  ];
  const placements = [
    [-4, 0.625, -2],
    [-1.5, 0.625, -4],
    [1.5, 0.75, -2],
    [4, 0.75, -4],
    [-4, 0.8, 2],
  ] as const;
  const animatedMeshes = primitives.map(({ name, geometry }, index) => {
    const mesh = new Mesh(geometry, flatMaterial);
    mesh.name = name;
    const [x, y, z] = placements[index];
    mesh.position.set(x, y, z);
    mesh.rotation.y = index * 0.55;
    scene.add(mesh);
    return mesh;
  });
  meshes.push(...animatedMeshes);

  const crate = new Mesh(testCrate(), flatMaterial);
  crate.name = 'testCrate';
  crate.position.set(0, 0.8, 2);
  crate.rotation.y = 0.55;
  scene.add(crate);
  meshes.push(crate);
  animatedMeshes.push(crate);

  const lamp = new Mesh(testLamp(), emissiveMaterial);
  lamp.name = 'testLamp';
  lamp.position.set(4, 1.28, 2);
  scene.add(lamp);
  meshes.push(lamp);

  return {
    scene,
    camera,
    update(deltaSeconds) {
      for (const mesh of animatedMeshes) {
        mesh.rotation.y += deltaSeconds * 0.45;
      }
    },
    dispose() {
      for (const mesh of meshes) {
        mesh.geometry.dispose();
      }
      flatMaterial.dispose();
      emissiveMaterial.dispose();
    },
  };
}
