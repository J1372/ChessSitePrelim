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

    drawOffer?: string; // user who offered a draw, if any. if other user offers draw, accepts draw.

    constructor(description: GamePost, otherUser: string) {
        this.uuid = description.uuid;
        this.timeControl = description.timeControl;
        this.started = new Date(); // could use Date.now instead

        if (!description.hostPlayAs) {
            description.hostPlayAs = Math.random() <= 0.5 ? Color.White : Color.Black;
        }

        const startingTime = this.timeControl.startingMins * 60;
        if (description.hostPlayAs === Color.White) {
            this.white = new Player(description.host, startingTime);
            this.black = new Player(otherUser, startingTime);
        } else {
            this.white = new Player(otherUser, startingTime);
            this.black = new Player(description.host, startingTime);
        }

        this.curTurn = Color.White;

        this.board = new Board(8, 8);
        this.moves = new Array<Move>();

    }


    getGameStatus(): GameStatus {
        return GameStatus.Ongoing;
    }


    isPlayer(user: string): boolean {
        return this.white.user === user || this.black.user === user;
    }

    isTurn(user: string): boolean {
        if (this.white.user === user && this.curTurn === Color.White) {
            return true;
        }

        if (this.black.user === user && this.curTurn === Color.Black) {
            return true;
        }

        return false;
    }

    // Only checks if the piece should be able to move somewhere on the board.
    // Does not check whether the piece is owned by the player whose turn it is.
    canMove(from: Square, to: Square): boolean {
        return this.board.canMove(from, to);
    }

    move(from: Square, to: Square): void {
        const toMove = this.board.getPiece(from.row, from.col) as Piece;
        this.board.move(from, to);
    }

    getColor(user: string): Color {
        if (user === this.white.user) {
            return Color.White;
        } else {
            return Color.Black;
        }
    }
    
    promote(toSquare: Square, piecePromotion: Piece) {
        this.board.setPiece(toSquare, piecePromotion);
    }


    getPromotions(from: Square, to: Square): string[] {
        const toMove = this.board.getPiece(from.row, from.col) as Piece;
        return toMove.getPromotionsOnMove(to, this.board);
    }

    genPgn(): string {
        return '';
    }
}