import { Board } from "./board.js";
import { Color } from "./color.js";
import { GamePost } from "./game_post.js";
import { Move } from "./move.js";
import { Player } from "./player.js";
import { TimeControl } from "./time_control.js";
import { King } from "./pieces/king.js";
import { Piece, Ray } from "./pieces/piece.js";
import { Square } from "./square.js";

export enum GameStatus {
    White,
    Black,
    Draw,
    Ongoing
}

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

    // Indexed by Color enum.
    // 0 = White, 1 = black.
    //kings: [Square, Square];
    //castled: [boolean, boolean];

    drawOffer?: string; // user who offered a draw, if any. if other user offers draw, accepts draw.

    constructor(description: GamePost, otherUser: string) {
        this.uuid = description.uuid;
        this.timeControl = description.timeControl;
        this.started = new Date(); // could use Date.now instead

        if (!description.hostPlayAs) {
            description.hostPlayAs = Math.random() <= 0.5 ? Color.White : Color.Black;
        }

        if (description.hostPlayAs === Color.White) {
            this.white = new Player(description.host, this.timeControl.startingMins * 60);
            this.black = new Player(otherUser, this.timeControl.startingMins * 60);
        } else {
            this.white = new Player(otherUser, this.timeControl.startingMins * 60);
            this.black = new Player(description.host, this.timeControl.startingMins * 60);
        }

        this.curTurn = Color.White;

        this.board = new Board(8, 8);
        this.moves = new Array<Move>();

    }


    getGameStatus(): GameStatus {



        return GameStatus.Ongoing;
    }



    genPgn(): string {
        return '';
    }
}