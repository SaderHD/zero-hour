import { emissiveMaterial, flatMaterial } from '@zero-hour/art';
import { Mesh, MeshLambertMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { createPrimitiveDebugScene } from './primitiveDebugScene';

describe('primitive debug scene', () => {
  it('shows flat-shaded primitives and a single-mesh test crate', () => {
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
      'testCrate',
      'testLamp',
    ]);
    expect(new Set(meshes.map((mesh) => mesh.material))).toEqual(
      new Set([flatMaterial, emissiveMaterial]),
    );
    for (const mesh of meshes) {
      expect(mesh.material).toBeInstanceOf(MeshLambertMaterial);
      const material = mesh.material as MeshLambertMaterial;
      expect(material.flatShading).toBe(true);
      expect(material.vertexColors).toBe(true);
      expect(mesh.geometry.index).toBeNull();
      expect(mesh.geometry.hasAttribute('color')).toBe(true);
    }

    const crate = meshes.find((mesh) => mesh.name === 'testCrate');
    expect(crate).toBeDefined();
    expect(crate?.geometry.groups).toHaveLength(0);
    expect(Array.isArray(crate?.material)).toBe(false);

    for (const mesh of meshes.slice(0, -1)) {
      expect(mesh.material).toBe(flatMaterial);
    }
    const lamp = meshes.find((mesh) => mesh.name === 'testLamp');
    expect(lamp?.material).toBe(emissiveMaterial);
    expect(lamp?.geometry.groups).toHaveLength(0);
    const lampMask = lamp?.geometry.getAttribute('emissiveMask');
    expect(lampMask).toBeDefined();
    expect(new Set(lampMask?.array)).toEqual(new Set([0, 1]));

    const initialRotation = meshes[0].rotation.y;
    debugScene.update(1);
    expect(meshes[0].rotation.y).toBeCloseTo(initialRotation + 0.45);

    debugScene.dispose();
  });
});
