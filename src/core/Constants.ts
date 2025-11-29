// Lander-related constants
export const LANDER_CONSTANTS = {
    FOOT_LEFT_X: -15,
    FOOT_LEFT_Y: 20,
    FOOT_RIGHT_X: 15,
    FOOT_RIGHT_Y: 20,
    BODY_HEIGHT: 20,
    TARGET_FPS: 60,
    WIDTH: 20,
    HEIGHT: 20
} as const;

// Terrain generation constants
export const TERRAIN_CONSTANTS = {
    MIN_STEP: 15,
    MAX_STEP: 40,
    EXCLUSION_ZONE: 150,
    MIN_PAD_DISTANCE: 100,
    MIN_PAD_WIDTH: 40,
    MAX_PAD_WIDTH_RANGE: 60, // Added to MIN_PAD_WIDTH for max
    MAX_PLACEMENT_RETRIES: 100
} as const;

// Physics constants
export const PHYSICS_CONSTANTS = {
    GRAVITY_Y: 0.05  // Unified gravity constant
} as const;

// Distance unit conversion constants
export const DISTANCE_CONSTANTS = {
    PIXELS_PER_METER: 10  // 1 meter = 10 pixels in game space
} as const;

/**
 * ピクセルをメートルに変換します。
 * 
 * @param pixels - ピクセル値
 * @returns メートル値
 */
export function pixelsToMeters(pixels: number): number {
    return pixels / DISTANCE_CONSTANTS.PIXELS_PER_METER;
}

/**
 * メートルをピクセルに変換します。
 * 
 * @param meters - メートル値
 * @returns ピクセル値
 */
export function metersToPixels(meters: number): number {
    return meters * DISTANCE_CONSTANTS.PIXELS_PER_METER;
}

/**
 * スコア画面関連の定数。
 */
export const SCORE_SCREEN_CONSTANTS = {
    /** 待機時間（ミリ秒） */
    WAIT_TIME: 5000,
    /** ダイアログ幅 */
    DIALOG_WIDTH: 400,
    /** ダイアログ高さ */
    DIALOG_HEIGHT: 300,
    /** パディング */
    PADDING: 20,
    /** 行間 */
    LINE_HEIGHT: 25
} as const;
