import { Board } from "./board";
import { Color } from "./color";
import { GamePost } from "./game_post";
import { Move } from "./move";
import { Player } from "./player";
import { TimeControl } from "./time_control";

// This is a game currently being played.
export class Game {
    uuid: string; // length = 16
    white: Player;
    black: Player;
    board: Board;
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

        if (!description.hostPlayAs) {
            description.hostPlayAs = Math.random() <= 0.5 ? Color.White : Color.Black;
        }

        if (description.hostPlayAs === Color.White) {
            this.white = new Player(description.host, [this.timeControl.startingMins, this.timeControl.startingSecs]);
            this.black = new Player(otherUser, [this.timeControl.startingMins, this.timeControl.startingSecs]);
        } else {
            this.white = new Player(otherUser, [this.timeControl.startingMins, this.timeControl.startingSecs]);
            this.black = new Player(description.host, [this.timeControl.startingMins, this.timeControl.startingSecs]);
        }

        this.curTurn = Color.White;

        this.board = new Board(8, 8);
        this.moves = new Array<Move>();

    }

    genPgn(): string {
        return '';
    }
}