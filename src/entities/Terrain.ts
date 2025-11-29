import { Vector2 } from '../core/Vector2';
import { TERRAIN_CONSTANTS } from '../core/Constants';
import { Debug } from '../core/Debug';
import { Physics } from '../core/Physics';

/**
 * 着陸パッドの情報を定義するインターフェース。
 */
export interface LandingPad {
    /** パッドの開始点インデックス（points配列内） */
    startIndex: number;
    /** パッドの終了点インデックス（points配列内） */
    endIndex: number;
    /** スコア倍率 */
    multiplier: number;
}

/**
 * 地形クラス。
 * 
 * 地形の生成、管理を行います。
 * 再帰的分割アルゴリズムを使用して自然な地形を生成します。
 */
export class Terrain {
    /** 地形を構成する点の配列 */
    public points: Vector2[] = [];
    /** 着陸パッドのリスト */
    public pads: LandingPad[] = [];

    /**
     * Terrainのインスタンスを生成し、地形を生成します。
     * 
     * @param width - 地形の幅
     * @param height - 地形の高さ
     */
    constructor(width: number, height: number) {
        this.generate(width, height);
    }

    /**
     * 地形を生成します。
     * 
     * 1. 着陸パッドの位置をランダムに決定
     * 2. パッド間を再帰的分割アルゴリズムで埋める
     * 3. スコア倍率を計算する
     * 
     * @param width - 地形の幅
     * @param height - 地形の高さ
     */
    generate(width: number, height: number) {
        this.points = [];
        this.pads = [];

        // 1. Generate Pad Locations
        const numPads = 3 + Math.floor(Math.random() * 2); // 3 to 4 pads
        const padLocations: { x: number, width: number, y: number }[] = [];

        const center = width / 2;
        const exclusionZone = TERRAIN_CONSTANTS.EXCLUSION_ZONE;
        const possibleRanges = [
            { min: 50, max: center - exclusionZone },
            { min: center + exclusionZone, max: width - 50 }
        ];

        let retries = 0;
        const MAX_RETRIES = 100;

        while (padLocations.length < numPads && retries < MAX_RETRIES) {
            const range = possibleRanges[Math.floor(Math.random() * possibleRanges.length)];
            const padWidth = TERRAIN_CONSTANTS.MIN_PAD_WIDTH + Math.random() * TERRAIN_CONSTANTS.MAX_PAD_WIDTH_RANGE;
            const padX = range.min + Math.random() * (range.max - range.min - padWidth);

            // Check overlap with existing pads (with some buffer)
            const buffer = TERRAIN_CONSTANTS.MIN_PAD_DISTANCE;
            const overlap = padLocations.some(p =>
                Math.abs(p.x - padX) < (p.width + padWidth) / 2 + buffer
            );

            if (!overlap) {
                // Determine Pad Y (keep it somewhat central vertically)
                const padY = height * 0.3 + Math.random() * (height * 0.5);
                padLocations.push({ x: padX, width: padWidth, y: padY });
            } else {
                retries++;
            }
        }

        // Sort pads by X
        padLocations.sort((a, b) => a.x - b.x);

        // 2. Create Key Points (Start, Pads, End)
        const keyPoints: { pos: Vector2, isPadStart?: boolean, isPadEnd?: boolean }[] = [];

        // Start Point
        const startY = height * 0.4 + Math.random() * height * 0.2;
        keyPoints.push({ pos: new Vector2(0, startY) });

        padLocations.forEach(pad => {
            keyPoints.push({ pos: new Vector2(pad.x, pad.y), isPadStart: true });
            keyPoints.push({ pos: new Vector2(pad.x + pad.width, pad.y), isPadEnd: true });
        });

        // End Point
        const endY = height * 0.4 + Math.random() * height * 0.2;
        keyPoints.push({ pos: new Vector2(width, endY) });

        // 3. Generate Terrain Segments
        this.points = [];

        for (let i = 0; i < keyPoints.length - 1; i++) {
            const p1 = keyPoints[i];
            const p2 = keyPoints[i + 1];

            // If this segment is a pad, just add the line
            if (p1.isPadStart && p2.isPadEnd) {
                // Record pad info
                // Note: startIndex will be current length of points
                // We add p1 here. p2 will be added in next iteration or at end.
                // Wait, we need to be careful about point duplication.
                // Strategy: Add points for the segment, excluding the last point (unless it's the very last segment)

                // Actually, let's just add p1. p2 is the start of next segment.
                // But for pad tracking, we need indices.

                const startIndex = this.points.length;
                this.points.push(p1.pos);
                this.points.push(p2.pos); // Pad is flat, so just two points
                const endIndex = this.points.length - 1;

                this.pads.push({
                    startIndex: startIndex,
                    endIndex: endIndex,
                    multiplier: 1 // Calculated later
                });
            } else {
                // Terrain segment - Subdivide
                // We generate points between p1 and p2 (inclusive of p1 and p2)
                const segmentPoints = this.subdivide(p1.pos, p2.pos, height);

                // Add points to main array
                // If this is not the first segment, the first point of segmentPoints (p1) is same as last point of previous segment.
                // However, in our loop structure:
                // Iteration 0: p1(Start) -> p2(Pad1Start). Generate points. Add all except last?

                // Let's refine:
                // We want to add p1. Then add intermediate points.
                // p2 will be added by the NEXT iteration as its p1.
                // EXCEPT if p1->p2 is a pad, we added both.
                // This is getting tricky.

                // Simpler approach:
                // Always add p1.
                // If pad: add p2 as well.
                // If terrain: add intermediate points.
                // BUT, if we add p2 for pad, next iteration p1 is that p2. We shouldn't add it again.

                // Let's restart the loop logic.
                // We have a list of segments.
                // Segment 0: Start -> Pad1Start (Terrain)
                // Segment 1: Pad1Start -> Pad1End (Pad)
                // Segment 2: Pad1End -> Pad2Start (Terrain)
                // ...
            }
        }

        // Re-do the loop with cleaner logic
        this.points = [];
        // Add the very first point
        this.points.push(keyPoints[0].pos);

        for (let i = 0; i < keyPoints.length - 1; i++) {
            const kp1 = keyPoints[i];
            const kp2 = keyPoints[i + 1];

            if (kp1.isPadStart && kp2.isPadEnd) {
                // This is a pad.
                // kp1.pos is already in this.points (added by previous iteration or initial push)
                // We just need to add kp2.pos
                this.points.push(kp2.pos);

                // Register pad
                this.pads.push({
                    startIndex: this.points.length - 2,
                    endIndex: this.points.length - 1,
                    multiplier: 1
                });
            } else {
                // Terrain segment.
                // kp1.pos is already in this.points.
                // We need to generate points BETWEEN kp1 and kp2, and then add kp2.
                // The subdivide function returns [p1, ... mid ..., p2]

                const segmentPoints = this.subdivide(kp1.pos, kp2.pos, height);

                // Remove the first point (it's duplicate of what's already in this.points)
                segmentPoints.shift();

                // Add the rest
                this.points.push(...segmentPoints);
            }
        }

        // 4. Calculate Multipliers
        this.calculateMultipliers();
    }

