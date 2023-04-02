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
    uuid!: string; // length = 16
    white!: Player;
    black!: Player;
    board!: Board;
    moves!: Move[]; // move history.

    // Date the game actually started (both users could make moves).
    started!: Date;
    timeControl!: TimeControl;

    drawOffer?: string; // user who offered a draw, if any. if other user offers draw, accepts draw.
    
    static fromPost(description: GamePost, otherUser: string) {
        const game = new Game();

        game.uuid = description.uuid;
        game.timeControl = description.timeControl;
        game.started = new Date(); // could use Date.now instead

        if (!description.hostPlayAs) {
            description.hostPlayAs = Math.random() <= 0.5 ? Color.White : Color.Black;
        }

        const startingTime = game.timeControl.startingMins * 60;
        if (description.hostPlayAs === Color.White) {
            game.white = new Player(description.host, startingTime);
            game.black = new Player(otherUser, startingTime);
        } else {
            game.white = new Player(otherUser, startingTime);
            game.black = new Player(description.host, startingTime);
        }

        game.board = Board.standardBoard();
        game.moves = new Array<Move>();

        return game;
    }

    static deserialize(object: any) {
        const game = new Game();

        game.uuid = object.uuid;
        game.timeControl = object.timeControl;
        game.started = object.started;
        game.timeControl = object.timeControl;

        game.white = new Player(object.white.user, object.white.timeRemaining);
        game.black = new Player(object.black.user, object.black.timeRemaining);

        game.board = Board.deserialize(object.board);
        game.moves = object.moves;

        game.drawOffer = object.drawOffer;

        return game;
    }


    getGameStatus(): GameStatus {
        return GameStatus.Ongoing;
    }

    getCurPlayer(): Player {
        if (this.board.curTurn === Color.White) {
            return this.white;
        } else {
            return this.black;
        }
    }


    isPlayer(user: string): boolean {
        return this.white.user === user || this.black.user === user;
    }

    /*
    isTurn(user: string): boolean {
        if (this.board.curTurn === Color.White) {
            return this.white.user === user;
        } else {
            return this.black.user === user;
        }
    }*/

    isTurn(player: Player): boolean {
        if (this.board.curTurn === Color.White) {
            return this.white === player;
        } else {
            return this.black === player;
        }
    }

    owns(player: Player, square: Square): boolean {
        const piece = this.board.getPiece(square.row, square.col);

        if (!piece) {
            return false;
        }

        if (player === this.white) {
            return piece.color === Color.White;
        } else {
            return piece.color === Color.Black;
        }

    }

    getPlayer(name: string): Player {
        if (this.white.user === name) {
            return this.white;
        } else {
            return this.black;
        }
    }

    canMove(user: string, from: Square, to: Square): boolean {
        if (this.isPlayer(user)) {
            const player = this.getPlayer(user);
            return this.isTurn(player) && this.owns(player, from) && this.board.canMove(from, to);
        } else {
            return false;
        }

    }

    move(from: Square, to: Square): void {
        const toMove = this.board.getPiece(from.row, from.col) as Piece;
        this.board.move(from, to);
        toMove.notifyMove();
    }

    getColor(user: string): Color {
        if (user === this.white.user) {
            return Color.White;
        } else {
            return Color.Black;
        }
    }
    
    promote(toSquare: Square, piecePromotion: Piece) {
        const oldPiece = this.board.getPiece(toSquare.row, toSquare.col);

        this.board.setPiece(toSquare, piecePromotion);
        if (piecePromotion.color === Color.White) {
            // update white control arrs
        } else {
            // update black control arrs
        }
    }


    getPromotions(from: Square, to: Square): string[] {
        const toMove = this.board.getPiece(from.row, from.col) as Piece;
        return toMove.getPromotionsOnMove(to, this.board);
    }

    genPgn(): string {
        return '';
    }
}