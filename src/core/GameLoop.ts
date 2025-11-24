import { GameState, GameStatus } from './GameState';
import { Input } from './Input';
import type { IRenderer } from '../renderer/IRenderer';
import { Lander } from '../entities/Lander';
import { Terrain } from '../entities/Terrain';
import { Vector2 } from './Vector2';
import { Physics } from './Physics';
import { Debris } from '../entities/Debris';
import { Debug } from './Debug';

export class GameLoop {
    private gameState: GameState;
    private input: Input;
    private renderer: IRenderer;
    private lander: Lander;
    private terrain: Terrain;
    private lastTime: number = 0;
    private debris: Debris[] = [];

    constructor(renderer: IRenderer) {
        this.renderer = renderer;
        this.input = new Input();
        this.gameState = new GameState();
        this.gameState.status = GameStatus.PLAYING; // Start playing immediately
        this.terrain = new Terrain(window.innerWidth, window.innerHeight);
        this.lander = new Lander(window.innerWidth / 2, 100); // Initial position

        // Start loop
        requestAnimationFrame(this.loop.bind(this));
    }

    private loop(timestamp: number) {
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // Debug log every ~1 second
        if (Math.random() < 0.01) {
            Debug.log(`Loop running. Status: ${this.gameState.status}, Lander: (${this.lander.position.x}, ${this.lander.position.y}), Terrain points: ${this.terrain.points.length}`);
        }

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.loop.bind(this));
    }

    private update(_deltaTime: number) {
        // Restart Check
        if (this.input.isRestarting && (this.gameState.status === GameStatus.CRASHED || this.gameState.status === GameStatus.LANDED)) {
            this.resetGame();
            return;
        }

        if (this.gameState.status !== GameStatus.PLAYING) {
            // Update debris if crashed
            if (this.gameState.status === GameStatus.CRASHED) {
                this.updateDebris();
            }
            return;
        }

        // Input handling
        // Lander handles its own physics updates based on input
        this.lander.update(this.input, this.gameState, _deltaTime);

        // Collision Detection
        this.checkCollisions();

        // Update HUD data
        // (In a real app, we might use a reactive store, but here we just pass data to renderer)
    }

    private updateDebris() {
        this.debris.forEach(d => {
            d.update();
            // Check collision with terrain
            if (d.active) {
                // Simple check: is below terrain?
                // Find segment
                // Optimization: assume x is sorted
                // Just linear search for now, debris count is low
                for (let i = 0; i < this.terrain.points.length - 1; i++) {
                    const p1 = this.terrain.points[i];
                    const p2 = this.terrain.points[i + 1];
                    if (d.position.x >= p1.x && d.position.x <= p2.x) {
                        // Interpolate Y
                        const t = (d.position.x - p1.x) / (p2.x - p1.x);
                        const groundY = p1.y + t * (p2.y - p1.y);
                        if (d.position.y >= groundY) {
                            d.active = false;
                        }
                        break;
                    }
                }
            }
        });
        this.debris = this.debris.filter(d => d.active);
    }

    private checkCollisions() {
        // Check collision with terrain segments
        // Lander shape is roughly a box or circle. Let's use feet points for landing check, and body for crash.
        // For simplicity, let's check a few points on the lander against all terrain segments.
        // Points: Left Foot, Right Foot, Top, Left, Right

        // Transform local points to world
        const cos = Math.cos(this.lander.rotation + Math.PI / 2);
        const sin = Math.sin(this.lander.rotation + Math.PI / 2);

        const transform = (x: number, y: number) => {
            return new Vector2(
                this.lander.position.x + x * cos - y * sin,
                this.lander.position.y + x * sin + y * cos
            );
        };

        // Feet are at roughly (-15, 20) and (15, 20) in local space (from WireframeRenderer)
        const leftFoot = transform(-15, 20);
        const rightFoot = transform(15, 20);

        // Check intersection of movement vector for feet? 
        // Or just check if feet are "below" the terrain segment?
        // Since we have overhangs, "below" is ambiguous. We must check line intersection.
        // We check if the line segment from "previous position" to "current position" intersects any terrain segment.
        // But we only have current position. We should store previous position in Lander or estimate it.
        // Let's estimate prev position = current - velocity.

        const prevPos = this.lander.position.sub(this.lander.velocity);
        const prevLeftFoot = new Vector2(prevPos.x + (-15 * cos - 20 * sin), prevPos.y + (-15 * sin + 20 * cos)); // Approximate rotation didn't change much
        const prevRightFoot = new Vector2(prevPos.x + (15 * cos - 20 * sin), prevPos.y + (15 * sin + 20 * cos));

        // Check all terrain segments
        for (let i = 0; i < this.terrain.points.length - 1; i++) {
            const p1 = this.terrain.points[i];
            const p2 = this.terrain.points[i + 1];

            // Check Left Foot
            let intersection = Physics.checkLineIntersection(prevLeftFoot, leftFoot, p1, p2);
            if (intersection) {
                this.handleLandingOrCrash(i, intersection, true);
                return;
            }

            // Check Right Foot
            intersection = Physics.checkLineIntersection(prevRightFoot, rightFoot, p1, p2);
            if (intersection) {
                this.handleLandingOrCrash(i, intersection, false);
                return;
            }

            // Check Body Center (Crash)
            // If center crosses line? Or just if center is "inside" terrain?
            // Simple check: if center was above and is now below?
            // Or check line intersection for center too.
            // Center is (0,0) local.
            const center = this.lander.position;
            const prevCenter = prevPos;
            intersection = Physics.checkLineIntersection(prevCenter, center, p1, p2);
            if (intersection) {
                this.crash();
                return;
            }
        }

        // Out of bounds
        if (this.lander.position.x < 0 || this.lander.position.x > window.innerWidth || this.lander.position.y < 0 || this.lander.position.y > window.innerHeight) {
            // Wrap X
            if (this.lander.position.x < 0) this.lander.position.x += window.innerWidth;
            if (this.lander.position.x > window.innerWidth) this.lander.position.x -= window.innerWidth;

            // Floor is crash if not handled by terrain check (e.g. gaps?)
            if (this.lander.position.y > window.innerHeight) {
                this.crash();
            }
        }
    }

    private handleLandingOrCrash(segmentIndex: number, _intersection: Vector2, _isLeftFoot: boolean) {
        // Check if this segment is part of a pad
        const pad = this.terrain.pads.find(p => segmentIndex >= p.startIndex && segmentIndex < p.endIndex);

        if (pad && this.isSafeToLand()) {
            // Successful landing!
            this.gameState.status = GameStatus.LANDED;
            this.gameState.score += Math.floor((100 + this.gameState.fuel / 10) * pad.multiplier);

            // Snap to pad
            const padY = this.terrain.points[segmentIndex].y;
            this.lander.position.y = padY - 20;
            this.lander.velocity = new Vector2(0, 0);
            this.lander.rotation = -Math.PI / 2;

        } else {
            this.crash();
        }
    }

    private crash() {
        this.gameState.status = GameStatus.CRASHED;
        // Spawn Debris
        for (let i = 0; i < 10; i++) {
            const vel = new Vector2((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10 - 5);
            this.debris.push(new Debris(this.lander.position, vel));
        }
    }

    private isSafeToLand(): boolean {
        const speed = this.lander.velocity.length();
        const deviation = Math.abs(this.lander.rotation - (-Math.PI / 2));
        // Re-tighten thresholds
        const MAX_LANDING_SPEED = 2.0;
        const MAX_ANGLE_DEVIATION = 0.2;
        return speed < MAX_LANDING_SPEED && deviation < MAX_ANGLE_DEVIATION;
    }

    private render() {
        this.renderer.clear();
        this.renderer.drawTerrain(this.terrain.points, this.terrain.pads);

        if (this.gameState.status === GameStatus.CRASHED) {
            // Draw debris
            this.renderer.drawDebris(this.debris);
        }

        this.renderer.drawLander(
            this.lander.position,
            this.lander.rotation,
            this.input.isThrusting && this.gameState.status === GameStatus.PLAYING && !this.gameState.isFuelEmpty(),
            this.gameState.status === GameStatus.CRASHED,
            this.isSafeToLand()
        );

        this.renderer.drawUI(this.gameState, this.lander.velocity, window.innerHeight - this.lander.position.y);

        if (this.gameState.status === GameStatus.LANDED) {
            this.renderer.drawMessage("LANDED", `Score: ${this.gameState.score} (Press Space)`);
        } else if (this.gameState.status === GameStatus.CRASHED) {
            this.renderer.drawMessage("CRASHED", "Press Space to Restart");
        }
    }

    private resetGame() {
        this.gameState = new GameState();
        this.gameState.status = GameStatus.PLAYING;
        this.terrain = new Terrain(window.innerWidth, window.innerHeight);
        this.lander = new Lander(window.innerWidth / 2, 100);
        this.debris = [];
    }
}
