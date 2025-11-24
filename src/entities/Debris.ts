import { Vector2 } from '../core/Vector2';

export class Debris {
    public position: Vector2;
    public velocity: Vector2;
    public rotation: number;
    public rotationSpeed: number;
    public active: boolean = true;
    public size: number;

    constructor(position: Vector2, velocity: Vector2) {
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.5;
        this.size = 2 + Math.random() * 5;
    }

    update() {
        if (!this.active) return;

        // Gravity
        this.velocity.y += 0.05; // Simple gravity

        this.position = this.position.add(this.velocity);
        this.rotation += this.rotationSpeed;

        // Bounds check (simple)
        if (this.position.x < 0 || this.position.x > window.innerWidth || this.position.y > window.innerHeight) {
            this.active = false;
        }
    }
}
