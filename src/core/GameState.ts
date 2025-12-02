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

    /** ハイスコア */
    public highScore: number = 0;

    /** プレイ時間（秒） */
    public playTime: number = 0;

    /** 使用燃料 */
    public fuelUsed: number = 0;

    /** 総移動距離（ピクセル） */
    public totalDistance: number = 0;

    /** 最大速度（ピクセル/秒） */
    public maxSpeed: number = 0;

    /** ゲーム開始時刻（タイムスタンプ） */
    public gameStartTime: number = 0;


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
