import './style.css';
import { WireframeRenderer } from './renderer/WireframeRenderer';
import { GameLoop } from './core/GameLoop';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  console.log("App element found, initializing game...");
  const renderer = new WireframeRenderer();
  renderer.initialize(app);

  new GameLoop(renderer);
  console.log("Game loop started.");
  // Game loop starts automatically in constructor
} else {
  console.error("App element NOT found!");
}
