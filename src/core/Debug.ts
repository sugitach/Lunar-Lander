export class Debug {
    static enabled = import.meta.env.DEV;

    static log(...args: any[]) {
        if (this.enabled) console.log(...args);
    }

    static error(...args: any[]) {
        if (this.enabled) console.error(...args);
    }
}
