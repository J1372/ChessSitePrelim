import { Color } from "./color.js";
import { Move } from "./move.js";
import { Piece } from "./pieces/piece.js";
import { Square } from "./square.js";

export enum CastleDir {
    Kingside,
    Queenside,
}

// Actual game rules.
export abstract class Board {
    board: Array<Piece | null>;
    rows: number;
    cols: number;
    curTurn: Color = Color.White;

    constructor(rows: number, cols: number) {
        const numSquares = rows * cols;
        this.board = new Array<Piece>(numSquares);
        this.rows = rows;
        this.cols = cols;
    }

    // public abstract convertFromNotation(text: string): Move;
    // public abstract convertToNotation(move: Move): string;
    public abstract hasWon(color: Color): boolean;
    public abstract move(move: Move): void;
    public abstract canMove(move: Move): boolean;
    public abstract getForcedPromotions(move: Move): Array<string>;
    public abstract putsInCheck(from: Square, to: Square, color: Color): boolean; // rename inCheckAfterMove
    public abstract getControlSquares(color: Color): Array<Square>;
    public abstract getCastleMoves(color: Color): Array<Square>;

    public isOccupied(row: number, col: number) {
        return this.getPiece(row, col) !== null;
    }

    public occupiedBy(row: number, col: number, color: Color) {
        const piece = this.getPiece(row, col);
        return piece?.color === color;
    }

    public getPiece(row: number, col: number) {
        const index = row * this.cols + col;
        return this.board[index];
    }

    public getPieceSquare(square: Square) {
        const index = square.row * this.cols + square.col;
        return this.board[index];
    }

    protected squareToIndex(square: Square) {
        return square.row * this.cols + square.col;
    }
    
    protected setPiece(square: Square, piece: Piece | null) {
        const index = this.squareToIndex(square);
        this.board[index] = piece;
    }

    public inBounds(row: number, col: number) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    public inBoundsSquare(square: Square) {
        return square.row >= 0 && square.row < this.rows && square.col >= 0 && square.col < this.cols;
    }

    public topRow() {
        return this.rows - 1;
    }

    public botRow() {
        return 0;
    }

}
