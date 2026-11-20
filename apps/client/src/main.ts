import {
  BoxGeometry,
  Color,
  Mesh,
  MeshNormalMaterial,
  PerspectiveCamera,
  Scene,
} from 'three';
import { Renderer } from './renderer';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (canvas === null) {
  throw new Error('Missing #game canvas.');
}

const scene = new Scene();
scene.background = new Color(0x101318);

const camera = new PerspectiveCamera(75, 1, 0.1, 100);
camera.position.z = 4;

const geometry = new BoxGeometry(1.75, 1.75, 1.75);
const material = new MeshNormalMaterial({ flatShading: true });
const cube = new Mesh(geometry, material);
cube.rotation.set(0.5, 0.7, 0);
scene.add(cube);

const renderer = new Renderer(canvas, scene, camera);
renderer.start((deltaSeconds) => {
  cube.rotation.x += deltaSeconds * 0.6;
  cube.rotation.y += deltaSeconds;
});

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    renderer.dispose();
    geometry.dispose();
    material.dispose();
  });
}