    /**
     * 2点間を再帰的に分割して地形ポイントを生成します。
     * 
     * @param p1 - 開始点
     * @param p2 - 終了点
     * @param height - 地形の高さ制限（Y座標のクランプ用）
     * @returns 生成された点の配列（p1とp2を含む）
     */
    private subdivide(p1: Vector2, p2: Vector2, height: number): Vector2[] {
        const result: Vector2[] = [p1, p2];
        const MIN_SEGMENT_LENGTH = 30; // Minimum length to stop subdivision
        const DISPLACEMENT_RATIO = 0.3; // Max displacement relative to length

        // Recursive function
        const recursiveSplit = (index1: number, index2: number) => {
            const pp1 = result[index1];
            const pp2 = result[index2];

            const dx = pp2.x - pp1.x;
            const dy = pp2.y - pp1.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length < MIN_SEGMENT_LENGTH) return;

            // 1c. Select random point on line (excluding ends)
            // We'll just take the midpoint for standard midpoint displacement, 
            // but the requirement says "random point".
            // Let's pick a t between 0.3 and 0.7
            const t = 0.3 + Math.random() * 0.4;

            const midX = pp1.x + dx * t;
            const midY = pp1.y + dy * t;

            // 1d. Displace perpendicularly
            // Normal vector (-dy, dx)
            const nx = -dy;
            const ny = dx;
            // Normalize
            const nLen = Math.sqrt(nx * nx + ny * ny);
            const uNx = nx / nLen;
            const uNy = ny / nLen;

            // Displacement amount
            const maxDisp = length * DISPLACEMENT_RATIO;
            const disp = (Math.random() - 0.5) * 2 * maxDisp;

            let newX = midX + uNx * disp;
            let newY = midY + uNy * disp;

            // Clamp Y to stay within bounds
            newY = Math.max(height * 0.1, Math.min(height * 0.9, newY));
            // Clamp X to stay between p1 and p2 (to maintain order)
            // Actually, perpendicular displacement can push X outside if the line is vertical-ish.
            // But our terrain is mostly horizontal.
            // Let's just ensure X is strictly between pp1.x and pp2.x to avoid loops?
            // No, strictly perpendicular is fine, but we need to insert it in the list.
            // If X order flips, it might be weird.
            // Let's just displace Y for simplicity if the line is mostly horizontal?
            // The requirement says "perpendicular". Let's stick to it.

            const newPoint = new Vector2(newX, newY);

            // Insert newPoint between index1 and index2
            result.splice(index1 + 1, 0, newPoint);

            // Recurse
            // Left segment: index1 to index1+1
            recursiveSplit(index1, index1 + 1);
            // Right segment: index1+1 to index2+1 (since we inserted one, index2 shifted by 1)
            recursiveSplit(index1 + 1, index2 + 1);
        };

        recursiveSplit(0, 1);
        return result;
    }

    /**
     * 各パッドのスコア倍率を計算します。
     * 
     * 計算式: A × (B + 1) × (C + 1) × D
     * - A: パッド幅による係数 (20 / padWidth)
     * - B: 左壁の高さ係数 (leftWallHeight / landerHeight)
     * - C: 右壁の高さ係数 (rightWallHeight / landerHeight)
     * - D: 天井の有無による係数 (天井あり: 4, なし: 1)
     */
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

            // Round to 1 decimal
            pad.multiplier = Math.round(multiplier * 10) / 10;
        });
    }
}
