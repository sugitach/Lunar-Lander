import { describe, test, expect, beforeEach } from 'vitest';
import { GameStateManager } from './GameStateManager';
import { Lander } from '../entities/Lander';
import { Vector2 } from './Vector2';
import { GameState, GameStatus } from './GameState';

describe('GameStateManager', () => {
    let manager: GameStateManager;

    beforeEach(() => {
        manager = new GameStateManager();
    });

    test('isSafeToLand() should return true for safe landing', () => {
        const lander = new Lander(100, 100);
        lander.velocity = new Vector2(0.5, 0.5);
        lander.rotation = -Math.PI / 2;
        expect(manager.isSafeToLand(lander)).toBe(true);
    });

    test('isSafeToLand() should return false for unsafe landing', () => {
        const lander = new Lander(100, 100);
        lander.velocity = new Vector2(5, 5);
        expect(manager.isSafeToLand(lander)).toBe(false);
    });

    test('handleCrash() should spawn debris', () => {
        const lander = new Lander(100, 100);
        const gameState = new GameState();
        const debris = manager.handleCrash(lander, gameState);
        expect(debris.length).toBeGreaterThan(0);
        expect(gameState.status).toBe(GameStatus.CRASHED);
    });
});
