# Issue #013: テスト導入準備（テスタビリティの改善）

status: fixed

## 優先度
🟢 低優先度

## 概要
ユニットテストを導入するための準備として、テストが困難な設計を改善する必要があります。

## 問題点

### 13.1 テストが困難な設計

**問題箇所:**
- `Input` クラスが `window` に直接イベントリスナーを登録
- `GameLoop` のコンストラクタで即座にゲームループを開始
- 時間依存のロジック（`requestAnimationFrame`）
- グローバル状態への依存（`window.innerWidth`, `window.innerHeight`）

**影響:**
- ユニットテストが書けない
- モックの作成が困難
- テストの実行速度が遅い

## 提案される修正

### 1. Input の抽象化

```typescript
// src/core/IInputSource.ts
export interface IInputSource {
    isRotatingLeft: boolean;
    isRotatingRight: boolean;
    isThrusting: boolean;
    isRestarting: boolean;
    dispose(): void;
}

// src/core/KeyboardInput.ts
export class KeyboardInput implements IInputSource {
    // 現在の Input クラスの実装
}

// src/core/MockInput.ts (テスト用)
export class MockInput implements IInputSource {
    isRotatingLeft = false;
    isRotatingRight = false;
    isThrusting = false;
    isRestarting = false;
    
    dispose(): void {}
    
    // テスト用のヘルパーメソッド
    pressLeft(): void { this.isRotatingLeft = true; }
    releaseLeft(): void { this.isRotatingLeft = false; }
    // ...
}
```

### 2. GameLoop の開始を遅延

```typescript
export class GameLoop {
    private isRunning = false;
    
    constructor(renderer: IRenderer, input: IInputSource) {
        this.renderer = renderer;
        this.input = input;
        // 初期化のみ、ループは開始しない
    }
    
    start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.boundLoop = this.loop.bind(this);
        requestAnimationFrame(this.boundLoop);
    }
    
    stop(): void {
        this.isRunning = false;
    }
    
    // テスト用: 1フレームだけ更新
    updateOnce(deltaTime: number): void {
        this.update(deltaTime);
    }
}
```

### 3. 時間の抽象化

```typescript
// src/core/ITimeSource.ts
export interface ITimeSource {
    now(): number;
    requestFrame(callback: (timestamp: number) => void): number;
    cancelFrame(id: number): void;
}

// src/core/BrowserTimeSource.ts
export class BrowserTimeSource implements ITimeSource {
    now(): number {
        return performance.now();
    }
    
    requestFrame(callback: (timestamp: number) => void): number {
        return requestAnimationFrame(callback);
    }
    
    cancelFrame(id: number): void {
        cancelAnimationFrame(id);
    }
}

// src/core/MockTimeSource.ts (テスト用)
export class MockTimeSource implements ITimeSource {
    private currentTime = 0;
    
    now(): number {
        return this.currentTime;
    }
    
    advance(ms: number): void {
        this.currentTime += ms;
    }
    
    requestFrame(callback: (timestamp: number) => void): number {
        callback(this.currentTime);
        return 0;
    }
    
    cancelFrame(_id: number): void {}
}
```

### 4. グローバル状態の注入

```typescript
export interface ViewportSize {
    width: number;
    height: number;
}

export class GameLoop {
    constructor(
        renderer: IRenderer,
        input: IInputSource,
        viewport: ViewportSize
    ) {
        // viewport を使用
    }
}

// 実際の使用
const gameLoop = new GameLoop(
    renderer,
    new KeyboardInput(),
    { width: window.innerWidth, height: window.innerHeight }
);

// テスト
const gameLoop = new GameLoop(
    mockRenderer,
    new MockInput(),
    { width: 800, height: 600 }
);
```

## 影響範囲
- 新規ファイル: `src/core/IInputSource.ts`
- 新規ファイル: `src/core/KeyboardInput.ts`
- 新規ファイル: `src/core/MockInput.ts`
- 新規ファイル: `src/core/ITimeSource.ts`
- 新規ファイル: `src/core/BrowserTimeSource.ts`
- 新規ファイル: `src/core/MockTimeSource.ts`
- `src/core/GameLoop.ts` - 依存性注入の追加
- `src/core/Input.ts` - KeyboardInput にリネーム
- `src/main.ts` - 初期化コードの更新

## 検証方法
1. ビルドが成功すること
2. ゲームの動作が変わらないこと
3. MockInput と MockTimeSource を使用した簡単なテストが書けること
4. GameLoop.start() と stop() が正しく動作すること
