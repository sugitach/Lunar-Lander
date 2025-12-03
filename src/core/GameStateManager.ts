import { Lander } from '../entities/Lander';
import { Terrain } from '../entities/Terrain';
import { GameState, GameStatus } from './GameState';
import { Vector2 } from './Vector2';
import { Debris } from '../entities/Debris';
import { LANDER_CONSTANTS } from './Constants';

const HIGH_SCORE_KEY = 'moon-lander-high-score';

/**
 * ゲーム状態の管理を担当するクラス。
 * 
 * 着陸判定、クラッシュ処理、安全着陸判定を行います。
 */
export class GameStateManager {
    /**
     * ゲーム状態を初期化します。
     * 
     * @param gameState - ゲーム状態
     */
    initialize(gameState: GameState): void {
        gameState.highScore = this.loadHighScore();
    }

    /**
     * ハイスコアを読み込みます。
     */
    private loadHighScore(): number {
        try {
            const stored = localStorage.getItem(HIGH_SCORE_KEY);
            return stored ? parseInt(stored, 10) : 0;
        } catch (e) {
            console.warn('Failed to load high score:', e);
            return 0;
        }
    }

    /**
     * ハイスコアを保存します。
     */
    private saveHighScore(score: number): void {
        try {
            localStorage.setItem(HIGH_SCORE_KEY, Math.floor(score).toString());
        } catch (e) {
            console.warn('Failed to save high score:', e);
        }
    }
    /**
     * 着陸処理を行います。
     * 
     * 着陸パッド上で安全な速度・角度の場合、着陸成功としてスコアを加算します。
     * 
     * @param segmentIndex - 着陸した地形セグメントのインデックス
     * @param lander - 着陸船
     * @param terrain - 地形
     * @param gameState - ゲーム状態
     */
    handleLanding(segmentIndex: number, lander: Lander, terrain: Terrain, gameState: GameState): void {
        // Check if this segment is part of a pad
        const pad = terrain.pads.find(p => segmentIndex >= p.startIndex && segmentIndex < p.endIndex);

        if (pad && this.isSafeToLand(lander)) {
            // Successful landing!
            gameState.status = GameStatus.LANDED;
            gameState.score += Math.floor((100 + gameState.fuel / 10) * pad.multiplier);

            if (gameState.score > gameState.highScore) {
                gameState.highScore = gameState.score;
                this.saveHighScore(gameState.highScore);
            }

            // Snap to pad
            const padY = terrain.points[segmentIndex].y;
            lander.position.y = padY - LANDER_CONSTANTS.BODY_HEIGHT;
            lander.velocity = new Vector2(0, 0);
            lander.rotation = -Math.PI / 2;
        }
    }

    /**
     * クラッシュ処理を行います。
     * 
     * ゲーム状態をクラッシュに設定し、デブリを生成します。
     * 
     * @param lander - 着陸船
     * @param gameState - ゲーム状態
     * @returns 生成されたデブリの配列
     */
    handleCrash(lander: Lander, gameState: GameState): Debris[] {
        gameState.status = GameStatus.CRASHED;

        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            this.saveHighScore(gameState.highScore);
        }

        // Spawn Debris
        const debris: Debris[] = [];
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            const vel = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
            debris.push(new Debris(lander.position, vel));
        }

        return debris;
    }

    /**
     * 安全に着陸できる速度・角度かどうかを判定します。
     * 
     * @param lander - 着陸船
     * @returns 安全に着陸できる場合true
     */
    isSafeToLand(lander: Lander): boolean {
        // 着陸可能な閾値（ピクセル/秒単位）
        // TIME_SCALEの影響で実質的な速度感が変わっているため、閾値を調整
        // 以前: 2.0 pixels/s -> 新しい物理モデルでは 8.0 pixels/s に緩和
        const maxSafeVelocity = 8.0; // pixels/s
        const maxSafeRotation = 0.3; // radians (~17 degrees)
        const upright = -Math.PI / 2;

        const velocityMagnitude = Math.sqrt(lander.velocity.x ** 2 + lander.velocity.y ** 2);
        const rotationDiff = Math.abs(lander.rotation - upright);

        return velocityMagnitude < maxSafeVelocity && rotationDiff < maxSafeRotation;
    }
}
