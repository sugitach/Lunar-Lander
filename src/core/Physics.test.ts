// src/core/Physics.test.ts
import { describe, it, expect } from 'vitest';
import { Physics, GRAVITY, THRUST_POWER } from './Physics';
import { Vector2 } from './Vector2';

describe('Physics', () => {
    it('applyGravity should increase velocity by gravity', () => {
        const velocity = new Vector2(0, 0);
        const result = Physics.applyGravity(velocity, 1);
        expect(result.y).toBeCloseTo(GRAVITY.y);
    });

    it('applyThrust should add thrust in the direction of rotation', () => {
        const velocity = new Vector2(0, 0);
        const rotation = Math.PI / 2; // pointing up
        const result = Physics.applyThrust(velocity, rotation, 1);
        // thrust should increase y (upward) because rotation = 90deg
        expect(result.y).toBeCloseTo(THRUST_POWER);
    });
});
