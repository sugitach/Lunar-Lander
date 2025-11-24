export const GameStatus = {
    WAITING: 0,
    PLAYING: 1,
    LANDED: 2,
    CRASHED: 3,
    GAME_OVER: 4
} as const;

export type GameStatus = typeof GameStatus[keyof typeof GameStatus];

export class GameState {
    public score: number = 0;
    public fuel: number = 1000;
    public status: GameStatus = GameStatus.WAITING;

    reset() {
        this.fuel = 1000;
        this.status = GameStatus.WAITING;
    }

    consumeFuel(amount: number) {
        this.fuel = Math.max(0, this.fuel - amount);
    }

    isFuelEmpty(): boolean {
        return this.fuel <= 0;
    }
}
