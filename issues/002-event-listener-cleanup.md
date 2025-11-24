# Issue #002: イベントリスナーのクリーンアップ

## 優先度
🔴 高優先度

## 概要
メモリリークを防ぐため、イベントリスナーの適切なクリーンアップが必要です。

## 問題箇所

### Input.ts
- イベントリスナーが登録されるが、削除されない
- `window.addEventListener` が呼ばれるが、対応する `removeEventListener` がない

### WireframeRenderer.ts
- resize イベントリスナーが削除されない

## 提案される修正

```typescript
// Input.ts
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

// WireframeRenderer.ts
class WireframeRenderer {
    private resizeBound = this.resize.bind(this);
    
    initialize(container: HTMLElement): void {
        // ...
        window.addEventListener('resize', this.resizeBound);
    }
    
    dispose(): void {
        window.removeEventListener('resize', this.resizeBound);
    }
}
```

## 影響範囲
- `src/core/Input.ts`
- `src/renderer/WireframeRenderer.ts`
- `src/renderer/IRenderer.ts` (dispose メソッドの追加)
- `src/core/GameLoop.ts` (dispose 呼び出しの追加)

## 検証方法
1. ゲームを開始・終了を繰り返してもメモリリークが発生しないこと
2. イベントリスナーが正しく削除されること（開発者ツールで確認）
