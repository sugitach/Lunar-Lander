# Issue #010: 残存するconsole呼び出しの削除

## 優先度
🔴 高優先度

## 概要
Issue #001で`Debug`ユーティリティクラスを作成しましたが、一部のファイルでまだ直接的な`console`呼び出しが残っています。これらを`Debug`クラスに置き換える必要があります。

## 問題箇所

### main.ts
```typescript
// 行8
console.log("App element found, initializing game...");

// 行13
console.log("Game loop started.");

// 行16
console.error("App element NOT found!");
```

### Terrain.ts
```typescript
// 行64
console.warn(`Could only place ${padLocations.length} out of ${numPads} landing pads`);
```

## 提案される修正

### main.ts
```typescript
import { Debug } from './core/Debug';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  Debug.log("App element found, initializing game...");
  
  const renderer = new WireframeRenderer();
  renderer.initialize(app);
  
  new GameLoop(renderer);
  Debug.log("Game loop started.");
} else {
  Debug.error("App element NOT found!");
}
```

### Terrain.ts
```typescript
import { Debug } from '../core/Debug';

// ...

if (padLocations.length < numPads) {
    Debug.log(`Could only place ${padLocations.length} out of ${numPads} landing pads`);
}
```

**注意:** `console.warn`は警告レベルのログですが、現在の`Debug`クラスには`warn`メソッドがありません。以下の2つの選択肢があります：

1. `Debug.log`を使用（推奨）
2. `Debug`クラスに`warn`メソッドを追加

## 影響範囲
- `src/main.ts` - `Debug`のimportと使用
- `src/entities/Terrain.ts` - `Debug`のimportと使用
- （オプション）`src/core/Debug.ts` - `warn`メソッドの追加

## 検証方法
1. ビルドが成功すること
2. 開発環境でログが正常に出力されること
3. 本番ビルドでログが出力されないこと
4. `grep -r "console\." src/` で直接的なconsole呼び出しが見つからないこと（Debug.ts内を除く）
