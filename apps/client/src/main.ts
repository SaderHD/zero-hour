import './style.css';
import { mountCanvas } from './index';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (canvas === null) {
  throw new Error('Missing #game canvas.');
}

const unmountCanvas = mountCanvas(canvas);

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(unmountCanvas);
}
