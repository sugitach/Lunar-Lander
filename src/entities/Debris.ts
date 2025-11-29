import { Vector2 } from '../core/Vector2';
import { PHYSICS_CONSTANTS } from '../core/Constants';

/**
 * デブリ（破片）クラス。
 * 
 * クラッシュ時に生成される破片を表現します。
 * 回転しながら移動し、画面外に出ると非アクティブになります。
 */
export class Debris {
    /** 現在の位置 */
    public position: Vector2;
    /** 現在の速度 */
    public velocity: Vector2;
    /** 現在の回転角度 */
    public rotation: number;
    /** 回転速度 */
    public rotationSpeed: number;
    /** アクティブ状態（falseの場合、マネージャーによって削除される） */
    public active: boolean = true;
    /** デブリのサイズ */
    public size: number;

    /**
     * Debrisのインスタンスを生成します。
     * 
     * @param position - 初期位置
     * @param velocity - 初期速度
     */
    constructor(position: Vector2, velocity: Vector2) {
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.5;
        this.size = 2 + Math.random() * 5;
    }

    /**
     * デブリの状態を更新します。
     * 
     * 重力を適用し、位置と回転を更新します。
     * 画面外に出た場合は非アクティブにします。
     */
    update() {
        if (!this.active) return;

        // Gravity
        this.velocity.y += PHYSICS_CONSTANTS.GRAVITY_Y;

        this.position = this.position.add(this.velocity);
        this.rotation += this.rotationSpeed;

        // Bounds check (simple)
        if (this.position.x < 0 || this.position.x > window.innerWidth || this.position.y > window.innerHeight) {
            this.active = false;
        }
    }
}
