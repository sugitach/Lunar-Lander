/**
 * 2次元ベクトルを表すクラス。
 * 
 * 位置、速度、加速度などの2次元の量を表現するために使用されます。
 * イミュータブルな設計で、すべての操作は新しいVector2インスタンスを返します。
 */
export class Vector2 {
    public x: number;
    public y: number;

    /**
     * Vector2インスタンスを作成します。
     * 
     * @param x - X座標（デフォルト: 0）
     * @param y - Y座標（デフォルト: 0）
     */
    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * このベクトルと別のベクトルを加算します。
     * 
     * @param v - 加算するベクトル
     * @returns 加算結果の新しいベクトル
     */
    add(v: Vector2): Vector2 {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    /**
     * このベクトルから別のベクトルを減算します。
     * 
     * @param v - 減算するベクトル
     * @returns 減算結果の新しいベクトル
     */
    sub(v: Vector2): Vector2 {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    /**
     * このベクトルをスカラー値で乗算します。
     * 
     * @param scalar - 乗算するスカラー値
     * @returns 乗算結果の新しいベクトル
     */
    multiply(scalar: number): Vector2 {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    /**
     * このベクトルの長さ（大きさ）を計算します。
     * 
     * @returns ベクトルの長さ
     */
    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * このベクトルを正規化します（長さを1にします）。
     * 
     * @returns 正規化された新しいベクトル
     */
    normalize(): Vector2 {
        const len = this.length();
        if (len === 0) return new Vector2(0, 0);
        return new Vector2(this.x / len, this.y / len);
    }

    /**
     * このベクトルを指定した角度だけ回転します。
     * 
     * @param angle - 回転角度（ラジアン）
     * @returns 回転後の新しいベクトル
     */
    rotate(angle: number): Vector2 {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    /**
     * このベクトルのコピーを作成します。
     * 
     * @returns このベクトルのコピー
     */
    clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }
}
