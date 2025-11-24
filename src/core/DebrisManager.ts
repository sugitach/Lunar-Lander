import { Debris } from '../entities/Debris';
import { Terrain } from '../entities/Terrain';
import { Vector2 } from './Vector2';

export class DebrisManager {
    private debris: Debris[] = [];

    update(terrain: Terrain): void {
        // Reverse loop to safely remove elements while iterating
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const d = this.debris[i];
            d.update();

            if (d.active) {
                // Check collision with terrain
                for (let j = 0; j < terrain.points.length - 1; j++) {
                    const p1 = terrain.points[j];
                    const p2 = terrain.points[j + 1];
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

            // Remove inactive debris
            if (!d.active) {
                this.debris.splice(i, 1);
            }
        }
    }

    spawn(position: Vector2, count: number): void {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            const vel = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
            this.debris.push(new Debris(position, vel));
        }
    }

    getAll(): Debris[] {
        return this.debris;
    }

    clear(): void {
        this.debris = [];
    }
}
