# Issue #008: 長いメソッドの分割

status: fixed

## 優先度
🟡 中優先度

## 概要
可読性向上のため、長いメソッドを小さな関数に分割する必要があります。

## 問題点

### 8.1 GameLoop.checkCollisions()

**現状:**
- 77行（行101-177）
- 複数の責務を持つ
  - 座標変換
  - 足の衝突判定
  - ボディの衝突判定
  - 境界チェック

**問題:**
- 可読性が低い
- テストが困難
- 変更の影響範囲が不明確

### 8.2 Terrain.generateRoughTerrain()

**現状:**
- 88行（行163-250）
- 複数の地形生成ロジックが混在
  - 通常の地形
  - 垂直壁
  - オーバーハング
  - 交差判定

**問題:**
- ロジックの理解が困難
- 各地形タイプの調整が難しい
- デバッグが困難

## 提案される修正

### 1. GameLoop.checkCollisions()の分割
```typescript
private checkCollisions() {
    const footCollision = this.checkFootCollisions();
    if (footCollision) {
        this.handleLandingOrCrash(footCollision.segmentIndex, footCollision.point, footCollision.isLeftFoot);
        return;
    }
    
    const bodyCollision = this.checkBodyCollision();
    if (bodyCollision) {
        this.crash();
        return;
    }
    
    this.checkBoundaries();
}

private checkFootCollisions(): FootCollisionResult | null {
    const { leftFoot, rightFoot, prevLeftFoot, prevRightFoot } = this.calculateFootPositions();
    
    for (let i = 0; i < this.terrain.points.length - 1; i++) {
        const p1 = this.terrain.points[i];
        const p2 = this.terrain.points[i + 1];
        
        let intersection = Physics.checkLineIntersection(prevLeftFoot, leftFoot, p1, p2);
        if (intersection) {
            return { segmentIndex: i, point: intersection, isLeftFoot: true };
        }
        
        intersection = Physics.checkLineIntersection(prevRightFoot, rightFoot, p1, p2);
        if (intersection) {
            return { segmentIndex: i, point: intersection, isLeftFoot: false };
        }
    }
    
    return null;
}

private checkBodyCollision(): boolean { /* ... */ }
private checkBoundaries(): void { /* ... */ }
private calculateFootPositions(): FootPositions { /* ... */ }
```

### 2. Terrain.generateRoughTerrain()の分割
```typescript
private generateRoughTerrain(startX: number, targetX: number, height: number) {
    let currentX = startX;
    let currentY = this.points[this.points.length - 1].y;
    const minStep = TERRAIN_CONSTANTS.MIN_STEP;
    const maxStep = TERRAIN_CONSTANTS.MAX_STEP;
    
    let iterations = 0;
    while (currentX < targetX && iterations < 1000) {
        iterations++;
        
        const distToTarget = targetX - currentX;
        if (distToTarget < minStep) {
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

private tryGenerateVerticalWall(currentX: number, currentY: number, height: number): Vector2 | null { /* ... */ }
private tryGenerateOverhang(currentX: number, currentY: number, height: number, startX: number): Vector2 | null { /* ... */ }
private generateNormalTerrain(currentX: number, currentY: number, height: number): Vector2 { /* ... */ }
```

## 影響範囲
- `src/core/GameLoop.ts` - `checkCollisions()`メソッドの分割
- `src/entities/Terrain.ts` - `generateRoughTerrain()`メソッドの分割

## 検証方法
1. ビルドが成功すること
2. 衝突判定が正常に動作すること
3. 地形生成が正常に動作すること
4. 各メソッドが30行以下になっていること
5. 各メソッドが単一の責務を持つこと
