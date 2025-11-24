# Issue #006: GameLoopの責務分離

## 優先度
🟡 中優先度

## 概要
`GameLoop`クラスが251行と肥大化し、複数の責務を持っています（God Objectパターン）。コードの可読性とテスタビリティを向上させるため、責務を分離する必要があります。

## 問題点

### 現在の責務
`GameLoop`クラスは以下の責務を持っています：
- ゲームループ管理
- 衝突判定
- デブリ更新
- 着陸判定
- レンダリング制御

### 問題
- 単一責任の原則（SRP）に違反
- テストが困難
- 変更の影響範囲が大きい
- コードの可読性が低下

## 提案される修正

### 1. CollisionDetectorクラスの作成
```typescript
// src/core/CollisionDetector.ts
export class CollisionDetector {
    checkLanderTerrainCollision(lander: Lander, terrain: Terrain): CollisionResult | null
    checkDebrisTerrainCollision(debris: Debris[], terrain: Terrain): void
    private checkFootCollisions(lander: Lander, terrain: Terrain): FootCollisionResult | null
    private checkBodyCollision(lander: Lander, terrain: Terrain): boolean
    private checkBoundaries(lander: Lander, viewport: { width: number, height: number }): void
}
```

### 2. GameStateManagerクラスの作成
```typescript
// src/core/GameStateManager.ts
export class GameStateManager {
    handleLanding(pad: LandingPad, lander: Lander, gameState: GameState): void
    handleCrash(lander: Lander, gameState: GameState): Debris[]
    isSafeToLand(lander: Lander): boolean
}
```

### 3. DebrisManagerクラスの作成
```typescript
// src/core/DebrisManager.ts
export class DebrisManager {
    private debris: Debris[] = []
    
    update(terrain: Terrain): void
    spawn(position: Vector2, count: number): void
    getAll(): Debris[]
    clear(): void
}
```

## 影響範囲
- 新規ファイル: `src/core/CollisionDetector.ts`
- 新規ファイル: `src/core/GameStateManager.ts`
- 新規ファイル: `src/core/DebrisManager.ts`
- `src/core/GameLoop.ts` - 大幅なリファクタリング

## 検証方法
1. ビルドが成功すること
2. ゲームの動作が変わらないこと
3. 各クラスが単一の責務を持つこと
4. テストコードの作成が容易になること
