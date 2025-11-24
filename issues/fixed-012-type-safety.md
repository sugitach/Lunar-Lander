# Issue #012: 型安全性の強化

status: fixed

## 優先度
🟢 低優先度

## 概要
TypeScriptの型システムをより厳密に活用し、型安全性を強化する必要があります。

## 問題点

### 12.1 オプショナルパラメータの不適切な使用

**問題箇所:**
- `IRenderer.drawTerrain()`: `pads` がオプショナルだが、実際には常に渡される
- `IRenderer.drawMessage()`: `subMessage` がオプショナルだが、使用パターンが一貫していない

**現状:**
```typescript
drawTerrain(points: Vector2[], pads?: LandingPad[]): void;
drawMessage(message: string, subMessage?: string): void;
```

**問題:**
- 実際には常に渡されるパラメータがオプショナルになっている
- 呼び出し側で不要なnullチェックが必要
- 型推論が弱くなる

### 12.2 型推論への過度な依存

**問題箇所:**
- 一部のメソッドで戻り値の型が明示されていない
- ローカル変数の型が推論に頼りすぎている

**現状:**
```typescript
private calculateMultipliers() {  // 戻り値の型が不明
    // ...
}
```

## 提案される修正

### 1. オプショナルパラメータの見直し

```typescript
// IRenderer.ts
export interface IRenderer {
    // pads を必須にする
    drawTerrain(points: Vector2[], pads: LandingPad[]): void;
    
    // subMessage を必須にするか、オーバーロードを使用
    drawMessage(message: string, subMessage: string): void;
    drawMessageSimple(message: string): void;
}
```

### 2. 明示的な型注釈の追加

```typescript
// 戻り値の型を明示
private calculateMultipliers(): void {
    // ...
}

// 複雑な型には明示的な注釈
const footPositions: {
    leftFoot: Vector2;
    rightFoot: Vector2;
    prevLeftFoot: Vector2;
    prevRightFoot: Vector2;
} = this.calculateFootPositions();
```

### 3. 型エイリアスの活用

```typescript
// 複雑な型に名前を付ける
export type FootPositions = {
    leftFoot: Vector2;
    rightFoot: Vector2;
    prevLeftFoot: Vector2;
    prevRightFoot: Vector2;
};

private calculateFootPositions(): FootPositions {
    // ...
}
```

### 4. strictモードの有効化（オプション）

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true
  }
}
```

## 影響範囲
- `src/renderer/IRenderer.ts` - インターフェースの修正
- `src/renderer/WireframeRenderer.ts` - 実装の修正
- `src/core/GameLoop.ts` - 呼び出し側の修正
- `src/core/CollisionDetector.ts` - 型注釈の追加
- その他、型推論に頼っている箇所

## 検証方法
1. TypeScriptコンパイラがエラーなくビルドできること
2. IDEで型情報が正しく表示されること
3. 不要なnullチェックが削減されていること
4. `tsc --noEmit` でエラーが出ないこと
