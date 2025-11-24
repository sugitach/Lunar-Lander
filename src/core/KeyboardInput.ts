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

    private handleKeyDownBound = this.handleKeyDown.bind(this);
    private handleKeyUpBound = this.handleKeyUp.bind(this);

    constructor() {
        window.addEventListener('keydown', this.handleKeyDownBound);
        window.addEventListener('keyup', this.handleKeyUpBound);
    }

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
                break;
            case ' ': // Space for thrust and restart
                this._isThrusting = true;
                this._isRestarting = true;
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
                break;
            case ' ': // Space
                this._isThrusting = false;
                this._isRestarting = false;
                break;
        }
    }

    dispose(): void {
        window.removeEventListener('keydown', this.handleKeyDownBound);
        window.removeEventListener('keyup', this.handleKeyUpBound);
    }
}
