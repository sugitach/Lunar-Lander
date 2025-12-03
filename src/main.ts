import './style.css';
import { GameLoop } from './core/GameLoop';
import { Debug } from './core/Debug';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (!app) {
    Debug.error('App element not found');
  } else {
    Debug.log('Initializing game...');

    try {
      const gameLoop = new GameLoop(app);

      Debug.log('Starting game loop...');
      gameLoop.start();
    } catch (error) {
      console.error('[MAIN] Error during initialization:', error);
    }
  }
});
