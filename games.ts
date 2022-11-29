
/*
    Represents a move on a chess board.
    Each number is in range of [0, 63] and represents a square on the board.
*/
export interface Move {
    from: number,
    to: number,
}

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

export class Player {
    user: string;
    timeRemaining: number[];

    constructor(user: string, startTime: number[]) {
        this.user = user;
        this.timeRemaining = startTime.slice();
    }
}


export enum Color {
    White,
    Black,
}

// This is a game currently being played.
export class Game {
    uuid: string; // length = 16
    white: Player;
    black: Player;
    moves: Move[]; // move history.

    // Date the game actually started (both users could make moves).
    started: Date;
    timeControl: TimeControl;

    curTurn: Color;

    drawOffer?: string; // user who offered a draw, if any. if other user offers draw, accepts draw.

    constructor(description: GamePost, otherUser: string) {
        this.uuid = description.uuid;
        this.timeControl = description.timeControl;
        this.started = new Date(); // could use Date.now instead


        switch (description.hostPlayAs){
            case undefined: {
                const hostPlaysWhite = Math.random() <= 0.5;
                if (hostPlaysWhite) {
                    this.white = new Player(description.host, [this.timeControl.startingMins, this.timeControl.startingSecs]);
                    this.black = new Player(otherUser, [this.timeControl.startingMins, this.timeControl.startingSecs]);
                } else {
                    this.white = new Player(otherUser, [this.timeControl.startingMins, this.timeControl.startingSecs]);
                    this.black = new Player(description.host, [this.timeControl.startingMins, this.timeControl.startingSecs]);
                }
            }
            case Color.White: {
                this.white = new Player(description.host, [this.timeControl.startingMins, this.timeControl.startingSecs]);
                this.black = new Player(otherUser, [this.timeControl.startingMins, this.timeControl.startingSecs]);
            }
            case Color.Black: {
                this.white = new Player(otherUser, [this.timeControl.startingMins, this.timeControl.startingSecs]);
                this.black = new Player(description.host, [this.timeControl.startingMins, this.timeControl.startingSecs]);
            }
        }

        this.curTurn = Color.White;
        this.moves = new Array<Move>();

    }

    genPgn(): string {
        return '';
    }
}



// A posting for a game that is looking for another player.
export class GamePost {
    uuid: string; // length = 16

    host: string; // user that wants to create the game.
    timeControl: TimeControl;

    // Date that the game was made available for joining.
    posted: Date;

    // Color that the host will play as.
    hostPlayAs?: Color;

    constructor(uuid: string, host: string, timeControl: TimeControl, hostPlayAs?: Color) {
        this.host = host;
        this.uuid = uuid;
        this.timeControl = timeControl;
        this.posted = new Date(); // could use Date.now instead
        this.hostPlayAs = hostPlayAs;
    }

}
