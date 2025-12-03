import type { IRenderer } from './IRenderer';
import { Vector2 } from '../core/Vector2';
import { GameState, Difficulty } from '../core/GameState';
import { Debug } from '../core/Debug';
import { pixelsToMeters, SCORE_SCREEN_CONSTANTS, DIFFICULTY_SETTINGS, type DifficultySetting } from '../core/Constants';

/**
 * ワイヤーフレーム描画を行うレンダラークラス。
 * 
 * HTML5 Canvas APIを使用して、ゲームの各要素を線画で描画します。
 * レトロな雰囲気を演出するための単純な図形描画を行います。
 */
export class WireframeRenderer implements IRenderer {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private width: number = 0;
    private height: number = 0;
    private resizeBound = this.resize.bind(this);

    /**
     * レンダラーを初期化します。
     * 
     * キャンバス要素を作成し、指定されたコンテナに追加します。
     * 
     * @param container - キャンバスを追加する親要素
     * @throws {Error} キャンバスまたはコンテキストの作成に失敗した場合
     */
    initialize(container: HTMLElement): void {
        this.canvas = document.createElement('canvas');

        if (!this.canvas) {
            const error = 'Failed to create canvas element';
            console.error('[RENDERER]', error);
            throw new Error(error);
        }

        this.canvas.style.display = 'block';
        container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');

        if (!this.ctx) {
            const error = 'Failed to get 2D rendering context';
            console.error('[RENDERER]', error);
            throw new Error(error);
        }

        this.resize();
        window.addEventListener('resize', this.resizeBound);
    }

    /**
     * レンダラーのリソースを破棄します。
     * イベントリスナーの解除などを行います。
     */
    dispose(): void {
        window.removeEventListener('resize', this.resizeBound);
    }

    /**
     * キャンバスのサイズをウィンドウサイズに合わせます。
     */
    private resize(): void {
        if (!this.canvas) return;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    /**
     * 画面をクリアします。
     * 背景色（黒）で塗りつぶします。
     */
    clear(): void {
        if (!this.ctx) return;
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * 着陸船を描画します。
     * 
     * @param position - 位置
     * @param rotation - 回転角度
     * @param isThrusting - 推力噴射中かどうか
     * @param isCrashed - クラッシュ状態かどうか
     * @param isSafe - 着陸可能な状態（速度・角度が安全圏内）かどうか
     */
    drawLander(position: Vector2, rotation: number, isThrusting: boolean, isCrashed: boolean, isSafe: boolean): void {
        if (!this.ctx) {
            Debug.error("drawLander: No context!");
            return;
        }

        this.ctx.save();
        this.ctx.translate(position.x, position.y);
        this.ctx.rotate(rotation + Math.PI / 2); // Adjust for 0 being UP

        if (isCrashed) {
            // Crumpled Lander
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            // Random jagged lines to simulate crumple
            this.ctx.moveTo(-10, 10);
            this.ctx.lineTo(-5, -5);
            this.ctx.lineTo(0, 5);
            this.ctx.lineTo(5, -10);
            this.ctx.lineTo(10, 10);
            this.ctx.lineTo(0, 15);
            this.ctx.closePath();
            this.ctx.stroke();

            // Fire effect (random lines)
            this.ctx.strokeStyle = '#FFA500'; // Orange
            this.ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const r1 = Math.random() * 20 - 10;
                const r2 = Math.random() * 20 - 10;
                this.ctx.moveTo(r1, r2);
                this.ctx.lineTo(r1 + (Math.random() - 0.5) * 10, r2 - 10 - Math.random() * 10);
            }
            this.ctx.stroke();

        } else {
            if (isSafe) {
                this.ctx.strokeStyle = '#00FF00'; // Green for safe
            } else {
                this.ctx.strokeStyle = '#FFFFFF';
            }
            this.ctx.lineWidth = 2;

            // Draw Lander Body (Simple LEM shape)
            this.ctx.beginPath();
            // Octagon-ish body
            this.ctx.moveTo(-10, -10);
            this.ctx.lineTo(10, -10);
            this.ctx.lineTo(15, 0);
            this.ctx.lineTo(10, 10);
            this.ctx.lineTo(-10, 10);
            this.ctx.lineTo(-15, 0);
            this.ctx.closePath();
            this.ctx.stroke();

            // Legs
            this.ctx.beginPath();
            this.ctx.moveTo(-10, 10);
            this.ctx.lineTo(-15, 20);
            this.ctx.moveTo(10, 10);
            this.ctx.lineTo(15, 20);
            this.ctx.stroke();

            // Feet
            this.ctx.beginPath();
            this.ctx.moveTo(-18, 20);
            this.ctx.lineTo(-12, 20);
            this.ctx.moveTo(12, 20);
            this.ctx.lineTo(18, 20);
            this.ctx.stroke();

            if (isThrusting && !isCrashed) {
                this.ctx.beginPath();
                this.ctx.moveTo(-5, 10);
                this.ctx.lineTo(0, 25 + Math.random() * 10);
                this.ctx.lineTo(5, 10);
                this.ctx.stroke();
            }
        }
        this.ctx.restore();
    }

    /**
     * 地形を描画します。
     * 
     * @param points - 地形を構成する点の配列
     * @param pads - 着陸パッドの情報（オプション）
     */
    drawTerrain(points: Vector2[], pads?: { startIndex: number, endIndex: number, multiplier: number }[]): void {
        if (!this.ctx || points.length === 0) return;

        this.ctx.lineWidth = 2;

        // Draw terrain segments
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];

            // Check if this segment is part of a pad
            const pad = pads?.find(p => i >= p.startIndex && i < p.endIndex);

            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);

