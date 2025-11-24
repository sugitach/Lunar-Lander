import { Vector2 } from './Vector2';
import { PHYSICS_CONSTANTS } from './Constants';

/** 重力ベクトル（下向き） */
export const GRAVITY = new Vector2(0, PHYSICS_CONSTANTS.GRAVITY_Y); // Gravity force
/** エンジンの推力 */
export const THRUST_POWER = 0.15; // Engine thrust power
/** 回転速度（ラジアン/フレーム） */
export const ROTATION_SPEED = 0.05; // Radians per frame
/** 推力使用時の燃料消費量 */
export const FUEL_CONSUMPTION_THRUST = 1.0;
/** 回転時の燃料消費量 */
export const FUEL_CONSUMPTION_ROTATE = 0.2;

/**
 * 物理演算を提供する静的クラス。
 * 
 * 重力、推力、線分交差判定などの物理計算を行います。
 */
export class Physics {
    /**
     * 速度ベクトルに重力を適用します。
     * 
     * @param velocity - 現在の速度ベクトル
     * @param timeScale - 時間スケール（通常は1）
     * @returns 重力適用後の新しい速度ベクトル
     */
    static applyGravity(velocity: Vector2, timeScale: number): Vector2 {
        return velocity.add(GRAVITY.multiply(timeScale));
    }

    /**
     * 速度ベクトルに推力を適用します。
     * 
     * @param velocity - 現在の速度ベクトル
     * @param angle - 推力の方向（ラジアン）
     * @param timeScale - 時間スケール（通常は1）
     * @returns 推力適用後の新しい速度ベクトル
     */
    static applyThrust(velocity: Vector2, angle: number, timeScale: number): Vector2 {
        const thrust = new Vector2(Math.cos(angle), Math.sin(angle)).multiply(THRUST_POWER * timeScale);
        return velocity.add(thrust);
    }

    /**
     * 2つの線分の交差判定を行います。
     * 
     * 線分p1-p2と線分p3-p4が交差する場合、交点の座標を返します。
     * 交差しない場合はnullを返します。
     * 
     * @param p1 - 線分1の始点
     * @param p2 - 線分1の終点
     * @param p3 - 線分2の始点
     * @param p4 - 線分2の終点
     * @returns 交点の座標、または交差しない場合はnull
     */
    static checkLineIntersection(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2): Vector2 | null {
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;

        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denom === 0) return null;

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
            return new Vector2(x1 + ua * (x2 - x1), y1 + ua * (y2 - y1));
        }
        return null;
    }
}
