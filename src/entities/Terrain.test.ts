import { describe, test, expect } from 'vitest';
import { Terrain } from './Terrain';

describe('Terrain', () => {
    test('generateTerrain() should create points', () => {
        const terrain = new Terrain(800, 600);
        expect(terrain.points.length).toBeGreaterThan(0);
    });

    test('generateTerrain() should create landing pads', () => {
        const terrain = new Terrain(800, 600);
        expect(terrain.pads.length).toBeGreaterThan(0);
    });

    test('pads should have valid multipliers', () => {
        const terrain = new Terrain(800, 600);
        terrain.pads.forEach(pad => {
            expect(pad.multiplier).toBeGreaterThan(0);
        });
    });
});
