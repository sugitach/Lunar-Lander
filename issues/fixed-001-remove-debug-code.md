# Issue #001: デバッグコードの削除

status: fixed

## 優先度
🔴 高優先度

## 概要
本番環境での不要なログ出力を防ぐため、デバッグコードを削除または適切に管理する必要があります。

## 問題箇所

### GameLoop.ts
- 行31: 意味のないコメント `// ...`
- 行37-40: デバッグログが本番コードに残っている
```typescript
if (Math.random() < 0.01) {
    console.log(`Loop running. Status: ${this.gameState.status}, Lander: (${this.lander.position.x}, ${this.lander.position.y}), Terrain points: ${this.terrain.points.length}`);
}
```

### WireframeRenderer.ts
- 行37: `console.error` が残っている

## 提案される修正

1. デバッグユーティリティクラスを作成
2. 環境変数に基づいてログを制御
3. 本番環境では無効化

```typescript
// src/core/Debug.ts
export class Debug {
    static enabled = import.meta.env.DEV;
    
    static log(...args: any[]) {
        if (this.enabled) console.log(...args);
    }
    
    static error(...args: any[]) {
        if (this.enabled) console.error(...args);
    }
}
```

## 影響範囲
- `src/core/GameLoop.ts`
- `src/renderer/WireframeRenderer.ts`
- 新規ファイル: `src/core/Debug.ts`

## 検証方法
1. ビルドが成功すること
2. 開発環境でログが出力されること
3. 本番ビルド（`npm run build`）でログが出力されないこと
