# Issue #003: エラーハンドリングの追加

## 優先度
🔴 高優先度

## 概要
アプリケーションの安定性向上のため、適切なエラーハンドリングを追加する必要があります。

## 問題箇所

### WireframeRenderer.ts
- `initialize()` で canvas 作成が失敗した場合の処理がない
- `getContext('2d')` が null を返す可能性があるが、適切に処理されていない

### Terrain.ts
- 行61-64: パッド配置の再試行ロジックで無限ループの可能性

## 提案される修正

```typescript
// WireframeRenderer.ts
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

// Terrain.ts
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

if (padLocations.length < numPads) {
    console.warn(`Could only place ${padLocations.length} out of ${numPads} landing pads`);
}
```

## 影響範囲
- `src/renderer/WireframeRenderer.ts`
- `src/entities/Terrain.ts`

## 検証方法
1. 正常系でエラーが発生しないこと
2. Canvas が作成できない環境で適切なエラーメッセージが表示されること
3. 地形生成が無限ループに陥らないこと
