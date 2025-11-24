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
    DEBRIS_GRAVITY: 0.05
} as const;
