import type { WebGLRenderer } from 'three';

export interface PerfOverlay {
  update(
    deltaSeconds: number,
    renderInfo: WebGLRenderer['info']['render'],
  ): void;
  dispose(): void;
}

const updateIntervalSeconds = 0.25;

export function createPerfOverlay(
  parent: HTMLElement,
  search = parent.ownerDocument.defaultView?.location.search ?? '',
): PerfOverlay | undefined {
  if (new URLSearchParams(search).get('debug') !== '1') {
    return undefined;
  }

  const element = parent.ownerDocument.createElement('pre');
  element.id = 'perf-overlay';
  element.setAttribute('aria-label', 'Rendering performance');
  element.textContent = 'FPS: --\nFrame: -- ms\nDraw calls: --\nTriangles: --';
  parent.append(element);

  let elapsedSeconds = 0;
  let frameCount = 0;

  return {
    update(deltaSeconds, renderInfo) {
      if (deltaSeconds <= 0) {
        return;
      }

      elapsedSeconds += deltaSeconds;
      frameCount += 1;
      if (elapsedSeconds < updateIntervalSeconds) {
        return;
      }

      const fps = frameCount / elapsedSeconds;
      const frameMilliseconds = (elapsedSeconds * 1000) / frameCount;
      element.textContent = [
        `FPS: ${Math.round(fps)}`,
        `Frame: ${frameMilliseconds.toFixed(1)} ms`,
        `Draw calls: ${renderInfo.calls}`,
        `Triangles: ${renderInfo.triangles}`,
      ].join('\n');
      elapsedSeconds = 0;
      frameCount = 0;
    },
    dispose() {
      element.remove();
    },
  };
}
