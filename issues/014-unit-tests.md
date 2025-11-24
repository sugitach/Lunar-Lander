# Issue #014: ユニットテストの作成

## 優先度
🟢 低優先度

## 概要
各モジュールのユニットテストを作成し、コードの品質と信頼性を向上させます。

## 前提条件
- Issue #013（テスト導入準備）が完了していること
- テストフレームワーク（Vitest推奨）がセットアップされていること

## テスト対象モジュール

### 14.1 コアシステム

#### Vector2.ts
```typescript
describe('Vector2', () => {
    test('add() should add two vectors', () => {
        const v1 = new Vector2(1, 2);
        const v2 = new Vector2(3, 4);
        const result = v1.add(v2);
        expect(result.x).toBe(4);
        expect(result.y).toBe(6);
    });
    
    test('length() should calculate magnitude', () => {
        const v = new Vector2(3, 4);
        expect(v.length()).toBe(5);
    });
    
    // その他のメソッドのテスト
});
```

#### Physics.ts
```typescript
describe('Physics', () => {
    test('applyGravity() should apply gravity force', () => {
        const velocity = new Vector2(0, 0);
        const result = Physics.applyGravity(velocity, 1);
        expect(result.y).toBeGreaterThan(0);
    });
    
    test('checkLineIntersection() should detect intersection', () => {
        const p1 = new Vector2(0, 0);
        const p2 = new Vector2(10, 10);
        const p3 = new Vector2(0, 10);
        const p4 = new Vector2(10, 0);
        const intersection = Physics.checkLineIntersection(p1, p2, p3, p4);
        expect(intersection).not.toBeNull();
        expect(intersection?.x).toBeCloseTo(5);
        expect(intersection?.y).toBeCloseTo(5);
    });
});
```

#### CollisionDetector.ts
```typescript
describe('CollisionDetector', () => {
    let detector: CollisionDetector;
    let mockLander: Lander;
    let mockTerrain: Terrain;
    
    beforeEach(() => {
        detector = new CollisionDetector();
        mockLander = createMockLander();
        mockTerrain = createMockTerrain();
    });
    
    test('checkLanderTerrainCollision() should detect foot collision', () => {
        // テストケース
    });
    
    test('checkBoundaries() should wrap X coordinate', () => {
        // テストケース
    });
});
```

#### GameStateManager.ts
```typescript
describe('GameStateManager', () => {
    let manager: GameStateManager;
    
    beforeEach(() => {
        manager = new GameStateManager();
    });
    
    test('isSafeToLand() should return true for safe landing', () => {
        const lander = new Lander(100, 100);
        lander.velocity = new Vector2(0.5, 0.5);
        lander.rotation = -Math.PI / 2;
        expect(manager.isSafeToLand(lander)).toBe(true);
    });
    
    test('isSafeToLand() should return false for unsafe landing', () => {
        const lander = new Lander(100, 100);
        lander.velocity = new Vector2(5, 5);
        expect(manager.isSafeToLand(lander)).toBe(false);
    });
    
    test('handleCrash() should spawn debris', () => {
        const lander = new Lander(100, 100);
        const gameState = new GameState();
        const debris = manager.handleCrash(lander, gameState);
        expect(debris.length).toBeGreaterThan(0);
        expect(gameState.status).toBe(GameStatus.CRASHED);
    });
});
```

#### DebrisManager.ts
```typescript
describe('DebrisManager', () => {
    let manager: DebrisManager;
    
    beforeEach(() => {
        manager = new DebrisManager();
    });
    
    test('spawn() should create debris', () => {
        manager.spawn(new Vector2(100, 100), 5);
        expect(manager.getAll().length).toBe(5);
    });
    
    test('update() should remove inactive debris', () => {
        manager.spawn(new Vector2(100, 100), 3);
        const debris = manager.getAll();
        debris[0].active = false;
        
        const mockTerrain = createMockTerrain();
        manager.update(mockTerrain);
        
        expect(manager.getAll().length).toBe(2);
    });
    
    test('clear() should remove all debris', () => {
        manager.spawn(new Vector2(100, 100), 5);
        manager.clear();
        expect(manager.getAll().length).toBe(0);
    });
});
```

### 14.2 エンティティ

#### Lander.ts
```typescript
describe('Lander', () => {
    test('update() should apply gravity', () => {
        const lander = new Lander(100, 100);
        const mockInput = new MockInput();
        const gameState = new GameState();
        
        const initialY = lander.velocity.y;
        lander.update(mockInput, gameState, 1);
        
        expect(lander.velocity.y).toBeGreaterThan(initialY);
    });
    
    test('update() should apply thrust when input is active', () => {
        const lander = new Lander(100, 100);
        const mockInput = new MockInput();
        mockInput.isThrusting = true;
        const gameState = new GameState();
        gameState.fuel = 100;
        
        lander.update(mockInput, gameState, 1);
        
        expect(gameState.fuel).toBeLessThan(100);
    });
});
```

#### Terrain.ts
```typescript
describe('Terrain', () => {
    test('generateTerrain() should create points', () => {
        const terrain = new Terrain(800, 600);
        expect(terrain.points.length).toBeGreaterThan(0);
    });
    
    test('generateTerrain() should create landing pads', () => {
        const terrain = new Terrain(800, 600);
        expect(terrain.pads.length).toBeGreaterThan(0);
    });
    
    test('pads should have valid multipliers', () => {
        const terrain = new Terrain(800, 600);
        terrain.pads.forEach(pad => {
            expect(pad.multiplier).toBeGreaterThan(0);
        });
    });
});
```

### 14.3 ゲーム状態

#### GameState.ts
```typescript
describe('GameState', () => {
    test('consumeFuel() should decrease fuel', () => {
        const state = new GameState();
        const initialFuel = state.fuel;
        state.consumeFuel(10);
        expect(state.fuel).toBe(initialFuel - 10);
    });
    
    test('consumeFuel() should not go below zero', () => {
        const state = new GameState();
        state.consumeFuel(1000);
        expect(state.fuel).toBe(0);
    });
    
    test('isFuelEmpty() should return correct value', () => {
        const state = new GameState();
        expect(state.isFuelEmpty()).toBe(false);
        state.consumeFuel(1000);
        expect(state.isFuelEmpty()).toBe(true);
    });
});
```

## テストフレームワークのセットアップ

### Vitestの導入
```bash
npm install -D vitest @vitest/ui
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

### package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## ディレクトリ構造
```
src/
├── core/
│   ├── Vector2.ts
│   └── Vector2.test.ts
├── entities/
│   ├── Lander.ts
│   └── Lander.test.ts
└── ...
```

## 検証方法
1. すべてのテストがパスすること
2. カバレッジが70%以上であること
3. `npm test` でテストが実行できること
4. CI/CDパイプラインでテストが自動実行されること

## カバレッジ目標
- Vector2: 100%
- Physics: 90%以上
- CollisionDetector: 80%以上
- GameStateManager: 80%以上
- DebrisManager: 90%以上
- その他: 70%以上
