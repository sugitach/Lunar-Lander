import { describe, test, expect } from 'vitest';
import { GameState } from './GameState';

describe('GameState', () => {
    test('consumeFuel() should decrease fuel', () => {
        const state = new GameState();
        const initialFuel = state.fuel;
        state.consumeFuel(10);
        expect(state.fuel).toBe(initialFuel - 10);
    });

    test('consumeFuel() should not go below zero', () => {
        const state = new GameState();
        state.consumeFuel(1000);
        expect(state.fuel).toBe(0);
    });

    test('isFuelEmpty() should return correct value', () => {
        const state = new GameState();
        expect(state.isFuelEmpty()).toBe(false);
        state.consumeFuel(1000);
        expect(state.isFuelEmpty()).toBe(true);
    });
});
