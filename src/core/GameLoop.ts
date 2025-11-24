import { GameState, GameStatus } from './GameState';
import type { IInputSource } from './IInputSource';
import type { IRenderer } from '../renderer/IRenderer';
import { Lander } from '../entities/Lander';
import { Terrain } from '../entities/Terrain';
import { Debug } from './Debug';
import { CollisionDetector } from './CollisionDetector';
import { GameStateManager } from './GameStateManager';
import { DebrisManager } from './DebrisManager';
import type { ViewportSize } from './ViewportSize';

export class GameLoop {
    private gameState: GameState;
    private input: IInputSource;
    private renderer: IRenderer;
    private lander: Lander;
    private terrain: Terrain;
    private viewport: ViewportSize;
    private lastTime: number = 0;
    private boundLoop: (timestamp: number) => void;
    private isRunning = false;

    // Manager classes
    private collisionDetector: CollisionDetector;
    private gameStateManager: GameStateManager;
    private debrisManager: DebrisManager;

    constructor(renderer: IRenderer, input: IInputSource, viewport: ViewportSize) {
        this.renderer = renderer;
        this.input = input;
        this.viewport = viewport;
        this.gameState = new GameState();
        this.gameState.status = GameStatus.PLAYING;
        this.terrain = new Terrain(viewport.width, viewport.height);
        this.lander = new Lander(viewport.width / 2, 100);

        // Initialize managers
        this.collisionDetector = new CollisionDetector();
        this.gameStateManager = new GameStateManager();
        this.debrisManager = new DebrisManager();

        // Bind loop once for performance
        this.boundLoop = this.loop.bind(this);
    }

    /**
     * ゲームループを開始します。
     */
    start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.boundLoop);
    }

    /**
     * ゲームループを停止します。
     */
    stop(): void {
        this.isRunning = false;
    }

    /**
     * テスト用: 1フレームだけ更新します。
     * 
     * @param deltaTime - 経過時間（秒）
     */
    updateOnce(deltaTime: number): void {
        this.update(deltaTime);
    }

    private loop(timestamp: number): void {
        if (!this.isRunning) return;

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

        this.collisionDetector.checkBoundaries(this.lander, this.viewport.width, this.viewport.height);

        // Check floor crash
        if (this.lander.position.y > this.viewport.height) {
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

        this.renderer.drawUI(this.gameState, this.lander.velocity, this.viewport.height - this.lander.position.y);

        if (this.gameState.status === GameStatus.LANDED) {
            this.renderer.drawMessage("LANDED", `Score: ${this.gameState.score} (Press Space)`);
        } else if (this.gameState.status === GameStatus.CRASHED) {
            this.renderer.drawMessage("CRASHED", "Press Space to Restart");
        }
    }

    private resetGame(): void {
        this.gameState = new GameState();
        this.gameState.status = GameStatus.PLAYING;
        this.terrain = new Terrain(this.viewport.width, this.viewport.height);
        this.lander = new Lander(this.viewport.width / 2, 100);
        this.debrisManager.clear();
    }
}
