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

    /** ESCキーが押されているか */
    readonly isEscaping: boolean;

    /** 上キーが押されているか（メニュー用） */
    readonly isUp: boolean;

    /** 下キーが押されているか（メニュー用） */
    readonly isDown: boolean;

    /** 決定キー（Space/Enter）が押されているか（メニュー用） */
    readonly isConfirm: boolean;

    /**
     * 入力ソースのリソースを解放します。
     */
    dispose(): void;
}
