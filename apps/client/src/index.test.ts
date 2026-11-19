import { describe, expect, it } from 'vitest';
import { type CanvasViewport, mountCanvas } from './index';

function createViewport() {
  let resizeListener: (() => void) | undefined;
  const viewport: CanvasViewport = {
    innerWidth: 800,
    innerHeight: 600,
    addEventListener: (_type, listener) => {
      resizeListener = listener;
    },
    removeEventListener: (_type, listener) => {
      if (resizeListener === listener) {
        resizeListener = undefined;
      }
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
  };
}

describe('mountCanvas', () => {
  it('tracks viewport size and removes its resize listener on cleanup', () => {
    const canvas = { width: 0, height: 0 } as HTMLCanvasElement;
    const view = createViewport();
    const unmount = mountCanvas(canvas, view.viewport);

    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    expect(view.hasResizeListener()).toBe(true);

    view.setSize(1024, 768);
    view.dispatchResize();
    expect(canvas.width).toBe(1024);
    expect(canvas.height).toBe(768);

    unmount();
    expect(view.hasResizeListener()).toBe(false);
  });
});
