import { Color } from "./color.js";
import { King } from "./pieces/king.js";
import { Piece } from "./pieces/piece.js";
import { Square } from "./square.js";
import { Pawn } from "./pieces/pawn.js";

export enum CastleDir {
    Kingside,
    Queenside,
}

// All boards are 8x8 for now.
export class Board {
    board: Array<Piece | null>;

    rows: number;
    cols: number;


    //whiteControl: Array<number>;
    //blackControl: Array<number>;

    // Indexed by Color enum.
    // 0 = White, 1 = black.
    kings: [Piece, Piece];
    castled: [boolean, boolean];

    curTurn: Color;
    inCheck: boolean;


    static fileMap = new Map<string, number>([
        ['a', 0],
        ['b', 1],
        ['c', 2],
        ['d', 3],
        ['e', 4],
        ['f', 5],
        ['a', 6],
        ['h', 7],
    ]);

    // Converts from file-rank notation to a Square, if in bounds.
    static convertNotation(notation: string): Square | null {
        if (notation.length != 2) {
            return null;
        }

        const fileNum = Board.fileMap.get(notation[0]);

        if (!fileNum) {
            return null;
        }

        const rankNum = Number(notation[1]);

        if (isNaN(rankNum)) {
            return null;
        }

        return { row: rankNum, col: fileNum };
    }

    // Currently only supports the standard chess board piece setup.
    constructor(rows: number, cols: number /*config?: Array<[Square, Piece]>*/) {
        this.rows = rows;
        this.cols = cols;

        const numSquares = rows * cols;
        this.board = new Array<Piece>(numSquares);
        //this.whiteControl = new Array<number>(numSquares);
        //this.blackControl = new Array<number>(numSquares);

        this.kings = [new King(Color.White), new King(Color.Black)];
        this.castled = [false, false];

        this.curTurn = Color.White;
        this.inCheck = false;


        // if config -> do config setup else do standard setup

        this.standardBoardSetup()

    }

    /**
     * Sets the board up with the standard chess setup.
     */
    private standardBoardSetup() {
        function pawnRow(row: number, color: Color, board: Board) {
            for (let i = 0; i < board.cols; ++i) {
                const square = {row: row, col: i};

                board.setPiece(square, new Pawn(color));
            }
        }

        pawnRow(1, Color.White, this);
        pawnRow(6, Color.Black, this);

        //this.kings = [{row: 0, col: 4}, {row: 7, col: 4}];

        // knights, bishops, rooks, queen, and king.
    }

    private squareToIndex(square: Square) {
        return square.row * this.cols + square.col;
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
    
    /**
     * Sets the piece at a square on the board.
     * @param square 
     * @param piece 
     */
    setPiece(square: Square, piece: Piece | null) {
        const index = this.squareToIndex(square);

        this.board[index] = piece;
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


    /*controlledBy(row: number, col: number, color: Color) {
        
    }*/


    // Init white and black controlled squares list.
    /*initControlZones() {
        
    }*/


    move(from: Square, to: Square) {
        // Move the piece.


        const toMove = this.getPiece(from.row, from.col);
        this.setPiece(from, null);
        this.setPiece(to, toMove);

        // Update control zones.
        // From row, col, do a raycast in every direction.
        // If hit a piece that has a raycast that would hit this square, update its control.
        // same for square moved to. might now be blocking ray pieces.

        // if toMove === king and to === a castle square, castle and update castling. 
    }

    canMove(from: Square, to: Square) {
        if (!this.inBoundsSquare(from) || !this.inBoundsSquare(to)) {
            return false;
        }

        const toMove = this.getPiece(from.row, from.col);

        if (!toMove) {
            return false;
        }

        const toCapture = this.getPiece(to.row, to.col);

        if (toMove.color === toCapture?.color) {
            return false;
        }

        const pieceMoves = toMove.getMoves(from, this);

        if (toMove === this.kings[this.curTurn]) {
            // Cgeck if can castle. This can be done in toMove.getMoves if we add qCastleColumn and kCastleColumn
        }

        return pieceMoves.includes(to);

        // check control afterwards, if enemy control hit king, return false.

    }

    /*
    canCastle(color: Color, castleDir: CastleDir): boolean {
        if (this.castled[color]) {
            return false; // already castled earlier.
        }

        // return true if no pieces between king and the castle square.
        // and king would not be in check if moved there 
        //    / no enemy control between king and castle square (check chess rules)

        // castling disabled on side if rook has moved AT ALL as well.
        return false; 
    }

    getCastleSquare(color: Color, castleDir: CastleDir): Square {
        
    }
    */

}
