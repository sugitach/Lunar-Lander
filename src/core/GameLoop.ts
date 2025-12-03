import { GameState, GameStatus, Difficulty } from './GameState';
import { WireframeRenderer } from '../renderer/WireframeRenderer';
import { KeyboardInput } from './KeyboardInput';
import { Lander } from '../entities/Lander';
import { Terrain } from '../entities/Terrain';
import { CollisionDetector } from './CollisionDetector';
import { GameStateManager } from './GameStateManager';
import { DebrisManager } from './DebrisManager';
import type { ViewportSize } from './ViewportSize';
import { DIFFICULTY_SETTINGS, SCORE_SCREEN_CONSTANTS, CUSTOM_SETTINGS_RANGES, type DifficultySetting } from './Constants';

/**
 * ゲームのメインループを管理するクラス。
 * 
 * 各フレームでの更新、衝突判定、レンダリングを制御します。
 * CollisionDetector、GameStateManager、DebrisManagerを使用して
 * 責務を分離しています。
 */
export class GameLoop {
    private lastTime: number = 0;
    private boundLoop: (timestamp: number) => void;
    private isRunning = false;

    private gameState: GameState;
    private input: KeyboardInput;
    private renderer: WireframeRenderer;
    private lander: Lander;
    private terrain: Terrain;
    private viewport: ViewportSize;

    // Manager classes
    private collisionDetector: CollisionDetector;
    private gameStateManager: GameStateManager;
    private debrisManager: DebrisManager;

    // Difficulty Selection State
    private difficultySelectionIndex: number = 1; // Default to NORMAL
    private customSettingsIndex: number = 0; // Default to first item
    private lastInputTime: number = 0;
    private readonly INPUT_DELAY: number = 200; // ms
    private waitForKeyRelease: boolean = false;

    // Score screen state
    private scoreScreenStartTime: number = 0;
    private restartReady: boolean = false;

    // Fixed timestep for physics
    private readonly TIMESTEP = 1 / 60; // 60 FPS
    private accumulator = 0;

    /**
     * GameLoopのインスタンスを生成します。
     * 
     * @param container - ゲームを描画するコンテナ要素
     */
    constructor(container: HTMLElement) {
        this.viewport = { width: window.innerWidth, height: window.innerHeight };

        this.gameState = new GameState();
        this.renderer = new WireframeRenderer();
        this.renderer.initialize(container);
        this.input = new KeyboardInput();
        this.lander = new Lander(this.viewport.width / 2, 100);
        this.terrain = new Terrain(this.viewport.width, this.viewport.height);

        this.collisionDetector = new CollisionDetector();
        this.gameStateManager = new GameStateManager();
        this.debrisManager = new DebrisManager();

        this.boundLoop = this.loop.bind(this);

        // Initialize game
        this.resetGame();
    }

