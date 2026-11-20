// @vitest-environment happy-dom

import { color } from '@zero-hour/art';
import GUI from 'lil-gui';
import { Color, FogExp2, Scene } from 'three';
import { describe, expect, it } from 'vitest';
import {
  addLightingControls,
  createLightingRig,
  type LightingParameters,
} from './lightingRig';

describe('lighting rig', () => {
  it('adds hemisphere and moon lights with exponential fog and cleans up', () => {
    const scene = new Scene();
    const rig = createLightingRig(scene);

    expect(scene.children).toContain(rig.hemisphereLight);
    expect(scene.children).toContain(rig.moonLight);
    expect(rig.hemisphereLight.color.getHexString()).toBe(
      color('sky2').slice(1),
    );
    expect(rig.hemisphereLight.groundColor.getHexString()).toBe(
      color('concrete0').slice(1),
    );
    expect(rig.moonLight.color.getHexString()).toBe(color('moon').slice(1));
    expect(rig.moonLight.position.toArray()).toEqual([-4, 7, 5]);
    expect(scene.fog).toBe(rig.fog);
    expect(rig.fog).toBeInstanceOf(FogExp2);
    expect(rig.fog.color.getHexString()).toBe(color('sky0').slice(1));
    expect(rig.fog.density).toBe(0.035);
    expect(scene.background).toBeInstanceOf(Color);
    expect((scene.background as Color).getHexString()).toBe(
      color('sky0').slice(1),
    );

    rig.dispose();
    expect(scene.children).not.toContain(rig.hemisphereLight);
    expect(scene.children).not.toContain(rig.moonLight);
    expect(scene.fog).toBeNull();
    expect(scene.background).toBeNull();
  });

  it('updates the whole scene mood from the lil-gui controls', () => {
    const scene = new Scene();
    const rig = createLightingRig(scene);
    const gui = new GUI({ autoPlace: false, injectStyles: false });
    addLightingControls(gui, rig);
    const controllers = gui.folders.flatMap((folder) => folder.controllers);
    const changes = {
      skyColor: '#102030',
      groundColor: '#304020',
      hemisphereIntensity: 0.65,
      moonColor: '#a0b0c0',
      moonIntensity: 1.75,
      moonX: -8,
      moonY: 11,
      moonZ: 6,
      fogColor: '#405060',
      fogDensity: 0.08,
    } satisfies LightingParameters;

    expect(controllers.map((controller) => controller.property).sort()).toEqual(
      Object.keys(changes).sort(),
    );
    for (const [property, value] of Object.entries(changes)) {
      const controller = controllers.find(
        (candidate) => candidate.property === property,
      );
      if (controller === undefined) {
        throw new Error(`Missing lighting control: ${property}`);
      }
      controller.setValue(value);
    }

    expect(rig.parameters).toEqual(changes);
    expect(rig.hemisphereLight.color.getHexString()).toBe('102030');
    expect(rig.hemisphereLight.groundColor.getHexString()).toBe('304020');
    expect(rig.hemisphereLight.intensity).toBe(0.65);
    expect(rig.moonLight.color.getHexString()).toBe('a0b0c0');
    expect(rig.moonLight.intensity).toBe(1.75);
    expect(rig.moonLight.position.toArray()).toEqual([-8, 11, 6]);
    expect(rig.fog.color.getHexString()).toBe('405060');
    expect(rig.fog.density).toBe(0.08);
    expect((scene.background as Color).getHexString()).toBe('405060');

    gui.destroy();
    rig.dispose();
  });
});
