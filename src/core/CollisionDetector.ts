import { Lander } from '../entities/Lander';
import { Terrain } from '../entities/Terrain';
import { Vector2 } from './Vector2';
import { Physics } from './Physics';
import { LANDER_CONSTANTS } from './Constants';

export interface FootCollisionResult {
    segmentIndex: number;
    point: Vector2;
    isLeftFoot: boolean;
}

export class CollisionDetector {
    checkLanderTerrainCollision(lander: Lander, terrain: Terrain): { type: 'foot' | 'body' | null; footResult?: FootCollisionResult } {
        const footCollision = this.checkFootCollisions(lander, terrain);
        if (footCollision) {
            return { type: 'foot', footResult: footCollision };
        }

        if (this.checkBodyCollision(lander, terrain)) {
            return { type: 'body' };
        }

        return { type: null };
    }

    checkBoundaries(lander: Lander, width: number, height: number): void {
        // Out of bounds - wrap X
        if (lander.position.x < 0) lander.position.x += width;
        if (lander.position.x > width) lander.position.x -= width;

        // Floor is crash if not handled by terrain check
        if (lander.position.y > height) {
            // This will be handled by GameStateManager
        }
    }

    private calculateFootPositions(lander: Lander) {
        const cos = Math.cos(lander.rotation + Math.PI / 2);
        const sin = Math.sin(lander.rotation + Math.PI / 2);

        const transform = (x: number, y: number) => {
            return new Vector2(
                lander.position.x + x * cos - y * sin,
                lander.position.y + x * sin + y * cos
            );
        };

        const prevCos = Math.cos(lander.previousRotation + Math.PI / 2);
        const prevSin = Math.sin(lander.previousRotation + Math.PI / 2);

        const transformPrev = (x: number, y: number) => {
            return new Vector2(
                lander.previousPosition.x + x * prevCos - y * prevSin,
                lander.previousPosition.y + x * prevSin + y * prevCos
            );
        };

        return {
            leftFoot: transform(LANDER_CONSTANTS.FOOT_LEFT_X, LANDER_CONSTANTS.FOOT_LEFT_Y),
            rightFoot: transform(LANDER_CONSTANTS.FOOT_RIGHT_X, LANDER_CONSTANTS.FOOT_RIGHT_Y),
            prevLeftFoot: transformPrev(LANDER_CONSTANTS.FOOT_LEFT_X, LANDER_CONSTANTS.FOOT_LEFT_Y),
            prevRightFoot: transformPrev(LANDER_CONSTANTS.FOOT_RIGHT_X, LANDER_CONSTANTS.FOOT_RIGHT_Y)
        };
    }

    private checkFootCollisions(lander: Lander, terrain: Terrain): FootCollisionResult | null {
        const { leftFoot, rightFoot, prevLeftFoot, prevRightFoot } = this.calculateFootPositions(lander);

        for (let i = 0; i < terrain.points.length - 1; i++) {
            const p1 = terrain.points[i];
            const p2 = terrain.points[i + 1];

            // Check Left Foot
            let intersection = Physics.checkLineIntersection(prevLeftFoot, leftFoot, p1, p2);
            if (intersection) {
                return { segmentIndex: i, point: intersection, isLeftFoot: true };
            }

            // Check Right Foot
            intersection = Physics.checkLineIntersection(prevRightFoot, rightFoot, p1, p2);
            if (intersection) {
                return { segmentIndex: i, point: intersection, isLeftFoot: false };
            }
        }

        return null;
    }

    private checkBodyCollision(lander: Lander, terrain: Terrain): boolean {
        const center = lander.position;
        const prevCenter = lander.previousPosition;

        for (let i = 0; i < terrain.points.length - 1; i++) {
            const p1 = terrain.points[i];
            const p2 = terrain.points[i + 1];

            const intersection = Physics.checkLineIntersection(prevCenter, center, p1, p2);
            if (intersection) {
                return true;
            }
        }

        return false;
    }
}
