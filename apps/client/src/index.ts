export const clientPackage = '@zero-hour/client';

export interface CanvasViewport {
  innerWidth: number;
  innerHeight: number;
  addEventListener(type: 'resize', listener: () => void): void;
  removeEventListener(type: 'resize', listener: () => void): void;
}

export function mountCanvas(
  canvas: HTMLCanvasElement,
  viewport: CanvasViewport = window,
): () => void {
  const resize = () => {
    canvas.width = viewport.innerWidth;
    canvas.height = viewport.innerHeight;
  };

  resize();
  viewport.addEventListener('resize', resize);
  return () => viewport.removeEventListener('resize', resize);
}
