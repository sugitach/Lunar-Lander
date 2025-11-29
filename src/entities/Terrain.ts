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
 * 複数の着陸パッド、起伏のある地形、オーバーハングなどを生成します。
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
     * 2. パッド間をラフな地形で埋める
     * 3. スコア倍率を計算する
     * 
     * @param width - 地形の幅
     * @param height - 地形の高さ
     */
    generate(width: number, height: number) {
        this.points = [];
        this.pads = [];

        // Config
        const numPads = 3;

        // Start high on the left
        let currentPos = new Vector2(0, height * 0.4 + Math.random() * height * 0.2);
        this.points.push(currentPos.clone());

        // Define Pad Locations
        // Avoid center (width/2) +/- EXCLUSION_ZONE
        const center = width / 2;
        const exclusionZone = TERRAIN_CONSTANTS.EXCLUSION_ZONE;

        // We want pads distributed but not in center.
        // Let's pick random X ranges.
        // Range 1: 50 to center-150
        // Range 2: center+150 to width-50

        const possibleRanges = [
            { min: 50, max: center - exclusionZone },
            { min: center + exclusionZone, max: width - 50 }
        ];

        const padLocations: number[] = [];
        const MAX_RETRIES = TERRAIN_CONSTANTS.MAX_PLACEMENT_RETRIES;
        let retries = 0;

        for (let i = 0; i < numPads && retries < MAX_RETRIES; i++) {
            const range = possibleRanges[Math.floor(Math.random() * possibleRanges.length)];
            const padX = range.min + Math.random() * (range.max - range.min);

            // Check if too close to existing pads
            const tooClose = padLocations.some(p => Math.abs(p - padX) < TERRAIN_CONSTANTS.MIN_PAD_DISTANCE);
            if (!tooClose) {
                padLocations.push(padX);
            } else {
                // Try again
                i--;
                retries++;
            }
        }

        if (padLocations.length < numPads) {
            Debug.log(`Could only place ${padLocations.length} out of ${numPads} landing pads`);
        }

        padLocations.sort((a, b) => a - b);

        let lastX = 0;

        for (const padCenterX of padLocations) {
            const padWidth = TERRAIN_CONSTANTS.MIN_PAD_WIDTH + Math.random() * TERRAIN_CONSTANTS.MAX_PAD_WIDTH_RANGE;
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
            // Normalize or clamp? User didn't say.
            // Round to 1 decimal
            pad.multiplier = Math.round(multiplier * 10) / 10;
        });
    }

    /**
     * 指定された区間をラフな地形で埋めます。
     * 
     * @param startX - 開始X座標
     * @param targetX - 終了X座標
     * @param height - 地形の高さ制限
     */
    private generateRoughTerrain(startX: number, targetX: number, height: number) {
        let currentX = startX;
        let currentY = this.points[this.points.length - 1].y;

        // Safety counter
        let iterations = 0;
        while (currentX < targetX && iterations < 1000) {
            iterations++;

            const distToTarget = targetX - currentX;
            if (distToTarget < TERRAIN_CONSTANTS.MIN_STEP) {
                this.points.push(new Vector2(targetX, currentY));
                break;
            }

            const nextPoint = this.generateNextTerrainPoint(currentX, currentY, height, startX);
            if (nextPoint) {
                currentX = nextPoint.x;
                currentY = nextPoint.y;
            }
        }
    }

    /**
     * 次の地形ポイントを生成します。
     * 
     * 確率に基づいて、垂直壁、オーバーハング、または通常の地形を選択します。
     */
    private generateNextTerrainPoint(currentX: number, currentY: number, height: number, startX: number): Vector2 | null {
        const r = Math.random();

        if (r < 0.15) {
            return this.tryGenerateVerticalWall(currentX, currentY, height);
        } else if (r < 0.25) {
            return this.tryGenerateOverhang(currentX, currentY, height, startX);
        } else {
            return this.generateNormalTerrain(currentX, currentY, height);
        }
    }

    /**
     * 垂直な壁の生成を試みます。
     */
    private tryGenerateVerticalWall(currentX: number, currentY: number, height: number): Vector2 | null {
        const drop = (Math.random() - 0.5) * 150;
        const newY = Math.max(height * 0.1, Math.min(height * 0.9, currentY + drop));

        if (Math.abs(newY - currentY) > 20) {
            const nextPoint = new Vector2(currentX, newY);
            if (!this.intersectsAny(this.points[this.points.length - 1], nextPoint)) {
                this.points.push(nextPoint);
                return nextPoint;
            }
        }

        return null;
    }

    /**
     * オーバーハング（洞窟状の地形）の生成を試みます。
     */
    private tryGenerateOverhang(currentX: number, currentY: number, height: number, startX: number): Vector2 | null {
        const overhangDepth = 20 + Math.random() * 30;
        const overhangHeight = 30 + Math.random() * 50;
        const ceilingY = currentY + 10;

        if (ceilingY < height * 0.9 && (currentX - overhangDepth) > startX + 10) {
            const backX = currentX - overhangDepth;
            const backY = ceilingY + (Math.random() * 20);
            const floorY = backY + overhangHeight;

            if (floorY < height * 0.95) {
                const p1 = new Vector2(currentX, ceilingY);
                const p2 = new Vector2(backX, backY);
                const p3 = new Vector2(backX, floorY);

                if (!this.intersectsAny(this.points[this.points.length - 1], p1) &&
                    !this.intersectsAny(p1, p2) &&
                    !this.intersectsAny(p2, p3)) {

                    this.points.push(p1);
                    this.points.push(p2);
                    this.points.push(p3);

                    return p3; // Return the floor point as the new current position
                }
            }
        }

        return null;
    }

    /**
     * 通常の地形ポイントを生成します。
     */
    private generateNormalTerrain(currentX: number, currentY: number, height: number): Vector2 | null {
        const minStep = TERRAIN_CONSTANTS.MIN_STEP;
        const maxStep = TERRAIN_CONSTANTS.MAX_STEP;

        const step = minStep + Math.random() * (maxStep - minStep);
        const nextX = currentX + step;
        let nextY = currentY + (Math.random() - 0.5) * 60;
        nextY = Math.max(height * 0.1, Math.min(height * 0.9, nextY));

        const nextPoint = new Vector2(nextX, nextY);

        if (!this.intersectsAny(this.points[this.points.length - 1], nextPoint)) {
            this.points.push(nextPoint);
            return nextPoint;
        }

        return null;
    }

    /**
     * 線分が既存の地形と交差するか判定します。
     * 自己交差を防ぐために使用します。
     */
    private intersectsAny(p1: Vector2, p2: Vector2): boolean {
        // Check against all existing segments
        // Optimization: Only check recent segments? 
        // Or check all. Performance is fine for generation (once per game).
        // Don't check the immediate previous segment (it shares a point).

        for (let i = 0; i < this.points.length - 2; i++) {
            const s1 = this.points[i];
            const s2 = this.points[i + 1];
            if (Physics.checkLineIntersection(p1, p2, s1, s2)) return true;
        }
        return false;
    }
}
