import { Vector2 } from '../core/Vector2';
import { GameState } from '../core/GameState';

export interface IRenderer {
    initialize(container: HTMLElement): void;
    clear(): void;
    drawLander(position: Vector2, rotation: number, isThrusting: boolean, isCrashed: boolean, isSafe: boolean): void;
    drawTerrain(points: Vector2[], pads?: { startIndex: number, endIndex: number, multiplier: number }[]): void;
    drawUI(state: GameState, velocity: Vector2, altitude: number): void;
    drawMessage(message: string, subMessage?: string): void;
    drawDebris(debris: { position: Vector2, rotation: number, size: number }[]): void;
}
