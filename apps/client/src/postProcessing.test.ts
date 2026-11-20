// @vitest-environment happy-dom

import GUI from 'lil-gui';
import {
  BlendFunction,
  EffectComposer,
  EffectPass,
  RenderPass,
} from 'postprocessing';
import {
  HalfFloatType,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector2,
  type WebGLRenderer,
} from 'three';
import { describe, expect, it, vi } from 'vitest';
import {
  addPostProcessingControls,
  createPostProcessing,
} from './postProcessing';

function createHarness() {
  const size = new Vector2(800, 600);
  const webGLRenderer = {
    autoClear: true,
    outputColorSpace: SRGBColorSpace,
    getContext: () => ({
      getContextAttributes: () => ({ alpha: false }),
    }),
    getSize: (target: Vector2) => target.copy(size),
    getDrawingBufferSize: (target: Vector2) => target.copy(size),
    setSize: vi.fn((width: number, height: number) => {
      size.set(width, height);
    }),
    setRenderTarget: vi.fn(),
    render: vi.fn(),
  };
  const scene = new Scene();
  const camera = new PerspectiveCamera();
  const postProcessing = createPostProcessing(
    webGLRenderer as unknown as WebGLRenderer,
    scene,
    camera,
  );

  return { webGLRenderer, scene, camera, postProcessing };
}

describe('post-processing', () => {
  it('uses HDR buffers and thresholded bloom with vignette and subtle grain', () => {
    const { postProcessing } = createHarness();
    const { composer, bloomEffect, vignetteEffect, noiseEffect } =
      postProcessing;

    expect(composer).toBeInstanceOf(EffectComposer);
    expect(composer.inputBuffer.texture.type).toBe(HalfFloatType);
    expect(composer.passes).toHaveLength(3);
    expect(composer.passes[0]).toBeInstanceOf(RenderPass);
    expect(composer.passes[1]).toBeInstanceOf(EffectPass);
    expect(composer.passes[2]).toBeInstanceOf(EffectPass);
    expect(bloomEffect.luminanceMaterial.threshold).toBe(1);
    expect(bloomEffect.mipmapBlurPass.enabled).toBe(true);
    expect(bloomEffect.intensity).toBeGreaterThan(0);
    expect(vignetteEffect.darkness).toBeGreaterThan(0);
    expect(noiseEffect.premultiply).toBe(true);
    expect(noiseEffect.blendMode.opacity.value).toBeGreaterThan(0);
    expect(noiseEffect.blendMode.opacity.value).toBeLessThanOrEqual(0.08);

    postProcessing.dispose();
    expect(composer.passes).toHaveLength(0);
  });

  it('toggles every effect from the GUI and updates bloom intensity', () => {
    const { postProcessing } = createHarness();
    const gui = new GUI({ autoPlace: false, injectStyles: false });
    addPostProcessingControls(gui, postProcessing);
    const folder = gui.folders.find(
      (candidate) => candidate._title === 'Post-processing',
    );
    if (folder === undefined) {
      throw new Error('Missing post-processing controls.');
    }
    const controllers = new Map(
      folder.controllers.map((controller) => [controller.property, controller]),
    );
    const setValue = (property: string, value: boolean | number) => {
      const controller = controllers.get(property);
      if (controller === undefined) {
        throw new Error(`Missing post-processing control: ${property}`);
      }
      controller.setValue(value);
    };
    const renderPass = postProcessing.composer.passes[0];
    const bloomPass = postProcessing.composer.passes[1];
    const finishingPass = postProcessing.composer.passes[2];

    expect([...controllers.keys()].sort()).toEqual(
      ['enabled', 'bloom', 'bloomIntensity', 'vignette', 'noise'].sort(),
    );
    setValue('bloom', false);
    expect(bloomPass.enabled).toBe(false);
    setValue('vignette', false);
    expect(postProcessing.vignetteEffect.blendMode.blendFunction).toBe(
      BlendFunction.SKIP,
    );
    expect(finishingPass.enabled).toBe(true);
    setValue('noise', false);
    expect(postProcessing.noiseEffect.blendMode.blendFunction).toBe(
      BlendFunction.SKIP,
    );
    expect(finishingPass.enabled).toBe(false);
    expect(renderPass.renderToScreen).toBe(true);
    setValue('bloom', true);
    expect(renderPass.renderToScreen).toBe(false);
    expect(bloomPass.renderToScreen).toBe(true);
    expect(finishingPass.renderToScreen).toBe(false);
    setValue('bloom', false);
    expect(renderPass.renderToScreen).toBe(true);
    setValue('enabled', false);
    expect(postProcessing.parameters.enabled).toBe(false);

    for (const property of ['enabled', 'bloom', 'vignette', 'noise']) {
      setValue(property, true);
    }
    setValue('bloomIntensity', 2.25);
    expect(bloomPass.enabled).toBe(true);
    expect(finishingPass.enabled).toBe(true);
    expect(renderPass.renderToScreen).toBe(false);
    expect(bloomPass.renderToScreen).toBe(false);
    expect(finishingPass.renderToScreen).toBe(true);
    expect(postProcessing.bloomEffect.intensity).toBe(2.25);
    expect(postProcessing.vignetteEffect.blendMode.blendFunction).toBe(
      BlendFunction.NORMAL,
    );
    expect(postProcessing.noiseEffect.blendMode.blendFunction).toBe(
      BlendFunction.OVERLAY,
    );

    gui.destroy();
    postProcessing.dispose();
  });

  it('bypasses the composer when disabled and resizes its buffers', () => {
    const { webGLRenderer, scene, camera, postProcessing } = createHarness();
    const composerRender = vi
      .spyOn(postProcessing.composer, 'render')
      .mockImplementation(() => {});

    postProcessing.parameters.enabled = false;
    postProcessing.update();
    postProcessing.render(0.016);
    expect(webGLRenderer.render).toHaveBeenCalledOnce();
    expect(webGLRenderer.render).toHaveBeenCalledWith(scene, camera);
    expect(webGLRenderer.setRenderTarget).toHaveBeenCalledWith(null);
    expect(webGLRenderer.autoClear).toBe(true);
    expect(composerRender).not.toHaveBeenCalled();

    postProcessing.parameters.enabled = true;
    postProcessing.update();
    postProcessing.render(0.016);
    expect(composerRender).toHaveBeenCalledWith(0.016);
    expect(webGLRenderer.autoClear).toBe(false);
    expect(webGLRenderer.render).toHaveBeenCalledOnce();

    postProcessing.setSize(1024, 768);
    expect(webGLRenderer.setSize).toHaveBeenCalledWith(1024, 768, false);
    expect(postProcessing.composer.inputBuffer.width).toBe(1024);
    expect(postProcessing.composer.inputBuffer.height).toBe(768);

    postProcessing.dispose();
  });
});
