// src/core/Vector2.test.ts
import { describe, it, expect } from 'vitest';
import { Vector2 } from './Vector2';

describe('Vector2', () => {
    it('should add vectors correctly', () => {
        const a = new Vector2(1, 2);
        const b = new Vector2(3, 4);
        const result = a.add(b);
        expect(result.x).toBe(4);
        expect(result.y).toBe(6);
    });

    it('should subtract vectors correctly', () => {
        const a = new Vector2(5, 7);
        const b = new Vector2(2, 3);
        const result = a.sub(b);
        expect(result.x).toBe(3);
        expect(result.y).toBe(4);
    });

    it('should scale (multiply) vectors correctly', () => {
        const v = new Vector2(2, -3);
        const result = v.multiply(2);
        expect(result.x).toBe(4);
        expect(result.y).toBe(-6);
    });

    it('should normalize a non-zero vector', () => {
        const v = new Vector2(3, 4);
        const norm = v.normalize();
        const length = Math.sqrt(norm.x * norm.x + norm.y * norm.y);
        expect(length).toBeCloseTo(1);
    });
});
