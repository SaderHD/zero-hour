import { type PerspectiveCamera, Vector3 } from 'three';

export interface FreeFlyCameraOptions {
  moveSpeed?: number;
  lookSensitivity?: number;
  boostMultiplier?: number;
  instructions?: HTMLElement;
}

const controlledKeys = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'Space',
  'ControlLeft',
  'ControlRight',
  'ShiftLeft',
  'ShiftRight',
]);
const unlockedInstructions =
  'Click to fly · WASD move · Mouse look · Space/Ctrl up/down · Shift boost · Esc release';
const lockedInstructions =
  'WASD move · Mouse look · Space/Ctrl up/down · Shift boost · Esc release';
const maxPitch = Math.PI / 2 - 0.001;

export class FreeFlyCamera {
  private readonly document: Document;
  private readonly window: Window;
  private readonly moveSpeed: number;
  private readonly lookSensitivity: number;
  private readonly boostMultiplier: number;
  private readonly instructions: HTMLElement | undefined;
  private readonly keys = new Set<string>();
  private readonly forward = new Vector3();
  private readonly right = new Vector3();
  private readonly movement = new Vector3();
  private yaw: number;
  private pitch: number;
  private pointerLockFailed = false;

  constructor(
    private readonly camera: PerspectiveCamera,
    private readonly canvas: HTMLCanvasElement,
    options: FreeFlyCameraOptions = {},
  ) {
    const window = canvas.ownerDocument.defaultView;
    if (window === null) {
      throw new Error('The fly camera requires a browser window.');
    }

    this.document = canvas.ownerDocument;
    this.window = window;
    this.moveSpeed = options.moveSpeed ?? 6;
    this.lookSensitivity = options.lookSensitivity ?? 0.002;
    this.boostMultiplier = options.boostMultiplier ?? 3;
    this.instructions = options.instructions;

    camera.rotation.reorder('YXZ');
    this.yaw = camera.rotation.y;
    this.pitch = camera.rotation.x;

    canvas.addEventListener('click', this.requestPointerLock);
    this.document.addEventListener(
      'pointerlockchange',
      this.handlePointerLockChange,
    );
    this.document.addEventListener(
      'pointerlockerror',
      this.handlePointerLockError,
    );
    this.document.addEventListener('mousemove', this.handleMouseMove);
    this.window.addEventListener('keydown', this.handleKeyDown);
    this.window.addEventListener('keyup', this.handleKeyUp);
    this.window.addEventListener('blur', this.clearKeys);
    this.updateInstructions();
  }

  update(deltaSeconds: number): void {
    if (!this.isLocked() || deltaSeconds <= 0) {
      return;
    }

    const forwardInput =
      Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS'));
    const rightInput =
      Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA'));
    const verticalInput =
      Number(this.keys.has('Space')) -
      Number(this.keys.has('ControlLeft') || this.keys.has('ControlRight'));
    if (forwardInput === 0 && rightInput === 0 && verticalInput === 0) {
      return;
    }

    const cosinePitch = Math.cos(this.pitch);
    this.forward.set(
      -Math.sin(this.yaw) * cosinePitch,
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * cosinePitch,
    );
    this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this.movement
      .set(0, verticalInput, 0)
      .addScaledVector(this.forward, forwardInput)
      .addScaledVector(this.right, rightInput)
      .normalize();

    const boosted = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const speed = this.moveSpeed * (boosted ? this.boostMultiplier : 1);
    this.camera.position.addScaledVector(this.movement, speed * deltaSeconds);
  }

  dispose(): void {
    this.canvas.removeEventListener('click', this.requestPointerLock);
    this.document.removeEventListener(
      'pointerlockchange',
      this.handlePointerLockChange,
    );
    this.document.removeEventListener(
      'pointerlockerror',
      this.handlePointerLockError,
    );
    this.document.removeEventListener('mousemove', this.handleMouseMove);
    this.window.removeEventListener('keydown', this.handleKeyDown);
    this.window.removeEventListener('keyup', this.handleKeyUp);
    this.window.removeEventListener('blur', this.clearKeys);
    this.clearKeys();
    this.pointerLockFailed = false;
    if (this.isLocked()) {
      this.document.exitPointerLock();
    }
    this.updateInstructions();
  }

  private isLocked(): boolean {
    return this.document.pointerLockElement === this.canvas;
  }

  private readonly requestPointerLock = () => {
    try {
      const request = this.canvas.requestPointerLock();
      void request?.catch(this.handlePointerLockError);
    } catch {
      this.handlePointerLockError();
    }
  };

  private readonly handlePointerLockChange = () => {
    this.clearKeys();
    this.pointerLockFailed = false;
    this.updateInstructions();
  };

  private readonly handlePointerLockError = () => {
    this.clearKeys();
    this.pointerLockFailed = true;
    this.updateInstructions();
  };

  private readonly handleMouseMove = (event: MouseEvent) => {
    if (!this.isLocked()) {
      return;
    }

    this.yaw -= event.movementX * this.lookSensitivity;
    this.pitch = Math.max(
      -maxPitch,
      Math.min(maxPitch, this.pitch - event.movementY * this.lookSensitivity),
    );
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  };

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (!this.isLocked() || !controlledKeys.has(event.code)) {
      return;
    }

    event.preventDefault();
    this.keys.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    if (!controlledKeys.has(event.code)) {
      return;
    }

    this.keys.delete(event.code);
    if (this.isLocked()) {
      event.preventDefault();
    }
  };

  private readonly clearKeys = () => {
    this.keys.clear();
  };

  private updateInstructions(): void {
    if (this.instructions === undefined) {
      return;
    }

    this.instructions.textContent = this.pointerLockFailed
      ? 'Pointer Lock failed. Click to try again.'
      : this.isLocked()
        ? lockedInstructions
        : unlockedInstructions;
  }
}
