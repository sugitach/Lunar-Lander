# Code Review - Moon Lander Game

## 概要

このドキュメントは、Moon Landerゲームのコードベースに対する自己レビューの結果をまとめたものです。デザインパターン、コードの可読性、モジュール独立性、冗長性などの観点から分析を行いました。

---

## 1. アーキテクチャとデザインパターン

### 1.1 良好な点

#### ✅ レイヤー分離
- `core/`, `entities/`, `renderer/` というディレクトリ構造により、責務が明確に分離されている
- `IRenderer` インターフェースによる抽象化により、将来的な3Dレンダラーへの切り替えが容易

#### ✅ 依存性注入
- `GameLoop` のコンストラクタで `IRenderer` を受け取る設計により、テスタビリティが向上

### 1.2 改善が必要な点

#### ⚠️ God Object パターン (GameLoop)
**問題点:**
- `GameLoop` クラスが251行と肥大化し、複数の責務を持っている
  - ゲームループ管理
  - 衝突判定
  - デブリ更新
  - 着陸判定
  - レンダリング制御

**推奨される改善:**
```typescript
// 衝突判定を専用クラスに分離
class CollisionDetector {
    checkLanderTerrainCollision(lander: Lander, terrain: Terrain): CollisionResult
    checkDebrisTerrainCollision(debris: Debris[], terrain: Terrain): void
}

// ゲーム状態管理を専用クラスに分離
class GameStateManager {
    handleLanding(pad: LandingPad, lander: Lander): void
    handleCrash(lander: Lander): Debris[]
}
```

#### ⚠️ マジックナンバーの散在
**問題箇所:**
- `GameLoop.ts`: 行118, 119, 130, 131 - ハードコードされた足の座標 `(-15, 20)`, `(15, 20)`
- `Lander.ts`: 行22 - `deltaTime * 60` の60
- `Terrain.ts`: 行166-167 - `minStep = 15`, `maxStep = 40`
- `Debris.ts`: 行23 - 重力値 `0.05`

**推奨される改善:**
```typescript
// 定数ファイルを作成
// src/core/Constants.ts
export const LANDER_CONSTANTS = {
    FOOT_LEFT_X: -15,
    FOOT_LEFT_Y: 20,
    FOOT_RIGHT_X: 15,
    FOOT_RIGHT_Y: 20,
    TARGET_FPS: 60
} as const;

export const TERRAIN_CONSTANTS = {
    MIN_STEP: 15,
    MAX_STEP: 40,
    EXCLUSION_ZONE: 150
} as const;
```

---

## 2. コードの重複

### 2.1 線分交差判定の重複

**問題点:**
- `Physics.checkLineIntersection()` (Physics.ts:23-39)
- `Terrain.checkIntersection()` (Terrain.ts:270-284)

ほぼ同一のロジックが2箇所に存在。

**推奨される改善:**
```typescript
// Terrain.ts で Physics.checkLineIntersection を import して使用
import { Physics } from '../core/Physics';

private intersectsAny(p1: Vector2, p2: Vector2): boolean {
    for (let i = 0; i < this.points.length - 2; i++) {
        const s1 = this.points[i];
        const s2 = this.points[i + 1];
        if (Physics.checkLineIntersection(p1, p2, s1, s2)) return true;
    }
    return false;
}
```

### 2.2 重力計算の重複

**問題点:**
- `Physics.applyGravity()` で `GRAVITY` 定数を使用
- `Debris.update()` で `0.05` をハードコード

**推奨される改善:**
```typescript
// Debris.ts
import { GRAVITY } from '../core/Physics';

update() {
    if (!this.active) return;
    this.velocity.y += GRAVITY.y; // 定数を再利用
    // ...
}
```

---

## 3. モジュール独立性

### 3.1 グローバル状態への依存

#### ⚠️ window オブジェクトへの直接アクセス
**問題箇所:**
- `GameLoop.ts`: 行24, 25, 167, 169, 170, 234
- `Terrain.ts`: コンストラクタで `width`, `height` を受け取るが、`Debris.ts` では `window.innerWidth/Height` を直接参照
- `Input.ts`: 行8, 9 - `window.addEventListener`

**推奨される改善:**
```typescript
// 画面サイズを管理するクラスを作成
class Viewport {
    constructor(public width: number, public height: number) {}
    
    static fromWindow(): Viewport {
        return new Viewport(window.innerWidth, window.innerHeight);
    }
}

// GameLoop で Viewport を保持し、必要な箇所に渡す
class GameLoop {
    private viewport: Viewport;
    
    constructor(renderer: IRenderer, viewport: Viewport) {
        this.viewport = viewport;
        // ...
    }
}
```

### 3.2 循環依存のリスク

