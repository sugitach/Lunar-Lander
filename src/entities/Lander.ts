import { Vector2 } from '../core/Vector2';
import { Physics, ROTATION_SPEED, FUEL_CONSUMPTION_THRUST, FUEL_CONSUMPTION_ROTATE } from '../core/Physics';
import type { IInputSource } from '../core/IInputSource';
import { GameState } from '../core/GameState';
import { LANDER_CONSTANTS, DIFFICULTY_SETTINGS, PHYSICS_CONSTANTS } from '../core/Constants';

/**
 * 着陸船（Lander）クラス。
 * 
 * プレイヤーが操作する機体の状態（位置、速度、回転）を管理し、
 * 物理演算と入力に基づく更新を行います。
 */
export class Lander {
    /** 現在の位置 */
    public position: Vector2;
    /** 現在の速度 */
    public velocity: Vector2;
    /** 現在の回転角度（ラジアン）。-PI/2 が上向き（0度）。 */
    public rotation: number;
    /** 前フレームの位置（衝突判定の精度向上用） */
    public previousPosition: Vector2;
    /** 前フレームの回転角度 */
    public previousRotation: number;
    /** 機体の幅 */
    public width: number = 20;
    /** 機体の高さ */
    public height: number = 20;

    /** 機体の質量 (kg) */
    public mass: number = 1000;

    /**
     * Landerのインスタンスを生成します。
     * 
     * @param startX - 初期X座標
     * @param startY - 初期Y座標
     */
    constructor(startX: number, startY: number) {
        this.position = new Vector2(startX, startY);
        this.previousPosition = new Vector2(startX, startY);
        this.velocity = new Vector2(0, 0);
        this.rotation = -Math.PI / 2; // Pointing UP
        this.previousRotation = -Math.PI / 2;
    }

    /**
     * 機体の状態を更新します。
     * 
     * 入力に応じて回転や推力を適用し、重力の影響を計算します。
     * 燃料切れの場合は重力のみが適用されます。
     * 
     * @param input - 入力ソース
     * @param gameState - ゲーム状態（燃料消費用）
     * @param deltaTime - 前フレームからの経過時間（秒）
     */
    update(input: IInputSource, gameState: GameState, deltaTime: number): void {
        // Save previous state for collision detection
        this.previousPosition = this.position.clone();
        this.previousRotation = this.rotation;

        // Scale factors for frame-rate independence
        const frameScale = deltaTime * LANDER_CONSTANTS.TARGET_FPS;

        // Get difficulty settings
        const settings = DIFFICULTY_SETTINGS[gameState.difficulty];
        const gravityAccel = settings.gravity;
        const thrustForce = settings.thrust;
        this.mass = settings.mass;

        if (gameState.isFuelEmpty()) {
            // Just gravity if no fuel
            this.velocity = Physics.applyGravity(this.velocity, gravityAccel, deltaTime);
            // Update position using TIME_SCALE to match the accelerated simulation
            this.position = this.position.add(this.velocity.multiply(deltaTime * PHYSICS_CONSTANTS.TIME_SCALE));
            return;
        }

        // Rotation
        if (input.isRotatingLeft) {
            this.rotation -= ROTATION_SPEED * frameScale;
            gameState.consumeFuel(FUEL_CONSUMPTION_ROTATE * frameScale);
        }
        if (input.isRotatingRight) {
            this.rotation += ROTATION_SPEED * frameScale;
            gameState.consumeFuel(FUEL_CONSUMPTION_ROTATE * frameScale);
        }

        // Thrust
        if (input.isThrusting) {
            this.velocity = Physics.applyThrust(this.velocity, this.rotation, thrustForce, this.mass, deltaTime);
            gameState.consumeFuel(FUEL_CONSUMPTION_THRUST * frameScale);
        }

        // Gravity
        this.velocity = Physics.applyGravity(this.velocity, gravityAccel, deltaTime);

        // Update position
        this.position = this.position.add(this.velocity.multiply(deltaTime * PHYSICS_CONSTANTS.TIME_SCALE));
    }
}
