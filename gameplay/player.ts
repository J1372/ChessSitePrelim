export class Player {
    user: string;
    timeRemaining: number[];

    constructor(user: string, startTime: number[]) {
        this.user = user;
        this.timeRemaining = startTime.slice();
    }
}