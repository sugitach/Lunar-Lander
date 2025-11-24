import './style.css';
import { WireframeRenderer } from './renderer/WireframeRenderer';
import { GameLoop } from './core/GameLoop';
import { KeyboardInput } from './core/KeyboardInput';
import { Debug } from './core/Debug';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  Debug.error('App element not found');
} else {
  Debug.log('Initializing game...');
  const renderer = new WireframeRenderer();
  renderer.initialize(app);

  const input = new KeyboardInput();
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const gameLoop = new GameLoop(renderer, input, viewport);

  Debug.log('Starting game loop...');
  gameLoop.start();
}