**問題点:**
- `Lander` が `Input`, `GameState`, `Physics` に依存
- `GameLoop` が `Lander`, `Terrain`, `Input`, `GameState` に依存
- 現時点では問題ないが、将来的に循環依存が発生する可能性

**推奨される改善:**
- イベント駆動アーキテクチャの導入を検討
- または、Command パターンの適用

---

## 4. 可読性とメンテナンス性

### 4.1 良好な点

#### ✅ TypeScript の型安全性
- インターフェースと型定義が適切に使用されている
- `GameStatus` の型定義が明確

#### ✅ コメントの適切な使用
- 複雑なロジック（衝突判定、地形生成）に説明コメントが付与されている

### 4.2 改善が必要な点

#### ⚠️ 長いメソッド

**問題箇所:**
- `GameLoop.checkCollisions()`: 77行 (行101-177)
- `Terrain.generateRoughTerrain()`: 88行 (行163-250)

**推奨される改善:**
```typescript
// GameLoop.checkCollisions() を分割
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

private checkFootCollisions(): FootCollisionResult | null { /* ... */ }
private checkBodyCollision(): boolean { /* ... */ }
private checkBoundaries(): void { /* ... */ }
```

#### ⚠️ デバッグコードの残存

**問題箇所:**
- `GameLoop.ts`: 行31, 37-40 - デバッグログが本番コードに残っている
- `WireframeRenderer.ts`: 行37 - `console.error` が残っている

**推奨される改善:**
```typescript
// デバッグユーティリティを作成
class Debug {
    static enabled = process.env.NODE_ENV === 'development';
    
    static log(...args: any[]) {
        if (this.enabled) console.log(...args);
    }
}

// 使用例
if (Math.random() < 0.01) {
    Debug.log(`Loop running. Status: ${this.gameState.status}...`);
}
```

#### ⚠️ 未使用のコメント

**問題箇所:**
- `GameLoop.ts`: 行31 - `// ...` という意味のないコメント
- `GameLoop.ts`: 行70-71 - 実装されていない機能のコメント

---

## 5. エラーハンドリング

### 5.1 改善が必要な点

#### ⚠️ エラーハンドリングの欠如

**問題点:**
- `WireframeRenderer.initialize()` で canvas 作成が失敗した場合の処理がない
- `getContext('2d')` が null を返す可能性があるが、適切に処理されていない

**推奨される改善:**
```typescript
initialize(container: HTMLElement): void {
    this.canvas = document.createElement('canvas');
    if (!this.canvas) {
        throw new Error('Failed to create canvas element');
    }
    
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
        throw new Error('Failed to get 2D rendering context');
    }
    
    // ...
}
```

#### ⚠️ 無限ループの可能性

**問題箇所:**
- `Terrain.ts`: 行61-64 - パッド配置の再試行ロジックで無限ループの可能性

**推奨される改善:**
```typescript
const MAX_RETRIES = 100;
let retries = 0;

for (let i = 0; i < numPads && retries < MAX_RETRIES; i++) {
    const range = possibleRanges[Math.floor(Math.random() * possibleRanges.length)];
    const padX = range.min + Math.random() * (range.max - range.min);

    const tooClose = padLocations.some(p => Math.abs(p - padX) < 100);
    if (!tooClose) {
        padLocations.push(padX);
    } else {
        i--;
        retries++;
    }
}
```

---

## 6. パフォーマンス

### 6.1 改善が必要な点

#### ⚠️ 毎フレームの配列フィルタリング

**問題箇所:**
- `GameLoop.updateDebris()`: 行98 - 毎フレーム配列全体をフィルタリング

**推奨される改善:**
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

#### ⚠️ 毎フレームの関数バインド

**問題箇所:**
- `GameLoop.ts`: 行28, 45 - `this.loop.bind(this)` が毎フレーム実行される

**推奨される改善:**
```typescript
constructor(renderer: IRenderer) {
    // ...
    this.boundLoop = this.loop.bind(this); // 一度だけバインド
    requestAnimationFrame(this.boundLoop);
}

private loop(timestamp: number) {
    // ...
    requestAnimationFrame(this.boundLoop); // バインド済みの関数を使用
}
```

#### ⚠️ 線形探索の多用

**問題箇所:**
- `GameLoop.checkCollisions()`: 行134-164 - 全地形セグメントを線形探索
- `GameLoop.updateDebris()`: 行83-95 - デブリごとに全地形セグメントを線形探索

**推奨される改善:**
- 空間分割（Spatial Hashing）の導入
- または、地形を X 座標でソート済みと仮定し、二分探索を使用

---

## 7. テスタビリティ

### 7.1 改善が必要な点

#### ⚠️ テストが困難な設計

