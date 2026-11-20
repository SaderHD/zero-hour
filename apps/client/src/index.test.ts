import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { type PostProcessing, Renderer, type RenderViewport } from './index';

function createViewport() {
  let resizeListener: (() => void) | undefined;
  let nextFrameId = 0;
  const frameCallbacks = new Map<number, FrameRequestCallback>();
  const viewport: RenderViewport = {
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 3,
    addEventListener: (_type, listener) => {
      resizeListener = listener;
    },
    removeEventListener: (_type, listener) => {
      if (resizeListener === listener) {
        resizeListener = undefined;
      }
    },
    requestAnimationFrame: (callback) => {
      const id = ++nextFrameId;
      frameCallbacks.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => {
      frameCallbacks.delete(id);
    },
  };

  return {
    viewport,
    setSize(width: number, height: number) {
      viewport.innerWidth = width;
      viewport.innerHeight = height;
    },
    dispatchResize() {
      resizeListener?.();
    },
    hasResizeListener() {
      return resizeListener !== undefined;
    },
    pendingFrameCount() {
      return frameCallbacks.size;
    },
    runFrame(time: number) {
      const callbacks = [...frameCallbacks.values()];
      frameCallbacks.clear();
      for (const callback of callbacks) {
        callback(time);
      }
    },
  };
}

function createHarness() {
  const view = createViewport();
  const scene = {} as Scene;
  const camera = {
    aspect: 0,
    updateProjectionMatrix: vi.fn(),
  };
  const webGLRenderer = {
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  };
  const postProcessing = {
    parameters: {
      enabled: true,
      bloom: true,
      bloomIntensity: 1.2,
      vignette: true,
      noise: true,
    },
    update: vi.fn(),
    render: vi.fn(),
    setSize: vi.fn(),
    dispose: vi.fn(),
  };
  const renderer = new Renderer(
    {} as HTMLCanvasElement,
    scene,
    camera as unknown as PerspectiveCamera,
    {
      viewport: view.viewport,
      webGLRenderer: webGLRenderer as unknown as WebGLRenderer,
      postProcessing: postProcessing as unknown as PostProcessing,
    },
  );

  return { view, scene, camera, webGLRenderer, postProcessing, renderer };
}

describe('Renderer', () => {
  it('caps pixel ratio, resizes the camera and canvas, and cleans up', () => {
    const { view, camera, webGLRenderer, postProcessing, renderer } =
      createHarness();

    expect(webGLRenderer.setPixelRatio).toHaveBeenCalledWith(2);
    expect(postProcessing.setSize).toHaveBeenCalledWith(800, 600);
    expect(camera.aspect).toBe(800 / 600);
    expect(view.hasResizeListener()).toBe(true);

    view.setSize(1024, 768);
    view.dispatchResize();
    expect(postProcessing.setSize).toHaveBeenLastCalledWith(1024, 768);
    expect(camera.aspect).toBe(1024 / 768);
    expect(camera.updateProjectionMatrix).toHaveBeenCalledTimes(2);

    renderer.dispose();
    expect(view.hasResizeListener()).toBe(false);
    expect(postProcessing.dispose).toHaveBeenCalledOnce();
    expect(webGLRenderer.dispose).toHaveBeenCalledOnce();
  });

  it('renders through post-processing on every animation frame until stopped', () => {
    const { view, postProcessing, renderer } = createHarness();
    const update = vi.fn<(deltaSeconds: number) => void>();

    renderer.start(update);
    renderer.start(update);
    expect(view.pendingFrameCount()).toBe(1);

    view.runFrame(1000);
    view.runFrame(1016);
    expect(update).toHaveBeenNthCalledWith(1, 0);
    expect(update.mock.calls[1][0]).toBeCloseTo(0.016);
    expect(postProcessing.render).toHaveBeenCalledTimes(2);
    expect(postProcessing.render).toHaveBeenNthCalledWith(1, 0);
    expect(postProcessing.render).toHaveBeenNthCalledWith(2, 0.016);
    expect(view.pendingFrameCount()).toBe(1);

    renderer.stop();
    expect(view.pendingFrameCount()).toBe(0);
    view.runFrame(1032);
    expect(postProcessing.render).toHaveBeenCalledTimes(2);

    renderer.dispose();
  });
});
