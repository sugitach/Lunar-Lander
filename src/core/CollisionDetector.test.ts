// src/core/CollisionDetector.test.ts
import { describe, it, expect } from 'vitest';
import { CollisionDetector } from './CollisionDetector';
import { Lander } from '../entities/Lander';
import { Terrain } from '../entities/Terrain';
import { Vector2 } from './Vector2';

// Simple mock terrain: flat ground at y = 500
class MockTerrain extends Terrain {
    constructor() {
        super(800, 600);
        this.points = [new Vector2(0, 500), new Vector2(800, 500)];
    }
}

describe('CollisionDetector', () => {
    it('detects foot collision with ground', () => {
        const detector = new CollisionDetector();
        const terrain = new MockTerrain();
        const lander = new Lander(400, 480); // positioned so foot touches ground
        // Set previous position slightly above to create a downward foot movement into the terrain
        lander.previousPosition = new Vector2(400, 470);
        const result = detector.checkLanderTerrainCollision(lander, terrain);
        expect(result.type).toBe('foot');
        if (result.type === 'foot') {
            expect(result.footResult.isLeftFoot || result.footResult.isLeftFoot === false).toBeTruthy();
        }
    });
});