**問題点:**
- `Input` クラスが `window` に直接イベントリスナーを登録
- `GameLoop` のコンストラクタで即座にゲームループを開始
- 時間依存のロジック（`requestAnimationFrame`）

**推奨される改善:**
```typescript
// Input を抽象化
interface IInputSource {
    isRotatingLeft: boolean;
    isRotatingRight: boolean;
    isThrusting: boolean;
    isRestarting: boolean;
}

class KeyboardInput implements IInputSource {
    // 現在の実装
}

class MockInput implements IInputSource {
    // テスト用のモック実装
}

// GameLoop の開始を遅延
class GameLoop {
    constructor(renderer: IRenderer) {
        // 初期化のみ
    }
    
    start() {
        requestAnimationFrame(this.loop.bind(this));
    }
}
```

---

## 8. 型安全性

### 8.1 改善が必要な点

#### ⚠️ any 型の使用

**問題箇所:**
- 現時点では `any` の使用は見られないが、一部で型推論に頼りすぎている箇所がある

#### ⚠️ オプショナルパラメータの不適切な使用

**問題箇所:**
- `IRenderer.drawTerrain()`: `pads` がオプショナルだが、実際には常に渡される
- `IRenderer.drawMessage()`: `subMessage` がオプショナルだが、使用パターンが一貫していない

**推奨される改善:**
```typescript
// pads を必須にするか、専用のメソッドを作成
drawTerrain(points: Vector2[], pads: LandingPad[]): void;
drawTerrainWithPads(points: Vector2[], pads: LandingPad[]): void;
```

---

## 9. セキュリティとベストプラクティス

### 9.1 改善が必要な点

#### ⚠️ イベントリスナーのクリーンアップ不足

**問題箇所:**
- `Input.ts`: イベントリスナーが登録されるが、削除されない
- `WireframeRenderer.ts`: resize イベントリスナーが削除されない

**推奨される改善:**
```typescript
class Input {
    private handleKeyDownBound = this.handleKeyDown.bind(this);
    private handleKeyUpBound = this.handleKeyUp.bind(this);
    
    constructor() {
        window.addEventListener('keydown', this.handleKeyDownBound);
        window.addEventListener('keyup', this.handleKeyUpBound);
    }
    
    dispose() {
        window.removeEventListener('keydown', this.handleKeyDownBound);
        window.removeEventListener('keyup', this.handleKeyUpBound);
    }
}
```

---

## 10. ドキュメンテーション

### 10.1 改善が必要な点

#### ⚠️ JSDoc コメントの欠如

**問題点:**
- パブリック API に JSDoc コメントがない
- 複雑なアルゴリズム（地形生成、スコア計算）の説明が不足

**推奨される改善:**
```typescript
/**
 * 地形の難易度に基づいてスコア倍率を計算します。
 * 
 * 計算式: A × (B + 1) × (C + 1) × D
 * - A: パッド幅による係数 (20 / padWidth)
 * - B: 左壁の高さ係数 (leftWallHeight / landerHeight)
 * - C: 右壁の高さ係数 (rightWallHeight / landerHeight)
 * - D: 天井の有無による係数 (天井あり: 4, なし: 1)
 * 
 * @private
 */
private calculateMultipliers(): void {
    // ...
}
```

---

## 優先度別改善項目

### 🔴 高優先度（すぐに対応すべき）

1. **デバッグコードの削除** - 本番環境での不要なログ出力を防ぐ
2. **イベントリスナーのクリーンアップ** - メモリリークを防ぐ
3. **エラーハンドリングの追加** - アプリケーションの安定性向上
4. **マジックナンバーの定数化** - メンテナンス性の向上

### 🟡 中優先度（次のイテレーションで対応）

5. **GameLoop の責務分離** - コードの可読性とテスタビリティの向上
6. **コードの重複削除** - DRY 原則の適用
7. **長いメソッドの分割** - 可読性の向上
8. **パフォーマンス最適化** - フレームレートの安定化

### 🟢 低優先度（将来的に検討）

9. **テスタビリティの改善** - ユニットテストの導入準備
10. **JSDoc の追加** - ドキュメンテーションの充実
11. **型安全性の強化** - より厳密な型定義

---

## まとめ

全体として、コードは機能的には問題なく動作していますが、以下の点で改善の余地があります:

- **アーキテクチャ**: God Object パターンの解消が必要
- **コードの品質**: マジックナンバーの削除、重複コードの統合
- **メンテナンス性**: 長いメソッドの分割、適切なコメント
- **パフォーマンス**: 不要な計算の削減
- **テスタビリティ**: 依存性の注入、モックの容易化

これらの改善を段階的に実施することで、より保守性が高く、拡張性のあるコードベースになります。
