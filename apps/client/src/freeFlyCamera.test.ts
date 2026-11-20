// @vitest-environment happy-dom

import { PerspectiveCamera, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FreeFlyCamera } from './freeFlyCamera';

const cleanups: Array<() => void> = [];

function createHarness() {
  const canvas = document.createElement('canvas');
  const instructions = document.createElement('p');
  document.body.append(canvas, instructions);
  let pointerLockElement: Element | null = null;
  Object.defineProperty(document, 'pointerLockElement', {
    configurable: true,
    get: () => pointerLockElement,
  });

  const lock = () => {
    pointerLockElement = canvas;
    document.dispatchEvent(new Event('pointerlockchange'));
  };
  const requestPointerLock = vi.fn(() => {
    lock();
    return Promise.resolve();
  });
  const exitPointerLock = vi.fn(() => {
    pointerLockElement = null;
    document.dispatchEvent(new Event('pointerlockchange'));
  });
  canvas.requestPointerLock = requestPointerLock;
  document.exitPointerLock = exitPointerLock;

  const camera = new PerspectiveCamera();
  const flyCamera = new FreeFlyCamera(camera, canvas, {
    moveSpeed: 2,
    lookSensitivity: 0.001,
    boostMultiplier: 3,
    instructions,
  });
  cleanups.push(() => flyCamera.dispose());

  return {
    camera,
    canvas,
    instructions,
    flyCamera,
    requestPointerLock,
    exitPointerLock,
    lock,
    unlock() {
      pointerLockElement = null;
      document.dispatchEvent(new Event('pointerlockchange'));
    },
    key(type: 'keydown' | 'keyup', code: string) {
      const event = new KeyboardEvent(type, { code, cancelable: true });
      window.dispatchEvent(event);
      return event;
    },
    mouse(movementX: number, movementY: number) {
      document.dispatchEvent(
        new MouseEvent('mousemove', { movementX, movementY }),
      );
    },
  };
}

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) {
    cleanup();
  }
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('FreeFlyCamera', () => {
  it('requests Pointer Lock on click and ignores input while unlocked', () => {
    const {
      camera,
      canvas,
      instructions,
      flyCamera,
      requestPointerLock,
      key,
      mouse,
    } = createHarness();

    expect(instructions.textContent).toContain('Click to fly');
    key('keydown', 'KeyW');
    mouse(100, 50);
    flyCamera.update(1);
    expect(camera.position.toArray()).toEqual([0, 0, 0]);
    expect(camera.rotation.y).toBe(0);

    canvas.dispatchEvent(new MouseEvent('click'));
    expect(requestPointerLock).toHaveBeenCalledOnce();
    expect(instructions.textContent).not.toContain('Click to fly');

    key('keydown', 'KeyW');
    flyCamera.update(0.5);
    expect(camera.position.z).toBeCloseTo(-1);
  });

  it('normalizes combined WASD and vertical movement and applies boost', () => {
    const { camera, flyCamera, lock, key } = createHarness();
    lock();
    key('keydown', 'KeyW');
    key('keydown', 'KeyD');
    key('keydown', 'Space');
    expect(key('keydown', 'KeyA').defaultPrevented).toBe(true);
    key('keyup', 'KeyA');

    flyCamera.update(1);
    const expectedComponent = 2 / Math.sqrt(3);
    expect(camera.position.x).toBeCloseTo(expectedComponent);
    expect(camera.position.y).toBeCloseTo(expectedComponent);
    expect(camera.position.z).toBeCloseTo(-expectedComponent);

    for (const code of ['KeyW', 'KeyD', 'Space']) {
      key('keyup', code);
    }
    camera.position.set(0, 0, 0);
    key('keydown', 'KeyS');
    key('keydown', 'ControlLeft');
    key('keydown', 'ShiftLeft');
    flyCamera.update(0.5);
    const boostedComponent = 3 / Math.sqrt(2);
    expect(camera.position.x).toBe(0);
    expect(camera.position.y).toBeCloseTo(-boostedComponent);
    expect(camera.position.z).toBeCloseTo(boostedComponent);
  });

  it('looks with the mouse, clamps pitch, and flies along the view', () => {
    const { camera, flyCamera, lock, key, mouse } = createHarness();
    lock();
    mouse(100, -50);

    expect(camera.rotation.order).toBe('YXZ');
    expect(camera.rotation.x).toBeCloseTo(0.05);
    expect(camera.rotation.y).toBeCloseTo(-0.1);
    expect(camera.rotation.z).toBe(0);

    key('keydown', 'KeyW');
    flyCamera.update(1);
    const direction = new Vector3();
    camera.getWorldDirection(direction);
    expect(camera.position.x).toBeCloseTo(direction.x * 2);
    expect(camera.position.y).toBeCloseTo(direction.y * 2);
    expect(camera.position.z).toBeCloseTo(direction.z * 2);

    mouse(0, 100_000);
    expect(camera.rotation.x).toBeCloseTo(-Math.PI / 2 + 0.001);
    mouse(0, -200_000);
    expect(camera.rotation.x).toBeCloseTo(Math.PI / 2 - 0.001);
  });

  it('clears held keys on unlock and blur and removes listeners on dispose', () => {
    const {
      camera,
      canvas,
      flyCamera,
      requestPointerLock,
      exitPointerLock,
      lock,
      unlock,
      key,
    } = createHarness();
    lock();
    key('keydown', 'KeyW');
    unlock();
    flyCamera.update(1);
    expect(camera.position.toArray()).toEqual([0, 0, 0]);

    lock();
    flyCamera.update(1);
    expect(camera.position.toArray()).toEqual([0, 0, 0]);
    key('keydown', 'KeyW');
    window.dispatchEvent(new Event('blur'));
    flyCamera.update(1);
    expect(camera.position.toArray()).toEqual([0, 0, 0]);

    canvas.dispatchEvent(new MouseEvent('click'));
    expect(requestPointerLock).toHaveBeenCalledOnce();
    flyCamera.dispose();
    expect(exitPointerLock).toHaveBeenCalledOnce();

    canvas.dispatchEvent(new MouseEvent('click'));
    expect(requestPointerLock).toHaveBeenCalledOnce();
    lock();
    key('keydown', 'KeyW');
    flyCamera.update(1);
    expect(camera.position.toArray()).toEqual([0, 0, 0]);
  });
});