    /**
     * ゲームループを開始します。
     */
    public start(): void {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.boundLoop);
        }
    }

    /**
     * ゲームループを停止します。
     */
    public stop(): void {
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

    /**
     * メインループ関数。
     * 
     * @param timestamp - 現在の時間（ミリ秒）
     */
    private loop(timestamp: number): void {
        if (!this.isRunning) return;

        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.accumulator += deltaTime;

        while (this.accumulator >= this.TIMESTEP) {
            this.update(this.TIMESTEP);
            this.accumulator -= this.TIMESTEP;
        }

        this.render();

        requestAnimationFrame(this.boundLoop);
    }

    /**
     * ゲームの状態を更新します。
     * 
     *
     * @param deltaTime - 前フレームからの経過時間（秒）
     */
    private update(deltaTime: number) {
        const now = performance.now();

        switch (this.gameState.status) {
            case GameStatus.SELECTING_DIFFICULTY:
                this.updateDifficultySelection(now);
                break;
            case GameStatus.SETTING_CUSTOM_DIFFICULTY:
                this.updateCustomSettings(now);
                break;
            case GameStatus.PLAYING:
                this.updatePlaying(deltaTime);
                break;
            case GameStatus.CRASHED:
            case GameStatus.LANDED:
                this.updateGameOver(now);
                break;
        }

        // Always update debris
        this.debrisManager.update(this.terrain);
    }

    private updateDifficultySelection(now: number) {
        // Wait for key release before accepting new input
        if (this.waitForKeyRelease) {
            if (!this.input.hasAnyInput) {
                this.waitForKeyRelease = false;
            }
            return;
        }

        if (now - this.lastInputTime > this.INPUT_DELAY) {
            const difficulties = [Difficulty.EASY, Difficulty.NORMAL, Difficulty.HARD, Difficulty.CUSTOM];

            if (this.input.isUp) {
                this.difficultySelectionIndex = (this.difficultySelectionIndex - 1 + difficulties.length) % difficulties.length;
                this.lastInputTime = now;
            } else if (this.input.isDown) {
                this.difficultySelectionIndex = (this.difficultySelectionIndex + 1) % difficulties.length;
                this.lastInputTime = now;
            } else if (this.input.isConfirm) {
                const selectedDifficulty = difficulties[this.difficultySelectionIndex];

                if (selectedDifficulty === Difficulty.CUSTOM) {
                    this.gameState.status = GameStatus.SETTING_CUSTOM_DIFFICULTY;
                    this.customSettingsIndex = 0;
                    this.waitForKeyRelease = true; // Wait for release before custom settings input
                } else {
                    this.gameState.difficulty = selectedDifficulty;
                    this.gameState.status = GameStatus.PLAYING;
                    this.gameState.fuel = DIFFICULTY_SETTINGS[selectedDifficulty].initialFuel;
                    this.gameState.gameStartTime = performance.now();
                }
                this.lastInputTime = now;
            }

            // Update preview difficulty for renderer
            this.gameState.difficulty = difficulties[this.difficultySelectionIndex];
        }
    }

    private updateCustomSettings(now: number) {
        // Wait for key release before accepting new input
        if (this.waitForKeyRelease) {
            if (!this.input.hasAnyInput) {
                this.waitForKeyRelease = false;
            }
            return;
        }

        // Custom Settings Logic
        if (now - this.lastInputTime > this.INPUT_DELAY) {
            const settings = DIFFICULTY_SETTINGS.CUSTOM;
            const ranges = CUSTOM_SETTINGS_RANGES;
            const itemCount = 5; // Gravity, Thrust, Fuel, Start, Cancel

            if (this.input.isUp) {
                this.customSettingsIndex = (this.customSettingsIndex - 1 + itemCount) % itemCount;
                this.lastInputTime = now;
            } else if (this.input.isDown) {
                this.customSettingsIndex = (this.customSettingsIndex + 1) % itemCount;
                this.lastInputTime = now;
            } else if (this.input.isRotatingLeft) { // Left Arrow
                this.adjustCustomSetting(settings, ranges, -1);
                this.lastInputTime = now;
            } else if (this.input.isRotatingRight) { // Right Arrow
                this.adjustCustomSetting(settings, ranges, 1);
                this.lastInputTime = now;
            } else if (this.input.isConfirm) {
                if (this.customSettingsIndex === 3) { // Start Game
                    this.gameState.difficulty = Difficulty.CUSTOM;
                    this.gameState.status = GameStatus.PLAYING;
                    this.gameState.fuel = settings.initialFuel;
                    this.gameState.gameStartTime = performance.now();
                } else if (this.customSettingsIndex === 4) { // Cancel
                    this.gameState.status = GameStatus.SELECTING_DIFFICULTY;
                    this.waitForKeyRelease = true;
                }
                this.lastInputTime = now;
            }
        }
    }

    private updatePlaying(deltaTime: number) {
        this.lander.update(this.input, this.gameState, deltaTime);

        // Update stats
        this.gameState.playTime = (performance.now() - this.gameState.gameStartTime) / 1000;

        // Calculate speed
        const speed = this.lander.velocity.length();
        if (speed > this.gameState.maxSpeed) {
            this.gameState.maxSpeed = speed;
        }

        // Calculate distance (very rough approximation of path length)
        const dx = this.lander.position.x - this.lander.previousPosition.x;
        const dy = this.lander.position.y - this.lander.previousPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.gameState.totalDistance += distance;

        // Collision Detection
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

    private updateGameOver(now: number) {
        // Score screen logic
        if (this.scoreScreenStartTime === 0) {
            this.scoreScreenStartTime = now;
            this.gameState.endTime = now; // Mark the time the game ended
            this.restartReady = false; // Reset restart ready flag
        }

        const elapsed = now - this.scoreScreenStartTime;
        const canContinue = elapsed >= SCORE_SCREEN_CONSTANTS.WAIT_TIME;

        // Check if keys are released to enable restart
        if (!this.input.hasAnyInput) {
            this.restartReady = true;
        }

        // Check for restart input (only if ready)
        if (canContinue && this.restartReady && this.input.isRestarting) {
            this.resetGame();
            return;
        }

        // Check for ESC key skip (before 5 seconds)
        if (!canContinue && this.input.isEscaping) {
            this.resetGame();
            return;
        }
    }



    /**
     * 着陸またはクラッシュの判定結果を処理します。
     * 
     * @param segmentIndex - 衝突した地形セグメントのインデックス
     */
    private handleLandingOrCrash(segmentIndex: number) {
        this.gameStateManager.handleLanding(segmentIndex, this.lander, this.terrain, this.gameState);

        if (this.gameState.status !== GameStatus.LANDED) {
            // Landing failed, crash
            this.crash();
        }
    }

    /**
     * クラッシュ時の処理を行います。
     */
    private crash() {
        const debris = this.gameStateManager.handleCrash(this.lander, this.gameState);
        debris.forEach(d => this.debrisManager.spawn(d.position, 1));
    }

    /**
     * ゲーム画面を描画します。
     */
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

        // Display score screen for LANDED or CRASHED states
        if (this.gameState.status === GameStatus.LANDED || this.gameState.status === GameStatus.CRASHED) {
            const elapsed = this.scoreScreenStartTime > 0 ? performance.now() - this.scoreScreenStartTime : 0;
            const canContinue = elapsed >= SCORE_SCREEN_CONSTANTS.WAIT_TIME;
            this.renderer.drawScoreScreen(this.gameState, canContinue);
        } else if (this.gameState.status === GameStatus.SELECTING_DIFFICULTY) {
            this.renderer.drawDifficultyScreen(this.gameState.difficulty);
        } else if (this.gameState.status === GameStatus.SETTING_CUSTOM_DIFFICULTY) {
            this.renderer.drawCustomSettingsScreen(DIFFICULTY_SETTINGS.CUSTOM, this.customSettingsIndex);
        }
    }

    /**
     * ゲームをリセットして再開します。
     */
    private resetGame(): void {
        this.gameState = new GameState();
        this.gameState.status = GameStatus.SELECTING_DIFFICULTY;
        this.gameState.gameStartTime = performance.now();
        this.terrain = new Terrain(this.viewport.width, this.viewport.height);
        this.lander = new Lander(this.viewport.width / 2, 100);

        this.debrisManager.clear();
        this.gameStateManager.initialize(this.gameState);

        // Reset score screen state
        this.scoreScreenStartTime = 0;

        // Reset difficulty selection state
        this.difficultySelectionIndex = 1; // Default to NORMAL
        this.lastInputTime = performance.now(); // Prevent immediate input
        this.waitForKeyRelease = true; // Wait for key release on reset
    }

    private adjustCustomSetting(settings: DifficultySetting, ranges: typeof CUSTOM_SETTINGS_RANGES, direction: number): void {
        if (this.customSettingsIndex === 0) { // Gravity
            settings.gravity = Math.max(ranges.gravity.min, Math.min(ranges.gravity.max, settings.gravity + ranges.gravity.step * direction));
        } else if (this.customSettingsIndex === 1) { // Thrust
            settings.thrust = Math.max(ranges.thrust.min, Math.min(ranges.thrust.max, settings.thrust + ranges.thrust.step * direction));
        } else if (this.customSettingsIndex === 2) { // Fuel
            settings.initialFuel = Math.max(ranges.initialFuel.min, Math.min(ranges.initialFuel.max, settings.initialFuel + ranges.initialFuel.step * direction));
        }

        // Recalculate Score Multiplier
        this.calculateScoreMultiplier(settings);
    }

    private calculateScoreMultiplier(settings: DifficultySetting): void {
        const norm = DIFFICULTY_SETTINGS.NORMAL;

        // Coefficients
        const C_g = 1.0; // 1 m/s^2 increase -> +1.0 multiplier
        const C_t = 0.0002; // 1000 N decrease -> +0.2 multiplier
        const C_f = 0.001; // 100 fuel decrease -> +0.1 multiplier

        const deltaG = settings.gravity - norm.gravity;
        const deltaT = norm.thrust - settings.thrust; // Higher thrust = easier = lower score
        const deltaF = norm.initialFuel - settings.initialFuel; // More fuel = easier = lower score

        let multiplier = 1.0 + (deltaG * C_g) + (deltaT * C_t) + (deltaF * C_f);

        // Clamp to reasonable values
        settings.scoreMultiplier = Math.max(0.1, Math.min(10.0, multiplier));
    }
}
