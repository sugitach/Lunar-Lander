# Issue #004: マジックナンバーの定数化

status: fixed

## 優先度
🔴 高優先度

## 概要
メンテナンス性向上のため、ハードコードされた数値を定数化する必要があります。

## 問題箇所

### GameLoop.ts
- 行118, 119, 130, 131: 足の座標 `(-15, 20)`, `(15, 20)`
- 行190: 着陸時のY座標調整 `padY - 20`

### Lander.ts
- 行22: `deltaTime * 60` の60

### Terrain.ts
- 行166-167: `minStep = 15`, `maxStep = 40`
- 行32: `exclusionZone = 150`
- 行56: パッド間の最小距離 `100`
- 行71: パッド幅の範囲 `40 + Math.random() * 60`

### Debris.ts
- 行23: 重力値 `0.05`

### WireframeRenderer.ts
- 行82-87: 機体の形状座標

## 提案される修正

```typescript
// src/core/Constants.ts
export const LANDER_CONSTANTS = {
    FOOT_LEFT_X: -15,
    FOOT_LEFT_Y: 20,
    FOOT_RIGHT_X: 15,
    FOOT_RIGHT_Y: 20,
    BODY_HEIGHT: 20,
    TARGET_FPS: 60,
    WIDTH: 20,
    HEIGHT: 20
} as const;

export const TERRAIN_CONSTANTS = {
    MIN_STEP: 15,
    MAX_STEP: 40,
    EXCLUSION_ZONE: 150,
    MIN_PAD_DISTANCE: 100,
    MIN_PAD_WIDTH: 40,
    MAX_PAD_WIDTH: 100,
    MAX_PLACEMENT_RETRIES: 100
} as const;

export const PHYSICS_CONSTANTS = {
    DEBRIS_GRAVITY: 0.05
} as const;
```

## 影響範囲
- 新規ファイル: `src/core/Constants.ts`
- `src/core/GameLoop.ts`
- `src/entities/Lander.ts`
- `src/entities/Terrain.ts`
- `src/entities/Debris.ts`
- `src/renderer/WireframeRenderer.ts`

## 検証方法
1. ビルドが成功すること
2. ゲームの動作が変わらないこと
3. すべての定数が適切に使用されていること
