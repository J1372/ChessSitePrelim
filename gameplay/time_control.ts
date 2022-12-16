export class TimeControl {
    startingMins: number;

    // in seconds.
    increment: number;
    delay: number;

    constructor(startingMins: number, increment: number, delay: number) {
        this.startingMins = startingMins;
        this.increment = increment;
        this.delay = delay;
    }
}