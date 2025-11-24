import { Vector2 } from '../core/Vector2';

export interface LandingPad {
    startIndex: number;
    endIndex: number;
    multiplier: number;
}

export class Terrain {
    public points: Vector2[] = [];
    public pads: LandingPad[] = [];

    constructor(width: number, height: number) {
        this.generate(width, height);
    }

    generate(width: number, height: number) {
        this.points = [];
        this.pads = [];

        // Config
        const numPads = 3;

        // Start high on the left
        let currentPos = new Vector2(0, height * 0.4 + Math.random() * height * 0.2);
        this.points.push(currentPos.clone());

        // Define Pad Locations
        // Avoid center (width/2) +/- 150px
        const center = width / 2;
        const exclusionZone = 150;

        // We want pads distributed but not in center.
        // Let's pick random X ranges.
        // Range 1: 50 to center-150
        // Range 2: center+150 to width-50

        const possibleRanges = [
            { min: 50, max: center - exclusionZone },
            { min: center + exclusionZone, max: width - 50 }
        ];

        const padLocations: number[] = [];

        for (let i = 0; i < numPads; i++) {
            // Pick a range randomly, weighted by space?
            // Let's just alternate or pick random valid spots.
            // Simple approach: Try to place 3 pads.
            // 1 Left, 1 Right, 1 Random?
            // Or just random within valid ranges.

            const range = possibleRanges[Math.floor(Math.random() * possibleRanges.length)];
            const padX = range.min + Math.random() * (range.max - range.min);

            // Check if too close to existing pads
            const tooClose = padLocations.some(p => Math.abs(p - padX) < 100);
            if (!tooClose) {
                padLocations.push(padX);
            } else {
                // Try again or skip
                i--;
                // Safety break
                if (Math.random() < 0.1) i++;
            }
        }
        padLocations.sort((a, b) => a - b);

        let lastX = 0;

        for (const padCenterX of padLocations) {
            const padWidth = 40 + Math.random() * 60; // 40-100
            const padStartX = padCenterX - padWidth / 2;

            // Fill from lastX to padStartX
            this.generateRoughTerrain(lastX, padStartX, height);

            // Generate Pad
            const padStartIdx = this.points.length - 1;

            // Determine Pad Y. 
            // It should be somewhat reachable from the last point.
            // But we can have a drop.
            const lastPoint = this.points[this.points.length - 1];
            let padY = lastPoint.y + (Math.random() - 0.5) * 100;
            padY = Math.max(height * 0.2, Math.min(height * 0.9, padY));

            // Add transition point to ensure we don't clip through geometry if pad is way lower/higher
            // Actually, generateRoughTerrain should end exactly at padStartX.
            // But the Y might be different.
            // Let's add a "connector" if the gap is huge, or just let the line connect.
            // To make it look "constructed", maybe a vertical drop to the pad?

            this.points.push(new Vector2(padStartX, padY));
            this.points.push(new Vector2(padStartX + padWidth, padY));

            const padEndIdx = this.points.length - 1;

            // Defer multiplier calculation
            this.pads.push({
                startIndex: padStartIdx + 1,
                endIndex: padEndIdx,
                multiplier: 1 // Placeholder
            });

            lastX = padStartX + padWidth;
        }

        // Fill to end
        this.generateRoughTerrain(lastX, width, height);

        // Calculate Multipliers
        this.calculateMultipliers();
    }

    private calculateMultipliers() {
        const landerHeight = 20;

        this.pads.forEach(pad => {
            const pStart = this.points[pad.startIndex];
            const pEnd = this.points[pad.endIndex];
            const padY = pStart.y;
            const padWidth = pEnd.x - pStart.x;

            const A = 20 / padWidth;

            let leftWallHeight = 0;
            let rightWallHeight = 0;
            let hasCeiling = false;

            // Scan Left (backwards from start)
            for (let i = pad.startIndex; i >= 0; i--) {
                const p = this.points[i];
                if (pStart.x - p.x > 100) break;
                if (p.y < padY) {
                    const h = padY - p.y;
                    if (h > leftWallHeight) leftWallHeight = h;
                    if (p.x > pStart.x) hasCeiling = true;
                }
            }

            // Scan Right (forwards from end)
            for (let i = pad.endIndex; i < this.points.length; i++) {
                const p = this.points[i];
                if (p.x - pEnd.x > 100) break;
                if (p.y < padY) {
                    const h = padY - p.y;
                    if (h > rightWallHeight) rightWallHeight = h;
                    if (p.x < pEnd.x) hasCeiling = true;
                }
            }

            const B = leftWallHeight / landerHeight;
            const C = rightWallHeight / landerHeight;
            const D = hasCeiling ? 4 : 1;

            let multiplier = A * (B + 1) * (C + 1) * D;
            // Normalize or clamp? User didn't say.
            // Round to 1 decimal
            pad.multiplier = Math.round(multiplier * 10) / 10;
        });
    }

