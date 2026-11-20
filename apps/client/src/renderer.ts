import { type PerspectiveCamera, type Scene, WebGLRenderer } from 'three';
import { createPostProcessing, type PostProcessing } from './postProcessing';

export interface RenderViewport {
  innerWidth: number;
  innerHeight: number;
  devicePixelRatio: number;
  addEventListener(type: 'resize', listener: () => void): void;
  removeEventListener(type: 'resize', listener: () => void): void;
  requestAnimationFrame(callback: FrameRequestCallback): number;
  cancelAnimationFrame(handle: number): void;
}

export interface RendererOptions {
  pixelRatioCap?: number;
  viewport?: RenderViewport;
  webGLRenderer?: WebGLRenderer;
  postProcessing?: PostProcessing;
}

export class Renderer {
  readonly renderer: WebGLRenderer;
  readonly postProcessing: PostProcessing;

  private readonly viewport: RenderViewport;
  private animationFrameId: number | undefined;
  private running = false;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly scene: Scene,
    private readonly camera: PerspectiveCamera,
    options: RendererOptions = {},
  ) {
    this.viewport = options.viewport ?? window;
    this.renderer =
      options.webGLRenderer ??
      new WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });

    this.renderer.setPixelRatio(
      Math.min(this.viewport.devicePixelRatio, options.pixelRatioCap ?? 2),
    );
    this.postProcessing =
      options.postProcessing ??
      createPostProcessing(this.renderer, this.scene, this.camera);
    this.resize();
    this.viewport.addEventListener('resize', this.resize);
  }

  start(update: (deltaSeconds: number) => void): void {
    if (this.running) {
      return;
    }

    this.running = true;
    let previousTime: number | undefined;
    const frame: FrameRequestCallback = (time) => {
      if (!this.running) {
        return;
      }

      const deltaSeconds =
        previousTime === undefined ? 0 : (time - previousTime) / 1000;
      previousTime = time;
      update(deltaSeconds);
      this.postProcessing.render(deltaSeconds);

      if (this.running) {
        this.animationFrameId = this.viewport.requestAnimationFrame(frame);
      }
    };

    this.animationFrameId = this.viewport.requestAnimationFrame(frame);
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId !== undefined) {
      this.viewport.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  dispose(): void {
    this.stop();
    this.viewport.removeEventListener('resize', this.resize);
    this.postProcessing.dispose();
    this.renderer.dispose();
  }

  private readonly resize = () => {
    const { innerWidth: width, innerHeight: height } = this.viewport;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.postProcessing.setSize(width, height);
  };
}
