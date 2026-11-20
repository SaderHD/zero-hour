export const clientPackage = '@zero-hour/client';

export type { FreeFlyCameraOptions } from './freeFlyCamera';
export { FreeFlyCamera } from './freeFlyCamera';
export type {
  LightingParameters,
  LightingRig,
} from './lightingRig';
export { addLightingControls, createLightingRig } from './lightingRig';
export type { PerfOverlay } from './perfOverlay';
export { createPerfOverlay } from './perfOverlay';
export type {
  PostProcessing,
  PostProcessingParameters,
} from './postProcessing';
export {
  addPostProcessingControls,
  createPostProcessing,
} from './postProcessing';
export type { RendererOptions, RenderViewport } from './renderer';
export { Renderer } from './renderer';
