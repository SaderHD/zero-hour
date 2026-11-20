import { color } from '@zero-hour/art';
import type GUI from 'lil-gui';
import {
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  type Scene,
} from 'three';

export interface LightingParameters {
  skyColor: string;
  groundColor: string;
  hemisphereIntensity: number;
  moonColor: string;
  moonIntensity: number;
  moonX: number;
  moonY: number;
  moonZ: number;
  fogColor: string;
  fogDensity: number;
}

export interface LightingRig {
  parameters: LightingParameters;
  hemisphereLight: HemisphereLight;
  moonLight: DirectionalLight;
  fog: FogExp2;
  update(): void;
  dispose(): void;
}

const defaults: LightingParameters = {
  skyColor: color('sky2'),
  groundColor: color('concrete0'),
  hemisphereIntensity: 1.5,
  moonColor: color('moon'),
  moonIntensity: 2.5,
  moonX: -4,
  moonY: 7,
  moonZ: 5,
  fogColor: color('sky0'),
  fogDensity: 0.035,
};

export function createLightingRig(
  scene: Scene,
  overrides: Partial<LightingParameters> = {},
): LightingRig {
  const parameters = { ...defaults, ...overrides };
  const hemisphereLight = new HemisphereLight();
  hemisphereLight.name = 'hemisphereLight';
  const moonLight = new DirectionalLight();
  moonLight.name = 'moonLight';
  const fog = new FogExp2(parameters.fogColor, parameters.fogDensity);
  const background = new Color();

  scene.add(hemisphereLight, moonLight);
  scene.fog = fog;
  scene.background = background;

  function update() {
    hemisphereLight.color.set(parameters.skyColor);
    hemisphereLight.groundColor.set(parameters.groundColor);
    hemisphereLight.intensity = parameters.hemisphereIntensity;
    moonLight.color.set(parameters.moonColor);
    moonLight.intensity = parameters.moonIntensity;
    moonLight.position.set(
      parameters.moonX,
      parameters.moonY,
      parameters.moonZ,
    );
    fog.color.set(parameters.fogColor);
    fog.density = parameters.fogDensity;
    background.set(parameters.fogColor);
  }

  update();

  return {
    parameters,
    hemisphereLight,
    moonLight,
    fog,
    update,
    dispose() {
      scene.remove(hemisphereLight, moonLight);
      if (scene.fog === fog) {
        scene.fog = null;
      }
      if (scene.background === background) {
        scene.background = null;
      }
    },
  };
}

export function addLightingControls(gui: GUI, rig: LightingRig): void {
  const { parameters, update } = rig;
  const hemisphere = gui.addFolder('Hemisphere');
  hemisphere
    .addColor(parameters, 'skyColor')
    .name('Sky color')
    .onChange(update);
  hemisphere
    .addColor(parameters, 'groundColor')
    .name('Ground color')
    .onChange(update);
  hemisphere
    .add(parameters, 'hemisphereIntensity', 0, 5, 0.05)
    .name('Intensity')
    .onChange(update);

  const moon = gui.addFolder('Moon');
  moon.addColor(parameters, 'moonColor').name('Color').onChange(update);
  moon
    .add(parameters, 'moonIntensity', 0, 5, 0.05)
    .name('Intensity')
    .onChange(update);
  moon.add(parameters, 'moonX', -20, 20, 0.1).name('X').onChange(update);
  moon.add(parameters, 'moonY', -20, 20, 0.1).name('Y').onChange(update);
  moon.add(parameters, 'moonZ', -20, 20, 0.1).name('Z').onChange(update);

  const fog = gui.addFolder('Fog');
  fog.addColor(parameters, 'fogColor').name('Color').onChange(update);
  fog
    .add(parameters, 'fogDensity', 0, 0.15, 0.001)
    .name('Density')
    .onChange(update);
}
