import { describe, test, expect, beforeEach } from 'vitest';
import { DebrisManager } from './DebrisManager';
import { Vector2 } from './Vector2';
import { Terrain } from '../entities/Terrain';

// Mock Terrain for DebrisManager test
class MockTerrain extends Terrain {
    constructor() {
        super(800, 600);
        // Simple flat terrain
        this.points = [new Vector2(0, 500), new Vector2(800, 500)];
    }
}

function createMockTerrain(): Terrain {
    return new MockTerrain();
}

describe('DebrisManager', () => {
    let manager: DebrisManager;

    beforeEach(() => {
        manager = new DebrisManager();
    });

    test('spawn() should create debris', () => {
        manager.spawn(new Vector2(100, 100), 5);
        expect(manager.getAll().length).toBe(5);
    });

    test('update() should remove inactive debris', () => {
        manager.spawn(new Vector2(100, 100), 3);
        const debris = manager.getAll();
        debris[0].active = false;

        const mockTerrain = createMockTerrain();
        manager.update(mockTerrain);

        expect(manager.getAll().length).toBe(2);
    });

    test('clear() should remove all debris', () => {
        manager.spawn(new Vector2(100, 100), 5);
        manager.clear();
        expect(manager.getAll().length).toBe(0);
    });
});
