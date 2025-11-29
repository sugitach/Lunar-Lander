import { describe, test, expect } from 'vitest';
import { Lander } from './Lander';
import { MockInput } from '../core/MockInput';
import { GameState } from '../core/GameState';

describe('Lander', () => {
    test('update() should apply gravity', () => {
        const lander = new Lander(100, 100);
        const mockInput = new MockInput();
        const gameState = new GameState();

        const initialY = lander.velocity.y;
        lander.update(mockInput, gameState, 1);

        expect(lander.velocity.y).toBeGreaterThan(initialY);
    });

    test('update() should apply thrust when input is active', () => {
        const lander = new Lander(100, 100);
        const mockInput = new MockInput();
        mockInput.pressThrust();
        const gameState = new GameState();
        gameState.fuel = 100;

        lander.update(mockInput, gameState, 1);

        expect(gameState.fuel).toBeLessThan(100);
    });
});
