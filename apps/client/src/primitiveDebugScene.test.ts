import { Mesh, MeshLambertMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { createPrimitiveDebugScene } from './primitiveDebugScene';

describe('primitive debug scene', () => {
  it('shows every primitive with flat-shaded vertex colors', () => {
    const debugScene = createPrimitiveDebugScene();
    const meshes = debugScene.scene.children.filter(
      (child): child is Mesh => child instanceof Mesh,
    );

    expect(meshes.map((mesh) => mesh.name)).toEqual([
      'box',
      'wedge',
      'cylinder',
      'cone',
      'icosphere',
    ]);
    expect(new Set(meshes.map((mesh) => mesh.material)).size).toBe(1);
    for (const mesh of meshes) {
      expect(mesh.material).toBeInstanceOf(MeshLambertMaterial);
      const material = mesh.material as MeshLambertMaterial;
      expect(material.flatShading).toBe(true);
      expect(material.vertexColors).toBe(true);
      expect(mesh.geometry.index).toBeNull();
      expect(mesh.geometry.hasAttribute('color')).toBe(true);
    }

    const initialRotation = meshes[0].rotation.y;
    debugScene.update(1);
    expect(meshes[0].rotation.y).toBeCloseTo(initialRotation + 0.45);

    debugScene.dispose();
  });
});
