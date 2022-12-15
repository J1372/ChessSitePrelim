import { Color } from "./color";
import { Piece } from "./pieces/piece";
import { Square } from "./square";

export class Board {
    board: Array<Piece | null>;

    rows: number;
    cols: number;

    // Currently only supports the standard chess board piece setup.
    constructor(rows: number, cols: number /*config?: Array<[Square, Piece]>*/) {
        this.rows = rows;
        this.cols = cols;
        this.board = new Array<Piece>(rows * cols);

        // if config -> do config setup else do standard setup

        this.standardBoardSetup()
    }

    /**
     * Sets the board up with the standard chess setup.
     */
    standardBoardSetup() {
        function pawnRow(row: number, color: Color, board: Board) {
            for (let i = 0; i < board.cols; ++i) {
                board.board[i] = null;
            }
        }

        pawnRow(1, Color.White, this);
        pawnRow(6, Color.White, this);

        // knights, bishops, rooks, queen, and king.
    }

    /**
     * Gets the piece at a square on the board.
     * @param row 
     * @param col 
     * @returns The piece at the given position or null.
     */
    getPiece(row: number, col: number) {
        const index = row * this.cols + col; // 0 index
        return this.board[index];
    }

    inBounds(row: number, col: number) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    inBoundsSquare(square: Square) {
        return square.row >= 0 && square.row < this.rows && square.col >= 0 && square.col < this.cols;
    }

    topRow() {
        return this.rows - 1;
    }

    isOccupied(row: number, col: number) {
        return this.getPiece(row, col) !== null;
    }

    occupiedBy(row: number, col: number, color: Color) {
        const piece = this.getPiece(row, col);
        return piece?.color === color;
    }


    controlledBy(row: number, col: number, color: Color) {
        
    }


    // Init white and black controlled squares list.
    initControlZones() {
        
    }


    move(row: number, col: number, toRow: number, toCol: number) {
        // Move and update control zones.

        // From row, col, do a raycast in every direction.
        // If hit a piece that has a raycast that would hit this square, update its control.
    }

    canMove(row: number, col: number, toRow: number, toCol: number) {

        // get moves, if not in moves return false.

        // check control afterwards, if enemy control hit king, return false.

    }

}
