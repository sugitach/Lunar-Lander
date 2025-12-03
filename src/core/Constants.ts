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

// Physics constants
export const PHYSICS_CONSTANTS = {
    GRAVITY_Y: 0.05,  // Keep for backward compatibility if needed, but mainly replaced by difficulty settings
    TIME_SCALE: 7.45  // Speed up simulation to match visual feel with realistic gravity
} as const;

// Distance unit conversion constants
export const DISTANCE_CONSTANTS = {
    PIXELS_PER_METER: 2  // 1 meter = 2 pixels (Lander height 20px = 10m)
} as const;

// Terrain generation constants
export const TERRAIN_CONSTANTS = {
    EXCLUSION_ZONE: 200,      // pixels around center to avoid pads
    MIN_PAD_WIDTH: 40,        // minimum width of landing pad
    MAX_PAD_WIDTH_RANGE: 60,  // additional random width range
    MIN_PAD_DISTANCE: 100     // minimum distance between pads
} as const;

export const DIFFICULTY_SETTINGS = {
    EASY: {
        gravity: 1.62, // Moon gravity (m/s^2)
        thrust: 4860,  // Force (N)
        mass: 1000,    // Mass (kg)
        initialFuel: 1000,
        scoreMultiplier: 0.5,
        label: "EASY: More Fuel, Low Score"
    },
    NORMAL: {
        gravity: 1.62, // Moon gravity (m/s^2)
        thrust: 4860,  // Force (N)
        mass: 1000,    // Mass (kg)
        initialFuel: 500,
        scoreMultiplier: 1.0,
        label: "NORMAL: Standard Challenge"
    },
    HARD: {
        gravity: 2.5,  // Higher gravity (m/s^2)
        thrust: 4860,  // Force (N)
        mass: 1000,    // Mass (kg)
        initialFuel: 300,
        scoreMultiplier: 2.0,
        label: "HARD: High Gravity, Less Fuel"
    },
    CUSTOM: {
        gravity: 1.62,
        thrust: 4860,
        mass: 1000,
        initialFuel: 500,
        scoreMultiplier: 1.0,
        label: "CUSTOM: User Defined Settings"
    }
} as const;

export const CUSTOM_SETTINGS_RANGES = {
    gravity: { min: 1.0, max: 10.0, step: 0.1 },
    thrust: { min: 1000, max: 10000, step: 100 },
    initialFuel: { min: 100, max: 2000, step: 50 }
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
