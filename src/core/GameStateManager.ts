import { Lander } from '../entities/Lander';
import { Terrain } from '../entities/Terrain';
import { GameState, GameStatus } from './GameState';
import { Vector2 } from './Vector2';
import { Debris } from '../entities/Debris';
import { LANDER_CONSTANTS } from './Constants';

export class GameStateManager {
    handleLanding(segmentIndex: number, lander: Lander, terrain: Terrain, gameState: GameState): void {
        // Check if this segment is part of a pad
        const pad = terrain.pads.find(p => segmentIndex >= p.startIndex && segmentIndex < p.endIndex);

        if (pad && this.isSafeToLand(lander)) {
            // Successful landing!
            gameState.status = GameStatus.LANDED;
            gameState.score += Math.floor((100 + gameState.fuel / 10) * pad.multiplier);

            // Snap to pad
            const padY = terrain.points[segmentIndex].y;
            lander.position.y = padY - LANDER_CONSTANTS.BODY_HEIGHT;
            lander.velocity = new Vector2(0, 0);
            lander.rotation = -Math.PI / 2;
        }
    }

    handleCrash(lander: Lander, gameState: GameState): Debris[] {
        gameState.status = GameStatus.CRASHED;

        // Spawn Debris
        const debris: Debris[] = [];
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            const vel = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
            debris.push(new Debris(lander.position, vel));
        }

        return debris;
    }

    isSafeToLand(lander: Lander): boolean {
        const maxSafeVelocity = 2.0;
        const maxSafeRotation = 0.3; // radians (~17 degrees)
        const upright = -Math.PI / 2;

        const velocityMagnitude = Math.sqrt(lander.velocity.x ** 2 + lander.velocity.y ** 2);
        const rotationDiff = Math.abs(lander.rotation - upright);

        return velocityMagnitude < maxSafeVelocity && rotationDiff < maxSafeRotation;
    }
}
