import { Vector2 } from './Vector2';
import { PHYSICS_CONSTANTS } from './Constants';

export const GRAVITY = new Vector2(0, PHYSICS_CONSTANTS.GRAVITY_Y); // Gravity force
export const THRUST_POWER = 0.15; // Engine thrust power
export const ROTATION_SPEED = 0.05; // Radians per frame
export const FUEL_CONSUMPTION_THRUST = 1.0;
export const FUEL_CONSUMPTION_ROTATE = 0.2;

export class Physics {
    static applyGravity(velocity: Vector2, timeScale: number): Vector2 {
        return velocity.add(GRAVITY.multiply(timeScale));
    }

    static applyThrust(velocity: Vector2, angle: number, timeScale: number): Vector2 {
        // Angle 0 is pointing UP in our game (usually -PI/2 in standard math, but let's define 0 as UP for simplicity or handle it)
        // Let's stick to standard math: 0 is Right, -PI/2 is Up.
        // So if the lander is pointing Up (-PI/2), thrust vector should be (0, -1).
        const thrustDir = new Vector2(Math.cos(angle), Math.sin(angle));
        return velocity.add(thrustDir.multiply(THRUST_POWER * timeScale));
    }

    // Returns intersection point or null
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
