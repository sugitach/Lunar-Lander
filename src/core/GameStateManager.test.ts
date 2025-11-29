import { describe, test, expect, beforeEach, vi } from 'vitest';
import { GameStateManager } from './GameStateManager';
import { Lander } from '../entities/Lander';
import { Vector2 } from './Vector2';
import { GameState, GameStatus } from './GameState';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
});

describe('GameStateManager', () => {
    let manager: GameStateManager;

    beforeEach(() => {
        manager = new GameStateManager();
        localStorageMock.clear();
        vi.clearAllMocks();
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

    test('initialize() should load high score from localStorage', () => {
        localStorageMock.setItem('moon-lander-high-score', '1000');
        const gameState = new GameState();
        manager.initialize(gameState);
        expect(gameState.highScore).toBe(1000);
        expect(localStorageMock.getItem).toHaveBeenCalledWith('moon-lander-high-score');
    });

    test('handleCrash() should update high score if current score is higher', () => {
        const lander = new Lander(100, 100);
        const gameState = new GameState();
        gameState.score = 500;

        manager.handleCrash(lander, gameState);

        expect(gameState.highScore).toBe(500);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('moon-lander-high-score', '500');
    });


    test('handleCrash() should NOT update high score if current score is lower', () => {
        localStorageMock.setItem('moon-lander-high-score', '1000');
        const lander = new Lander(100, 100);
        const gameState = new GameState();
        manager.initialize(gameState); // Load 1000
        gameState.score = 500;

        // Clear mocks to only track calls from handleCrash
        vi.clearAllMocks();

        manager.handleCrash(lander, gameState);

        expect(gameState.highScore).toBe(1000);
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
});
