export class TimeControl {
    startingMins: number;
    startingSecs: number;

    // in seconds.
    increment: number;
    delay: number;

    constructor(startingMins: number, startingSecs: number, increment: number, delay: number) {
        this.startingMins = startingMins;
        this.startingSecs = startingSecs;
        this.increment = increment;
        this.delay = delay;
    }
}