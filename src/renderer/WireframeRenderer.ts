import type { IRenderer } from './IRenderer';
import { Vector2 } from '../core/Vector2';
import { GameState } from '../core/GameState';
import { Debug } from '../core/Debug';

export class WireframeRenderer implements IRenderer {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private width: number = 0;
    private height: number = 0;
    private resizeBound = this.resize.bind(this);

    initialize(container: HTMLElement): void {
        this.canvas = document.createElement('canvas');
        if (!this.canvas) {
            throw new Error('Failed to create canvas element');
        }

        this.canvas.style.display = 'block';
        container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Failed to get 2D rendering context');
        }

        this.resize();
        window.addEventListener('resize', this.resizeBound);
    }

    dispose(): void {
        window.removeEventListener('resize', this.resizeBound);
    }

    private resize(): void {
        if (!this.canvas) return;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    clear(): void {
        if (!this.ctx) return;
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawLander(position: Vector2, rotation: number, isThrusting: boolean, isCrashed: boolean, isSafe: boolean): void {
        if (!this.ctx) {
            Debug.error("drawLander: No context!");
            return;
        }

        this.ctx.save();
        this.ctx.translate(position.x, position.y);
        this.ctx.rotate(rotation + Math.PI / 2); // Adjust for 0 being UP

        if (isCrashed) {
            // Crumpled Lander
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            // Random jagged lines to simulate crumple
            this.ctx.moveTo(-10, 10);
            this.ctx.lineTo(-5, -5);
            this.ctx.lineTo(0, 5);
            this.ctx.lineTo(5, -10);
            this.ctx.lineTo(10, 10);
            this.ctx.lineTo(0, 15);
            this.ctx.closePath();
            this.ctx.stroke();

            // Fire effect (random lines)
            this.ctx.strokeStyle = '#FFA500'; // Orange
            this.ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const r1 = Math.random() * 20 - 10;
                const r2 = Math.random() * 20 - 10;
                this.ctx.moveTo(r1, r2);
                this.ctx.lineTo(r1 + (Math.random() - 0.5) * 10, r2 - 10 - Math.random() * 10);
            }
            this.ctx.stroke();

        } else {
            if (isSafe) {
                this.ctx.strokeStyle = '#00FF00'; // Green for safe
            } else {
                this.ctx.strokeStyle = '#FFFFFF';
            }
            this.ctx.lineWidth = 2;

            // Draw Lander Body (Simple LEM shape)
            this.ctx.beginPath();
            // Octagon-ish body
            this.ctx.moveTo(-10, -10);
            this.ctx.lineTo(10, -10);
            this.ctx.lineTo(15, 0);
            this.ctx.lineTo(10, 10);
            this.ctx.lineTo(-10, 10);
            this.ctx.lineTo(-15, 0);
            this.ctx.closePath();
            this.ctx.stroke();

            // Legs
            this.ctx.beginPath();
            this.ctx.moveTo(-10, 10);
            this.ctx.lineTo(-15, 20);
            this.ctx.moveTo(10, 10);
            this.ctx.lineTo(15, 20);
            this.ctx.stroke();

            // Feet
            this.ctx.beginPath();
            this.ctx.moveTo(-18, 20);
            this.ctx.lineTo(-12, 20);
            this.ctx.moveTo(12, 20);
            this.ctx.lineTo(18, 20);
            this.ctx.stroke();

            if (isThrusting && !isCrashed) {
                this.ctx.beginPath();
                this.ctx.moveTo(-5, 10);
                this.ctx.lineTo(0, 25 + Math.random() * 10);
                this.ctx.lineTo(5, 10);
                this.ctx.stroke();
            }
        }
        this.ctx.restore();
    }

    drawTerrain(points: Vector2[], pads?: { startIndex: number, endIndex: number, multiplier: number }[]): void {
        if (!this.ctx || points.length === 0) return;

        this.ctx.lineWidth = 2;

        // Draw terrain segments
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];

            // Check if this segment is part of a pad
            const pad = pads?.find(p => i >= p.startIndex && i < p.endIndex);

            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);

            if (pad) {
                // Color based on multiplier
                if (pad.multiplier >= 5) this.ctx.strokeStyle = '#FF0000'; // Red (Hard)
                else if (pad.multiplier >= 3) this.ctx.strokeStyle = '#FFFF00'; // Yellow (Medium)
                else this.ctx.strokeStyle = '#0000FF'; // Blue (Easy)
            } else {
                this.ctx.strokeStyle = '#FFFFFF';
            }

            this.ctx.stroke();
        }

        // Draw Multiplier Text
        if (pads) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'center';
            const ctx = this.ctx;
            pads.forEach(pad => {
                // Find center of pad
                const p1 = points[pad.startIndex];
                const p2 = points[pad.endIndex]; // Approximate end
                // Better: average X of start and end
                const centerX = (p1.x + p2.x) / 2;
                const centerY = p1.y + 20;
                ctx.fillText(`x${pad.multiplier}`, centerX, centerY);
            });
            this.ctx.textAlign = 'left';
        }
    }

    drawDebris(debris: { position: Vector2, rotation: number, size: number }[]): void {
        if (!this.ctx) return;

        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;

        debris.forEach(d => {
            if (!this.ctx) return; // TS check
            this.ctx.save();
            this.ctx.translate(d.position.x, d.position.y);
            this.ctx.rotate(d.rotation);

            this.ctx.beginPath();
            // Draw a small triangle
            const s = d.size;
            this.ctx.moveTo(0, -s);
            this.ctx.lineTo(s, s);
            this.ctx.lineTo(-s, s);
            this.ctx.closePath();
            this.ctx.stroke();

            this.ctx.restore();
        });
    }

    drawUI(state: GameState, velocity: Vector2, altitude: number): void {
        if (!this.ctx) return;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px monospace';

        this.ctx.fillText(`SCORE: ${Math.floor(state.score)}`, 20, 30);
        this.ctx.fillText(`FUEL:  ${Math.floor(state.fuel)}`, 20, 50);

        // Velocity display
        const vX = velocity.x.toFixed(2);
        const vY = velocity.y.toFixed(2);
        this.ctx.fillText(`H.SPEED: ${vX}`, this.width - 200, 30);
        this.ctx.fillText(`V.SPEED: ${vY}`, this.width - 200, 50);
        this.ctx.fillText(`ALTITUDE: ${Math.floor(altitude)}`, this.width - 200, 70);
    }

    drawMessage(message: string, subMessage: string): void {
        if (!this.ctx) return;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';

        this.ctx.font = '40px monospace';
        this.ctx.fillText(message, this.width / 2, this.height / 2);

        if (subMessage) {
            this.ctx.font = '20px monospace';
            this.ctx.fillText(subMessage, this.width / 2, this.height / 2 + 40);
        }

        this.ctx.textAlign = 'left'; // Reset
    }
}
