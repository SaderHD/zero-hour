import type GUI from 'lil-gui';
import {
  BlendFunction,
  BloomEffect,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  VignetteEffect,
} from 'postprocessing';
import {
  HalfFloatType,
  type PerspectiveCamera,
  type Scene,
  type WebGLRenderer,
} from 'three';

export interface PostProcessingParameters {
  enabled: boolean;
  bloom: boolean;
  bloomIntensity: number;
  vignette: boolean;
  noise: boolean;
}

export interface PostProcessing {
  readonly parameters: PostProcessingParameters;
  readonly composer: EffectComposer;
  readonly bloomEffect: BloomEffect;
  readonly vignetteEffect: VignetteEffect;
  readonly noiseEffect: NoiseEffect;
  update(): void;
  render(deltaSeconds: number): void;
  setSize(width: number, height: number): void;
  dispose(): void;
}

const defaults: PostProcessingParameters = {
  enabled: true,
  bloom: true,
  bloomIntensity: 1.2,
  vignette: true,
  noise: true,
};

export function createPostProcessing(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  overrides: Partial<PostProcessingParameters> = {},
): PostProcessing {
  const parameters = { ...defaults, ...overrides };
  const composer = new EffectComposer(renderer, {
    frameBufferType: HalfFloatType,
    multisampling: 4,
  });
  const bloomEffect = new BloomEffect({
    luminanceThreshold: 1,
    luminanceSmoothing: 0.05,
    mipmapBlur: true,
    intensity: parameters.bloomIntensity,
  });
  const bloomPass = new EffectPass(camera, bloomEffect);
  const vignetteEffect = new VignetteEffect({
    offset: 0.35,
    darkness: 0.5,
  });
  const noiseEffect = new NoiseEffect({
    blendFunction: BlendFunction.OVERLAY,
    premultiply: true,
  });
  noiseEffect.blendMode.opacity.value = 0.08;
  const finishingPass = new EffectPass(camera, vignetteEffect, noiseEffect);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(finishingPass);

  function update() {
    bloomPass.enabled = parameters.enabled && parameters.bloom;
    bloomEffect.intensity = parameters.bloomIntensity;

    const vignetteBlend = parameters.vignette
      ? BlendFunction.NORMAL
      : BlendFunction.SKIP;
    if (vignetteEffect.blendMode.blendFunction !== vignetteBlend) {
      vignetteEffect.blendMode.blendFunction = vignetteBlend;
    }
    const noiseBlend = parameters.noise
      ? BlendFunction.OVERLAY
      : BlendFunction.SKIP;
    if (noiseEffect.blendMode.blendFunction !== noiseBlend) {
      noiseEffect.blendMode.blendFunction = noiseBlend;
    }
    finishingPass.enabled =
      parameters.enabled && (parameters.vignette || parameters.noise);
    renderPass.renderToScreen = !bloomPass.enabled && !finishingPass.enabled;
    bloomPass.renderToScreen = bloomPass.enabled && !finishingPass.enabled;
    finishingPass.renderToScreen = finishingPass.enabled;
  }

  update();

  return {
    parameters,
    composer,
    bloomEffect,
    vignetteEffect,
    noiseEffect,
    update,
    render(deltaSeconds) {
      renderer.autoClear = !parameters.enabled;
      if (parameters.enabled) {
        composer.render(deltaSeconds);
      } else {
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
      }
    },
    setSize(width, height) {
      composer.setSize(width, height, false);
    },
    dispose() {
      composer.dispose();
    },
  };
}

export function addPostProcessingControls(
  gui: GUI,
  postProcessing: PostProcessing,
): void {
  const { parameters, update } = postProcessing;
  const folder = gui.addFolder('Post-processing');
  folder.add(parameters, 'enabled').name('Enabled').onChange(update);
  folder.add(parameters, 'bloom').name('Bloom').onChange(update);
  folder
    .add(parameters, 'bloomIntensity', 0, 4, 0.05)
    .name('Bloom intensity')
    .onChange(update);
  folder.add(parameters, 'vignette').name('Vignette').onChange(update);
  folder.add(parameters, 'noise').name('Film grain').onChange(update);
}
