# Issue #009: パフォーマンス最適化

## 優先度
🟡 中優先度

## 概要
フレームレートの安定化のため、不要な計算を削減し、パフォーマンスを最適化する必要があります。

## 問題点

### 9.1 毎フレームの配列フィルタリング

**問題箇所:**
- `GameLoop.updateDebris()`: 行98

**現状:**
```typescript
this.debris = this.debris.filter(d => d.active);
```

**問題:**
- 毎フレーム新しい配列を作成
- ガベージコレクションの負荷増加
- 不要なメモリアロケーション

### 9.2 毎フレームの関数バインド

**問題箇所:**
- `GameLoop.ts`: 行28, 45

**現状:**
```typescript
requestAnimationFrame(this.loop.bind(this));
```

**問題:**
- 毎フレーム新しい関数オブジェクトを作成
- 不要なメモリアロケーション

### 9.3 線形探索の多用

**問題箇所:**
- `GameLoop.checkCollisions()`: 全地形セグメントを線形探索
- `GameLoop.updateDebris()`: デブリごとに全地形セグメントを線形探索

**問題:**
- O(n×m)の計算量
- 地形セグメント数が多いと遅くなる

## 提案される修正

### 1. 配列フィルタリングの最適化
```typescript
private updateDebris() {
    // 逆順でループし、非アクティブな要素を削除
    for (let i = this.debris.length - 1; i >= 0; i--) {
        const d = this.debris[i];
        d.update();
        
        if (d.active) {
            // 衝突チェック...
        }
        
        if (!d.active) {
            this.debris.splice(i, 1);
        }
    }
}
```

### 2. 関数バインドの最適化
```typescript
export class GameLoop {
    private boundLoop: (timestamp: number) => void;
    
    constructor(renderer: IRenderer) {
        // ...
        this.boundLoop = this.loop.bind(this); // 一度だけバインド
        requestAnimationFrame(this.boundLoop);
    }
    
    private loop(timestamp: number) {
        // ...
        requestAnimationFrame(this.boundLoop); // バインド済みの関数を使用
    }
}
```

### 3. 空間分割の導入（オプション）
```typescript
// src/core/SpatialGrid.ts
export class SpatialGrid {
    private cellSize: number;
    private grid: Map<string, TerrainSegment[]>;
    
    constructor(cellSize: number = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    
    insert(segment: TerrainSegment): void {
        const cells = this.getCellsForSegment(segment);
        cells.forEach(cell => {
            const key = this.getCellKey(cell.x, cell.y);
            if (!this.grid.has(key)) {
                this.grid.set(key, []);
            }
            this.grid.get(key)!.push(segment);
        });
    }
    
    query(point: Vector2): TerrainSegment[] {
        const key = this.getCellKey(
            Math.floor(point.x / this.cellSize),
            Math.floor(point.y / this.cellSize)
        );
        return this.grid.get(key) || [];
    }
    
    private getCellKey(x: number, y: number): string {
        return `${x},${y}`;
    }
    
    private getCellsForSegment(segment: TerrainSegment): { x: number, y: number }[] {
        // セグメントが通過するすべてのセルを返す
        // ...
    }
}
```

## 影響範囲
- `src/core/GameLoop.ts` - `updateDebris()`の最適化、`boundLoop`の追加
- 新規ファイル（オプション）: `src/core/SpatialGrid.ts`

## 検証方法
1. ビルドが成功すること
2. フレームレートが向上すること（Chrome DevToolsで測定）
3. メモリ使用量が削減されること
4. ゲームの動作が変わらないこと
5. 大量のデブリ（100個以上）でもスムーズに動作すること

## パフォーマンス目標
- 60FPS を安定して維持
- デブリ100個でも50FPS以上
- メモリアロケーションの削減（DevToolsで確認）
