# Issue #007: コードの重複削除

status: fixed

## 優先度
🟡 中優先度

## 概要
DRY（Don't Repeat Yourself）原則に違反するコードの重複が存在します。これらを統合してメンテナンス性を向上させる必要があります。

## 問題点

### 7.1 線分交差判定の重複

**重複箇所:**
- `Physics.checkLineIntersection()` (Physics.ts:23-39)
- `Terrain.checkIntersection()` (Terrain.ts:270-284)

ほぼ同一のロジックが2箇所に存在しています。

**問題:**
- コードの保守性が低下
- バグ修正時に両方を修正する必要がある
- 実装の不一致が発生する可能性

### 7.2 重力計算の重複

**重複箇所:**
- `Physics.applyGravity()` で `GRAVITY` 定数を使用
- `Debris.update()` で `PHYSICS_CONSTANTS.DEBRIS_GRAVITY` を使用

異なる定数を使用しているが、同じ重力値を表しています。

## 提案される修正

### 1. 線分交差判定の統合
```typescript
// Terrain.ts
import { Physics } from '../core/Physics';

private intersectsAny(p1: Vector2, p2: Vector2): boolean {
    for (let i = 0; i < this.points.length - 2; i++) {
        const s1 = this.points[i];
        const s2 = this.points[i + 1];
        if (Physics.checkLineIntersection(p1, p2, s1, s2)) return true;
    }
    return false;
}

// Terrain.checkIntersection() メソッドを削除
```

### 2. 重力定数の統一
```typescript
// Constants.ts
export const PHYSICS_CONSTANTS = {
    GRAVITY_Y: 0.05  // 統一された重力定数
} as const;

// Physics.ts
export const GRAVITY = new Vector2(0, PHYSICS_CONSTANTS.GRAVITY_Y);

// Debris.ts
import { PHYSICS_CONSTANTS } from '../core/Constants';
this.velocity.y += PHYSICS_CONSTANTS.GRAVITY_Y;
```

## 影響範囲
- `src/entities/Terrain.ts` - `checkIntersection()`メソッドの削除、`intersectsAny()`の修正
- `src/core/Constants.ts` - 重力定数の統一
- `src/core/Physics.ts` - 統一定数の使用
- `src/entities/Debris.ts` - 統一定数の使用

## 検証方法
1. ビルドが成功すること
2. 地形生成が正常に動作すること
3. デブリの落下速度が変わらないこと
4. すべての重複コードが削除されていること