    private generateRoughTerrain(startX: number, targetX: number, height: number) {
        let currentX = startX;
        let currentY = this.points[this.points.length - 1].y;
        const minStep = 15;
        const maxStep = 40;

        // Safety counter
        let iterations = 0;
        while (currentX < targetX && iterations < 1000) {
            iterations++;

            const distToTarget = targetX - currentX;
            if (distToTarget < minStep) {
                this.points.push(new Vector2(targetX, currentY));
                break;
            }

            const r = Math.random();
            let nextPoint: Vector2 | null = null;

            if (r < 0.15) {
                // Vertical Wall
                const drop = (Math.random() - 0.5) * 150;
                const newY = Math.max(height * 0.1, Math.min(height * 0.9, currentY + drop));
                if (Math.abs(newY - currentY) > 20) {
                    nextPoint = new Vector2(currentX, newY);
                }
            } else if (r < 0.25) {
                // Overhang
                const overhangDepth = 20 + Math.random() * 30;
                const overhangHeight = 30 + Math.random() * 50;
                const ceilingY = currentY + 10;

                if (ceilingY < height * 0.9 && (currentX - overhangDepth) > startX + 10) {
                    const backX = currentX - overhangDepth;
                    const backY = ceilingY + (Math.random() * 20);
                    const floorY = backY + overhangHeight;

                    if (floorY < height * 0.95) {
                        // Check intersection for all 3 segments
                        // Lip -> Ceiling -> Back -> Floor
                        // We need to verify these don't intersect existing terrain
                        // Simplified: just check if backX is valid (done) and segments don't cross recent points
                        // Since we only go back, we might cross previous segments if we are not careful.
                        // But we checked backX > startX + 10. startX is where we started this chunk.
                        // So we shouldn't cross previous chunks.
                        // Within this chunk?
                        // We just need to ensure we don't cross the line we just made?
                        // Overhangs are tricky. Let's trust the backX check for now but add a generic intersection check before pushing.

                        const p1 = new Vector2(currentX, ceilingY);
                        const p2 = new Vector2(backX, backY);
                        const p3 = new Vector2(backX, floorY);

                        if (!this.intersectsAny(this.points[this.points.length - 1], p1) &&
                            !this.intersectsAny(p1, p2) &&
                            !this.intersectsAny(p2, p3)) {

                            this.points.push(p1);
                            this.points.push(p2);
                            this.points.push(p3);

                            currentX = backX;
                            currentY = floorY;
                            continue; // Skip normal push
                        }
                    }
                }
            }

            if (!nextPoint) {
                // Normal Terrain
                const step = minStep + Math.random() * (maxStep - minStep);
                let nextX = currentX + step;
                let nextY = currentY + (Math.random() - 0.5) * 60;
                nextY = Math.max(height * 0.1, Math.min(height * 0.9, nextY));
                if (nextX > targetX) nextX = targetX;
                nextPoint = new Vector2(nextX, nextY);
            }

            // Check intersection before adding
            if (nextPoint && !this.intersectsAny(this.points[this.points.length - 1], nextPoint)) {
                this.points.push(nextPoint);
                currentX = nextPoint.x;
                currentY = nextPoint.y;
            }
        }
    }

    private intersectsAny(p1: Vector2, p2: Vector2): boolean {
        // Check against all existing segments
        // Optimization: Only check recent segments? 
        // Or check all. Performance is fine for generation (once per game).
        // Don't check the immediate previous segment (it shares a point).

        // Import Physics for checkLineIntersection? Or duplicate logic?
        // Let's duplicate simple check or assume Physics is available if imported.
        // We didn't import Physics in Terrain.ts. Let's add helper here.

        for (let i = 0; i < this.points.length - 2; i++) {
            const s1 = this.points[i];
            const s2 = this.points[i + 1];
            if (this.checkIntersection(p1, p2, s1, s2)) return true;
        }
        return false;
    }

    private checkIntersection(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2): boolean {
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;

        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denom === 0) return false;

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

        // Strict inequality to allow sharing endpoints
        return (ua > 0.001 && ua < 0.999 && ub > 0.001 && ub < 0.999);
    }
}
