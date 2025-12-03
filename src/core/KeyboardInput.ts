import type { IInputSource } from './IInputSource';

/**
 * キーボード入力を処理するクラス。
 * 
 * IInputSourceインターフェースを実装し、キーボードイベントを処理します。
 */
export class KeyboardInput implements IInputSource {
    private _isRotatingLeft = false;
    private _isRotatingRight = false;
    private _isThrusting = false;
    private _isRestarting = false;
    private _isEscaping = false;
    private _isUp = false;
    private _isDown = false;
    private _isConfirm = false;

    private handleKeyDownBound = this.handleKeyDown.bind(this);
    private handleKeyUpBound = this.handleKeyUp.bind(this);

    constructor() {
        window.addEventListener('keydown', this.handleKeyDownBound);
        window.addEventListener('keyup', this.handleKeyUpBound);
    }

    get isRotatingLeft(): boolean { return this._isRotatingLeft; }
    get isRotatingRight(): boolean { return this._isRotatingRight; }
    get isThrusting(): boolean { return this._isThrusting; }
    get isRestarting(): boolean { return this._isRestarting; }
    get isEscaping(): boolean { return this._isEscaping; }
    get isUp(): boolean { return this._isUp; }
    get isDown(): boolean { return this._isDown; }
    get isConfirm(): boolean { return this._isConfirm; }

    /**
     * いずれかの操作キーが押されているかどうかを返します。
     */
    get hasAnyInput(): boolean {
        return this._isRotatingLeft || this._isRotatingRight || this._isThrusting ||
            this._isRestarting || this._isEscaping || this._isUp || this._isDown || this._isConfirm;
    }

    private handleKeyDown(e: KeyboardEvent): void {
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this._isRotatingLeft = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this._isRotatingRight = true;
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                this._isThrusting = true;
                this._isUp = true;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this._isDown = true;
                break;
            case ' ': // Space
                this._isThrusting = true;
                this._isRestarting = true;
                this._isConfirm = true;
                break;
            case 'Enter':
                this._isConfirm = true;
                break;
            case 'Escape':
                this._isEscaping = true;
                break;
        }
    }

    private handleKeyUp(e: KeyboardEvent): void {
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this._isRotatingLeft = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this._isRotatingRight = false;
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                this._isThrusting = false;
                this._isUp = false;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this._isDown = false;
                break;
            case ' ': // Space
                this._isThrusting = false;
                this._isRestarting = false;
                this._isConfirm = false;
                break;
            case 'Enter':
                this._isConfirm = false;
                break;
            case 'Escape':
                this._isEscaping = false;
                break;
        }
    }

    dispose(): void {
        window.removeEventListener('keydown', this.handleKeyDownBound);
        window.removeEventListener('keyup', this.handleKeyUpBound);
    }
}
