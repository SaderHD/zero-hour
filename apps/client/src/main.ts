import GUI from 'lil-gui';
import { FreeFlyCamera } from './freeFlyCamera';
import { addLightingControls, createLightingRig } from './lightingRig';
import { createPerfOverlay } from './perfOverlay';
import { addPostProcessingControls } from './postProcessing';
import { createPrimitiveDebugScene } from './primitiveDebugScene';
import { Renderer } from './renderer';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (canvas === null) {
  throw new Error('Missing #game canvas.');
}
const instructions = document.querySelector<HTMLElement>('#fly-controls');
if (instructions === null) {
  throw new Error('Missing #fly-controls instructions.');
}

const debugScene = createPrimitiveDebugScene();
const lightingRig = createLightingRig(debugScene.scene);
const gui = new GUI({ title: 'Scene mood' });
addLightingControls(gui, lightingRig);
const freeFlyCamera = new FreeFlyCamera(debugScene.camera, canvas, {
  instructions,
});
const renderer = new Renderer(canvas, debugScene.scene, debugScene.camera);
const perfOverlay = createPerfOverlay(document.body);
addPostProcessingControls(gui, renderer.postProcessing);
renderer.start((deltaSeconds) => {
  debugScene.update(deltaSeconds);
  freeFlyCamera.update(deltaSeconds);
  perfOverlay?.update(deltaSeconds, renderer.renderer.info.render);
});

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    renderer.dispose();
    perfOverlay?.dispose();
    freeFlyCamera.dispose();
    gui.destroy();
    lightingRig.dispose();
    debugScene.dispose();
  });
}
