export class Input {
    public isRotatingLeft: boolean = false;
    public isRotatingRight: boolean = false;
    public isThrusting: boolean = false;
    public isRestarting: boolean = false;

    constructor() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    private handleKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.isRotatingLeft = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.isRotatingRight = true;
                break;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'KeyS':
                this.isThrusting = true;
                break;
            case 'Space':
                this.isRestarting = true;
                break;
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        switch (event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.isRotatingLeft = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.isRotatingRight = false;
                break;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'KeyS':
                this.isThrusting = false;
                break;
            case 'Space':
                this.isRestarting = false;
                break;
        }
    }
}
