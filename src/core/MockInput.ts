import type { IInputSource } from './IInputSource';

/**
 * テスト用のモック入力クラス。
 * 
 * プログラムから入力状態を制御できるようにします。
 */
export class MockInput implements IInputSource {
    private _isRotatingLeft = false;
    private _isRotatingRight = false;
    private _isThrusting = false;
    private _isRestarting = false;

    get isRotatingLeft(): boolean {
        return this._isRotatingLeft;
    }

    get isRotatingRight(): boolean {
        return this._isRotatingRight;
    }

    get isThrusting(): boolean {
        return this._isThrusting;
    }

    get isRestarting(): boolean {
        return this._isRestarting;
    }

    /**
     * 左回転キーを押す。
     */
    pressLeft(): void {
        this._isRotatingLeft = true;
    }

    /**
     * 左回転キーを離す。
     */
    releaseLeft(): void {
        this._isRotatingLeft = false;
    }

    /**
     * 右回転キーを押す。
     */
    pressRight(): void {
        this._isRotatingRight = true;
    }

    /**
     * 右回転キーを離す。
     */
    releaseRight(): void {
        this._isRotatingRight = false;
    }

    /**
     * 推力キーを押す。
     */
    pressThrust(): void {
        this._isThrusting = true;
    }

    /**
     * 推力キーを離す。
     */
    releaseThrust(): void {
        this._isThrusting = false;
    }

    /**
     * 再スタートキーを押す。
     */
    pressRestart(): void {
        this._isRestarting = true;
    }

    /**
     * 再スタートキーを離す。
     */
    releaseRestart(): void {
        this._isRestarting = false;
    }

    /**
     * すべてのキーを離す。
     */
    releaseAll(): void {
        this._isRotatingLeft = false;
        this._isRotatingRight = false;
        this._isThrusting = false;
        this._isRestarting = false;
    }

    dispose(): void {
        // モック入力はリソースを持たないため、何もしない
    }
}
