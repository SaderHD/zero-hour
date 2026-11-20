import GUI from 'lil-gui';
import { addLightingControls, createLightingRig } from './lightingRig';
import { createPrimitiveDebugScene } from './primitiveDebugScene';
import { Renderer } from './renderer';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (canvas === null) {
  throw new Error('Missing #game canvas.');
}

const debugScene = createPrimitiveDebugScene();
const lightingRig = createLightingRig(debugScene.scene);
const gui = new GUI({ title: 'Scene mood' });
addLightingControls(gui, lightingRig);
const renderer = new Renderer(canvas, debugScene.scene, debugScene.camera);
renderer.start(debugScene.update);

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    renderer.dispose();
    gui.destroy();
    lightingRig.dispose();
    debugScene.dispose();
  });
}
