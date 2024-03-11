import { Board } from "./board.js";
import { Color } from "./color.js";
import { GamePost } from "./game_post.js";
import { Move } from "./move.js";
import { Piece, Ray } from "./pieces/piece.js";
import { Square } from "./square.js";

// This is a game currently being played.
export class Game {
    uuid!: string; // length = 16
    white!: string;
    black!: string;
    board!: Board;
    moves!: Move[]; // move history.

    // Date the game actually started (both users could make moves).
    started!: Date;

    drawOffer?: string; // user who offered a draw, if any. if other user offers draw, accepts draw.
    
    static fromPost(description: GamePost, otherUser: string) {
        const game = new Game();

        game.uuid = description.uuid;
        game.started = new Date(); // could use Date.now instead

        if (description.hostPlayAs === undefined) {
            description.hostPlayAs = Math.random() <= 0.5 ? Color.White : Color.Black;
        }

        if (description.hostPlayAs === Color.White) {
            game.white = description.host;
            game.black = otherUser;
        } else {
            game.white = otherUser;
            game.black = description.host;
        }

        game.board = Board.standardBoard();
        game.moves = new Array<Move>();

        return game;
    }

    static deserialize(object: any) {
        const game = new Game();

        game.uuid = object.uuid;
        game.started = object.started;

        game.white = object.white;
        game.black = object.black;

        game.board = Board.deserialize(object.board);
        game.moves = object.moves;

        game.drawOffer = object.drawOffer;

        return game;
    }

    playerColor(player: string) {
        if (player === this.white) {
            return Color.White;
        } else {
            return Color.Black;
        }

    }
    
    getCurPlayer(): string {
        if (this.board.curTurn === Color.White) {
            return this.white;
        } else {
            return this.black;
        }
    }

    isPlayer(user: string): boolean {
        return this.white === user || this.black === user;
    }

    isTurn(player: string): boolean {
        return this.playerColor(player) === this.board.curTurn;
    }

    hasWon(color: Color) {
        return this.board.hasWon(color);
    }

    userWon(user: string) {
        return this.hasWon(this.playerColor(user));
    }

    owns(player: string, square: Square): boolean {
        const piece = this.board.getPiece(square.row, square.col);

        if (!piece) {
            return false;
        }

        return this.playerColor(player) === piece.color;
    }

    canMove(user: string, from: Square, to: Square): boolean {
        if (this.isPlayer(user)) {
            return this.isTurn(user) && this.owns(user, from) && this.board.canMove(from, to);
        } else {
            return false;
        }

    }

    move(from: Square, to: Square): void {
        const toMove = this.board.getPiece(from.row, from.col) as Piece;
        this.board.move(from, to);
        this.moves.push()
        toMove.notifyMove();
    }

    getColor(user: string): Color {
        return this.playerColor(user);
    }
    
    promote(toSquare: Square, piecePromotion: Piece) {
        //const oldPiece = this.board.getPiece(toSquare.row, toSquare.col);

        this.board.setPiece(toSquare, piecePromotion);
        if (piecePromotion.color === Color.White) {
            // update white control arrs
        } else {
            // update black control arrs
        }
    }


    getPromotions(from: Square, to: Square): string[] {
        const toMove = this.board.getPiece(from.row, from.col);
        if (!toMove) {
            return [];
        }
        return toMove.getPromotionsOnMove(to, this.board);
    }

    genPgn(): string {
        return '';
    }
}
