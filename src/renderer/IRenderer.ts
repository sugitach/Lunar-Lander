import { Vector2 } from '../core/Vector2';
import { GameState, Difficulty } from '../core/GameState';
import type { LandingPad } from '../entities/Terrain';
import type { Debris } from '../entities/Debris';

/**
 * レンダラーのインターフェース。
 * 
 * ゲームの描画を担当します。異なる描画方式（Canvas、WebGL等）を
 * 実装できるように抽象化されています。
 */
export interface IRenderer {
    /**
     * レンダラーを初期化します。
     * 
     * @param container - レンダリング先のHTML要素
     * @throws {Error} キャンバスまたはコンテキストの作成に失敗した場合
     */
    initialize(container: HTMLElement): void;

    /**
     * 画面をクリアします。
     */
    clear(): void;

    /**
     * 着陸船を描画します。
     * 
     * @param position - 着陸船の位置
     * @param rotation - 着陸船の回転角度（ラジアン）
     * @param isThrusting - エンジンが噴射中かどうか
     * @param isCrashed - クラッシュ状態かどうか
     * @param isSafe - 安全な着陸速度・角度かどうか
     */
    drawLander(position: Vector2, rotation: number, isThrusting: boolean, isCrashed: boolean, isSafe: boolean): void;

    /**
     * 地形を描画します。
     * 
     * @param points - 地形を構成する点の配列
     * @param pads - 着陸パッドの配列
     */
    drawTerrain(points: Vector2[], pads: LandingPad[]): void;

    /**
     * UIを描画します。
     * 
     * @param gameState - ゲーム状態
     * @param velocity - 着陸船の速度
     * @param altitude - 着陸船の高度
     */
    drawUI(gameState: GameState, velocity: Vector2, altitude: number): void;

    /**
     * メッセージを描画します。
     * 
     * @param message - メインメッセージ
     * @param subMessage - サブメッセージ
     */
    drawMessage(message: string, subMessage: string): void;

    /**
     * デブリを描画します。
     * 
     * @param debris - デブリの配列
     */
    drawDebris(debris: Debris[]): void;

    /**
     * スコア画面を描画します。
     * 
     * @param state - ゲーム状態
     * @param canContinue - 5秒経過して続行可能かどうか
     */
    drawScoreScreen(state: GameState, canContinue: boolean): void;

    /**
     * 難易度選択画面を描画します。
     * 
     * @param currentSelection - 現在選択されている難易度
     */
    drawDifficultyScreen(currentSelection: Difficulty): void;

    /**
     * カスタム難易度設定画面を描画します。
     * @param currentSettings 現在のカスタム設定
     * @param selectedIndex 現在選択されている項目のインデックス
     */
    drawCustomSettingsScreen(currentSettings: any, selectedIndex: number): void;

    /**
     * レンダラーのリソースを解放します。
     */
    dispose(): void;
}
