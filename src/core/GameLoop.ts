import { GameState, GameStatus } from './GameState';
import { Input } from './Input';
import type { IRenderer } from '../renderer/IRenderer';
import { Lander } from '../entities/Lander';
import { Terrain } from '../entities/Terrain';
import { Debug } from './Debug';
import { CollisionDetector } from './CollisionDetector';
import { GameStateManager } from './GameStateManager';
import { DebrisManager } from './DebrisManager';

export class GameLoop {
    private gameState: GameState;
    private input: Input;
    private renderer: IRenderer;
    private lander: Lander;
    private terrain: Terrain;
    private lastTime: number = 0;
    private boundLoop: (timestamp: number) => void;

    // Manager classes
    private collisionDetector: CollisionDetector;
    private gameStateManager: GameStateManager;
    private debrisManager: DebrisManager;

    constructor(renderer: IRenderer) {
        this.renderer = renderer;
        this.input = new Input();
        this.gameState = new GameState();
        this.gameState.status = GameStatus.PLAYING; // Start playing immediately
        this.terrain = new Terrain(window.innerWidth, window.innerHeight);
        this.lander = new Lander(window.innerWidth / 2, 100); // Initial position

        // Initialize managers
        this.collisionDetector = new CollisionDetector();
        this.gameStateManager = new GameStateManager();
        this.debrisManager = new DebrisManager();

        // Bind loop once for performance
        this.boundLoop = this.loop.bind(this);
        // Start loop
        requestAnimationFrame(this.boundLoop);
    }

    private loop(timestamp: number) {
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // Debug log every ~1 second
        if (Math.random() < 0.01) {
            Debug.log(`Loop running. Status: ${this.gameState.status}, Lander: (${this.lander.position.x}, ${this.lander.position.y}), Terrain points: ${this.terrain.points.length}`);
        }

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.boundLoop);
    }

    private update(_deltaTime: number) {
        // Restart Check
        if (this.input.isRestarting && (this.gameState.status === GameStatus.CRASHED || this.gameState.status === GameStatus.LANDED)) {
            this.resetGame();
            return;
        }

        if (this.gameState.status === GameStatus.PLAYING) {
            // Input handling
            // Lander handles its own physics updates based on input
            this.lander.update(this.input, this.gameState, _deltaTime);

            // Collision Detection
            this.checkCollisions();
        }

        // Update Debris (always, even after crash)
        this.debrisManager.update(this.terrain);

        // Update HUD data
        // (In a real app, we might use a reactive store, but here we just pass data to renderer)
    }

    private checkCollisions() {
        const collision = this.collisionDetector.checkLanderTerrainCollision(this.lander, this.terrain);

        if (collision.type === 'foot' && collision.footResult) {
            this.handleLandingOrCrash(collision.footResult.segmentIndex);
            return;
        }

        if (collision.type === 'body') {
            this.crash();
            return;
        }

        this.collisionDetector.checkBoundaries(this.lander, window.innerWidth, window.innerHeight);

        // Check floor crash
        if (this.lander.position.y > window.innerHeight) {
            this.crash();
        }
    }

    private handleLandingOrCrash(segmentIndex: number) {
        this.gameStateManager.handleLanding(segmentIndex, this.lander, this.terrain, this.gameState);

        if (this.gameState.status !== GameStatus.LANDED) {
            // Landing failed, crash
            this.crash();
        }
    }

    private crash() {
        const debris = this.gameStateManager.handleCrash(this.lander, this.gameState);
        debris.forEach(d => this.debrisManager.spawn(d.position, 1));
    }

    private render() {
        this.renderer.clear();
        this.renderer.drawTerrain(this.terrain.points, this.terrain.pads);

        if (this.gameState.status === GameStatus.CRASHED) {
            // Draw debris
            this.renderer.drawDebris(this.debrisManager.getAll());
        }

        this.renderer.drawLander(
            this.lander.position,
            this.lander.rotation,
            this.input.isThrusting && this.gameState.status === GameStatus.PLAYING && !this.gameState.isFuelEmpty(),
            this.gameState.status === GameStatus.CRASHED,
            this.gameStateManager.isSafeToLand(this.lander)
        );

        this.renderer.drawUI(this.gameState, this.lander.velocity, window.innerHeight - this.lander.position.y);

        if (this.gameState.status === GameStatus.LANDED) {
            this.renderer.drawMessage("LANDED", `Score: ${this.gameState.score} (Press Space)`);
        } else if (this.gameState.status === GameStatus.CRASHED) {
            this.renderer.drawMessage("CRASHED", "Press Space to Restart");
        }
    }

    private resetGame() {
        this.gameState = new GameState();
        this.gameState.status = GameStatus.PLAYING;
        this.terrain = new Terrain(window.innerWidth, window.innerHeight);
        this.lander = new Lander(window.innerWidth / 2, 100);
        this.debrisManager.clear();
    }
}