            if (pad) {
                // Color based on multiplier
                if (pad.multiplier >= 5) this.ctx.strokeStyle = '#FF0000'; // Red (Hard)
                else if (pad.multiplier >= 3) this.ctx.strokeStyle = '#FFFF00'; // Yellow (Medium)
                else this.ctx.strokeStyle = '#0000FF'; // Blue (Easy)
            } else {
                this.ctx.strokeStyle = '#FFFFFF';
            }

            this.ctx.stroke();
        }

        // Draw Multiplier Text
        if (pads) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'center';
            const ctx = this.ctx;
            pads.forEach(pad => {
                // Find center of pad
                const p1 = points[pad.startIndex];
                const p2 = points[pad.endIndex]; // Approximate end
                // Better: average X of start and end
                const centerX = (p1.x + p2.x) / 2;
                const centerY = p1.y + 20;
                ctx.fillText(`x${pad.multiplier}`, centerX, centerY);
            });
            this.ctx.textAlign = 'left';
        }
    }

    /**
     * デブリ（破片）を描画します。
     * 
     * @param debris - デブリの配列
     */
    drawDebris(debris: { position: Vector2, rotation: number, size: number }[]): void {
        if (!this.ctx) return;

        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;

        debris.forEach(d => {
            if (!this.ctx) return; // TS check
            this.ctx.save();
            this.ctx.translate(d.position.x, d.position.y);
            this.ctx.rotate(d.rotation);

            this.ctx.beginPath();
            // Draw a small triangle
            const s = d.size;
            this.ctx.moveTo(0, -s);
            this.ctx.lineTo(s, s);
            this.ctx.lineTo(-s, s);
            this.ctx.closePath();
            this.ctx.stroke();

            this.ctx.restore();
        });
    }

    /**
     * UI（HUD）を描画します。
     * 
     * @param state - ゲーム状態
     * @param velocity - 現在の速度
     * @param altitude - 現在の高度
     */
    drawUI(state: GameState, velocity: Vector2, altitude: number): void {
        if (!this.ctx) return;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px monospace';

        this.ctx.fillText(`SCORE: ${Math.floor(state.score)}`, 20, 30);
        this.ctx.fillText(`HIGH:  ${Math.floor(state.highScore)}`, 20, 50);
        this.ctx.fillText(`FUEL:  ${Math.floor(state.fuel)}`, 20, 70);

        // Velocity display
        const vX = pixelsToMeters(velocity.x).toFixed(1);
        const vY = pixelsToMeters(velocity.y).toFixed(1);
        this.ctx.fillText(`H.SPEED: ${vX} m/s`, this.width - 220, 30);
        this.ctx.fillText(`V.SPEED: ${vY} m/s`, this.width - 220, 50);
        this.ctx.fillText(`ALTITUDE: ${Math.floor(pixelsToMeters(altitude))} m`, this.width - 220, 70);
    }

    /**
     * 画面中央にメッセージを描画します。
     * 
     * @param message - メインメッセージ
     * @param subMessage - サブメッセージ
     */
    drawMessage(message: string, subMessage: string): void {
        if (!this.ctx) return;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';

        this.ctx.font = '40px monospace';
        this.ctx.fillText(message, this.width / 2, this.height / 2);

        if (subMessage) {
            this.ctx.font = '20px monospace';
            this.ctx.fillText(subMessage, this.width / 2, this.height / 2 + 40);
        }

        this.ctx.textAlign = 'left'; // Reset
    }

    /**
     * スコア画面を描画します。
     * 
     * @param state - ゲーム状態
     * @param canContinue - 5秒経過して続行可能かどうか
     */
    /**
     * モーダルダイアログを描画します。
     * 
     * @param title - タイトル
     * @param content - コンテンツ行の配列
     * @param footer - フッターメッセージ（オプション）
     * @param highlightIndex - ハイライトする行のインデックス（オプション）
     */
    private offscreenCanvas: HTMLCanvasElement | null = null;

    /**
     * モーダルダイアログを描画します。
     * 
     * @param title - タイトル
     * @param content - コンテンツ行の配列
     * @param footer - フッターメッセージ（オプション）
     * @param highlightIndex - ハイライトする行のインデックス（オプション）
     */
    private drawModalDialog(title: string, content: string[], footer?: string, highlightIndex: number = -1): void {
        if (!this.ctx) return;

        const { DIALOG_WIDTH, DIALOG_HEIGHT, PADDING, LINE_HEIGHT } = SCORE_SCREEN_CONSTANTS;

        // ダイアログの位置を計算
        const x = (this.width - DIALOG_WIDTH) / 2;
        const y = (this.height - DIALOG_HEIGHT) / 2;
        const centerX = this.width / 2;

        // 背景をぼかして暗くする (Offscreen Canvas使用)
        if (!this.offscreenCanvas) {
            this.offscreenCanvas = document.createElement('canvas');
        }
        if (this.offscreenCanvas.width !== this.width || this.offscreenCanvas.height !== this.height) {
            this.offscreenCanvas.width = this.width;
            this.offscreenCanvas.height = this.height;
        }

        const offCtx = this.offscreenCanvas.getContext('2d');
        if (offCtx) {
            // 1. 現在の画面をオフスクリーンにコピー
            offCtx.clearRect(0, 0, this.width, this.height);
            offCtx.drawImage(this.canvas!, 0, 0);

            // 2. オフスクリーンからダイアログ領域だけをブラー付きでメインに描画
            this.ctx.save();
            this.ctx.filter = 'blur(4px)';
            this.ctx.drawImage(this.offscreenCanvas, x, y, DIALOG_WIDTH, DIALOG_HEIGHT, x, y, DIALOG_WIDTH, DIALOG_HEIGHT);
            this.ctx.restore();
        }

        // 3. 半透明の黒をオーバーレイ
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, DIALOG_WIDTH, DIALOG_HEIGHT);

        // ダイアログの枠線を描画
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, DIALOG_WIDTH, DIALOG_HEIGHT);

        // テキスト描画設定（共通）
        this.ctx.textAlign = 'center';

        // タイトル
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '30px monospace';
        this.ctx.fillText(title, centerX, y + PADDING + 30);

        // コンテンツ
        this.ctx.font = '16px monospace';

        let currentY = y + PADDING + 70;

        content.forEach((line, index) => {
            if (index === highlightIndex) {
                this.ctx!.fillStyle = '#00FF00';
                this.ctx!.fillText(`[ ${line} ]`, centerX, currentY);
            } else {
                this.ctx!.fillStyle = '#FFFFFF';
                this.ctx!.fillText(line, centerX, currentY);
            }
            currentY += LINE_HEIGHT;
        });

        // フッター
        if (footer) {
            this.ctx.fillStyle = '#888888';
            if (footer.includes('continue')) this.ctx.fillStyle = '#00FF00';
            this.ctx.fillText(footer, centerX, y + DIALOG_HEIGHT - PADDING - 10);
        }

        this.ctx.textAlign = 'left'; // Reset
    }

    /**
     * 難易度選択画面を描画します。
     * 
     * @param currentSelection - 現在選択されている難易度
     */
    drawDifficultyScreen(currentSelection: Difficulty): void {
        const content = [
            'EASY',
            'NORMAL',
            'HARD',
            'CUSTOM'
        ];

        const difficulties = ['EASY', 'NORMAL', 'HARD', 'CUSTOM'];
        const highlightIndex = difficulties.indexOf(currentSelection);

        // Get settings for current selection
        const settings = DIFFICULTY_SETTINGS[currentSelection];

        const footer = 'Use UP/DOWN to select, SPACE/ENTER to confirm';

        this.drawModalDialog('SELECT DIFFICULTY', content, footer, highlightIndex);

        // Draw details below the dialog content (inside the dialog, but lower half)
        if (this.ctx) {
            const { DIALOG_WIDTH, DIALOG_HEIGHT, PADDING } = SCORE_SCREEN_CONSTANTS;
            const x = (this.width - DIALOG_WIDTH) / 2;
            const y = (this.height - DIALOG_HEIGHT) / 2;
            const detailY = y + 200; // Position for details

            this.ctx.fillStyle = '#AAAAAA';
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'left';

            const leftX = x + PADDING + 20;
            const rightX = x + DIALOG_WIDTH / 2 + 10;
            const lineHeight = 20;

            this.ctx.fillText(`Gravity: ${settings.gravity.toFixed(2)} m/s²`, leftX, detailY);
            this.ctx.fillText(`Thrust:  ${settings.thrust} N`, leftX, detailY + lineHeight);
            this.ctx.fillText(`Fuel:    ${settings.initialFuel}`, rightX, detailY);
            this.ctx.fillText(`Score:   x${settings.scoreMultiplier.toFixed(1)}`, rightX, detailY + lineHeight);

            // Draw label
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(settings.label, this.width / 2, detailY + lineHeight * 2 + 10);
            this.ctx.textAlign = 'left';
        }
    }

    /**
     * カスタム難易度設定画面を描画します。
     * 
     * @param currentSettings - 現在のカスタム設定
     * @param selectedIndex - 現在選択されている項目のインデックス
     */
    drawCustomSettingsScreen(currentSettings: DifficultySetting, selectedIndex: number): void {
        const items = [
            { label: 'Gravity', value: `${currentSettings.gravity.toFixed(2)} m/s²` },
            { label: 'Thrust', value: `${currentSettings.thrust} N` },
            { label: 'Fuel', value: `${currentSettings.initialFuel}` },
            { label: 'Start Game', value: '' },
            { label: 'Cancel', value: '' }
        ];

        const content = items.map((item, index) => {
            if (index === 3 || index === 4) return item.label; // Start Game or Cancel
            if (index === selectedIndex) {
                return `${item.label}: ← ${item.value} →`;
            }
            return `${item.label}: ${item.value}`;
        });

        const footer = 'UP/DOWN: Select, LEFT/RIGHT: Adjust';

        this.drawModalDialog('CUSTOM SETTINGS', content, footer, selectedIndex);

        // Show Score Multiplier (calculated)
        if (this.ctx) {
            const { DIALOG_WIDTH, DIALOG_HEIGHT } = SCORE_SCREEN_CONSTANTS;
            const y = (this.height - DIALOG_HEIGHT) / 2;
            const detailY = y + 230;

            this.ctx.fillStyle = '#FFFF00';
            this.ctx.font = '16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Score Multiplier: x${currentSettings.scoreMultiplier.toFixed(2)}`, this.width / 2, detailY);
            this.ctx.textAlign = 'left';
        }
    }

    /**
     * スコア画面を描画します。
     * 
     * @param state - ゲーム状態
     * @param canContinue - 5秒経過して続行可能かどうか
     */
    drawScoreScreen(state: GameState, canContinue: boolean): void {
        const title = state.status === 'LANDED' ? 'MISSION SUCCESS' : 'MISSION FAILED';

        const distanceInMeters = pixelsToMeters(state.totalDistance);
        const maxSpeedInMeters = pixelsToMeters(state.maxSpeed);

        const content = [
            `Play Time: ${state.playTime.toFixed(1)}s`,
            `Fuel Used: ${state.fuelUsed.toFixed(0)}`,
            `Distance: ${distanceInMeters.toFixed(1)}m`,
            `Max Speed: ${maxSpeedInMeters.toFixed(1)}m/s`,
            `Score: ${state.score}`
        ];

        const footer = canContinue ? 'Press any key to continue' : 'Press ESC to skip';

        this.drawModalDialog(title, content, footer);
    }
}
