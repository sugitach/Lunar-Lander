import { Vector2 } from '../core/Vector2';
import { Physics, ROTATION_SPEED, FUEL_CONSUMPTION_THRUST, FUEL_CONSUMPTION_ROTATE } from '../core/Physics';
import { Input } from '../core/Input';
import { GameState } from '../core/GameState';
import { LANDER_CONSTANTS } from '../core/Constants';

export class Lander {
    public position: Vector2;
    public velocity: Vector2;
    public rotation: number; // Radians. -PI/2 is UP.
    public previousPosition: Vector2; // For accurate collision detection
    public previousRotation: number;
    public width: number = 20;
    public height: number = 20;

    constructor(startX: number, startY: number) {
        this.position = new Vector2(startX, startY);
        this.previousPosition = new Vector2(startX, startY);
        this.velocity = new Vector2(0, 0);
        this.rotation = -Math.PI / 2; // Pointing UP
        this.previousRotation = -Math.PI / 2;
    }

    update(input: Input, gameState: GameState, deltaTime: number) {
        // Save previous state for collision detection
        this.previousPosition = this.position.clone();
        this.previousRotation = this.rotation;

        // Scale factors for frame-rate independence
        // Assuming original values were tuned for TARGET_FPS
        const timeScale = deltaTime * LANDER_CONSTANTS.TARGET_FPS;

        if (gameState.isFuelEmpty()) {
            // Just gravity if no fuel
            this.velocity = Physics.applyGravity(this.velocity, timeScale);
            this.position = this.position.add(this.velocity.multiply(timeScale));
            return;
        }

        // Rotation
        if (input.isRotatingLeft) {
            this.rotation -= ROTATION_SPEED * timeScale;
            gameState.consumeFuel(FUEL_CONSUMPTION_ROTATE * timeScale);
        }
        if (input.isRotatingRight) {
            this.rotation += ROTATION_SPEED * timeScale;
            gameState.consumeFuel(FUEL_CONSUMPTION_ROTATE * timeScale);
        }

        // Thrust
        if (input.isThrusting) {
            this.velocity = Physics.applyThrust(this.velocity, this.rotation, timeScale);
            gameState.consumeFuel(FUEL_CONSUMPTION_THRUST * timeScale);
        }

        // Gravity
        this.velocity = Physics.applyGravity(this.velocity, timeScale);

        // Apply velocity
        this.position = this.position.add(this.velocity.multiply(timeScale));
    }
}
