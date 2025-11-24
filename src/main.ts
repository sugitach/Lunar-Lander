import './style.css';
import { WireframeRenderer } from './renderer/WireframeRenderer';
import { GameLoop } from './core/GameLoop';
import { Debug } from './core/Debug';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  Debug.log("App element found, initializing game...");
  const renderer = new WireframeRenderer();
  renderer.initialize(app);

  new GameLoop(renderer);
  Debug.log("Game loop started.");
  // Game loop starts automatically in constructor
} else {
  Debug.error("App element NOT found!");
}
