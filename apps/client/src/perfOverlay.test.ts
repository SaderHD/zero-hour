// @vitest-environment happy-dom

import type { WebGLRenderer } from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { createPerfOverlay } from './perfOverlay';

function renderInfo(
  calls: number,
  triangles: number,
): WebGLRenderer['info']['render'] {
  return { frame: 1, calls, triangles, points: 0, lines: 0 };
}

afterEach(() => {
  document.body.replaceChildren();
  window.history.replaceState(null, '', '/');
});

describe('performance overlay', () => {
  it('is created only when debug=1 is in the URL', () => {
    expect(createPerfOverlay(document.body)).toBeUndefined();
    window.history.replaceState(null, '', '/?debug=0');
    expect(createPerfOverlay(document.body)).toBeUndefined();
    window.history.replaceState(null, '', '/?map=test&debug=1');
    const overlay = createPerfOverlay(document.body);

    expect(overlay).toBeDefined();
    expect(document.querySelector('#perf-overlay')).not.toBeNull();
    overlay?.dispose();
    expect(document.querySelector('#perf-overlay')).toBeNull();
  });

  it('shows sampled FPS, frame time, draw calls and triangles', () => {
    window.history.replaceState(null, '', '/?debug=1');
    const overlay = createPerfOverlay(document.body);
    if (overlay === undefined) {
      throw new Error('Missing performance overlay.');
    }
    const element = document.querySelector('#perf-overlay');

    overlay.update(0, renderInfo(1, 12));
    overlay.update(0.1, renderInfo(1, 12));
    overlay.update(0.1, renderInfo(2, 24));
    expect(element?.textContent).toContain('FPS: --');

    overlay.update(0.1, renderInfo(17, 1234));
    expect(element?.textContent).toBe(
      'FPS: 10\nFrame: 100.0 ms\nDraw calls: 17\nTriangles: 1234',
    );

    overlay.dispose();
  });
});
