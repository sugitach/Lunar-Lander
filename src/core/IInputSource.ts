/**
 * 入力ソースのインターフェース。
 * 
 * キーボード、ゲームパッド、モック入力など、異なる入力方式を
 * 抽象化します。テストでモック実装を使用できるようにします。
 */
export interface IInputSource {
    /** 左回転キーが押されているか */
    readonly isRotatingLeft: boolean;

    /** 右回転キーが押されているか */
    readonly isRotatingRight: boolean;

    /** 推力キーが押されているか */
    readonly isThrusting: boolean;

    /** 再スタートキーが押されているか */
    readonly isRestarting: boolean;

    /**
     * 入力ソースのリソースを解放します。
     */
    dispose(): void;
}
