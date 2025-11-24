/**
 * ゲームの状態を表す定数オブジェクト。
 */
export const GameStatus = {
    /** ゲームプレイ中 */
    PLAYING: 'PLAYING',
    /** クラッシュした */
    CRASHED: 'CRASHED',
    /** 着陸成功 */
    LANDED: 'LANDED'
} as const;

/**
 * GameStatus型の定義。
 */
export type GameStatus = typeof GameStatus[keyof typeof GameStatus];

/**
 * ゲームの状態を管理するクラス。
 * 
 * スコア、燃料、ゲームステータスなどを保持します。
 */
export class GameState {
    /** 現在のゲームステータス */
    public status: GameStatus = GameStatus.PLAYING;

    /** 現在のスコア */
    public score: number = 0;

    /** 残り燃料 */
    public fuel: number = 500;

    /**
     * 燃料を消費します。
     * 
     * @param amount - 消費する燃料量
     */
    consumeFuel(amount: number): void {
        this.fuel = Math.max(0, this.fuel - amount);
    }

    /**
     * 燃料が空かどうかを判定します。
     * 
     * @returns 燃料が空の場合true
     */
    isFuelEmpty(): boolean {
        return this.fuel <= 0;
    }
}
