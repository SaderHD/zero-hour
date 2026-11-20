import { box, color, cone, cylinder, icosphere, wedge } from '@zero-hour/art';
import {
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
} from 'three';

export interface PrimitiveDebugScene {
  scene: Scene;
  camera: PerspectiveCamera;
  update(deltaSeconds: number): void;
  dispose(): void;
}

export function createPrimitiveDebugScene(): PrimitiveDebugScene {
  const scene = new Scene();
  scene.background = new Color(color('sky0'));

  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 2.2, 8.5);
  camera.lookAt(0, 0, 0);

  scene.add(new HemisphereLight(color('sky2'), color('concrete0'), 1.5));
  const moonLight = new DirectionalLight(color('moon'), 2.5);
  moonLight.position.set(-4, 7, 5);
  scene.add(moonLight);

  const material = new MeshLambertMaterial({
    flatShading: true,
    vertexColors: true,
  });
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
  const meshes = primitives.map(({ name, geometry }, index) => {
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    mesh.position.x = (index - 2) * 1.6;
    mesh.rotation.set(0.25, 0.55, 0);
    scene.add(mesh);
    return mesh;
  });

  return {
    scene,
    camera,
    update(deltaSeconds) {
      for (const mesh of meshes) {
        mesh.rotation.y += deltaSeconds * 0.45;
      }
    },
    dispose() {
      for (const mesh of meshes) {
        mesh.geometry.dispose();
      }
      material.dispose();
    },
  };
}
