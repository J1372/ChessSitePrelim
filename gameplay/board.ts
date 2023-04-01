import { Color } from "./color.js";
import { King } from "./pieces/king.js";
import { Piece } from "./pieces/piece.js";
import { Square } from "./square.js";
import { Pawn } from "./pieces/pawn.js";
import { pieceFactory } from "./pieces/piece_factory.js";
import { Rook } from "./pieces/rook.js";
import { Knight } from "./pieces/knight.js";
import { Bishop } from "./pieces/bishop.js";
import { Queen } from "./pieces/queen.js";

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
    kings!: [Piece, Piece];
    castled: [boolean, boolean] = [false, false];

    curTurn: Color = Color.White;
    inCheck: boolean = false;


    static fileMap = new Map<string, number>([
        ['a', 0],
        ['b', 1],
        ['c', 2],
        ['d', 3],
        ['e', 4],
        ['f', 5],
        ['g', 6],
        ['h', 7],
    ]);

    // Converts from file-rank notation to a Square, if in bounds.
    static convertFromNotation(notation: string): Square | null {
        if (notation.length != 2) {
            return null;
        }

        const fileNum = Board.fileMap.get(notation[0]);

        if (fileNum === undefined) {
            return null;
        }

        const rankNum = Number(notation[1]) - 1;

        if (isNaN(rankNum)) {
            return null;
        }

        return { row: rankNum, col: fileNum };
    }

    static convertToNotation(square: Square): string {
        const startFileCode = 'a'.charCodeAt(0);
        const fileCode = startFileCode + square.col;
        const file = String.fromCharCode(fileCode);
        const rank = (square.row + 1).toString();
        return file + rank;
    }

    static deserialize(from: any): Board {
        const board = new Board(from.rows, from.cols);

        // placeholder.
        board.kings = [new King(Color.White), new King(Color.Black)];

        for (let i = 0; i < from.rows; i++) {
            for (let j = 0; j < from.cols; j++) {
                const index = i * from.rows + j;

                const serializedPiece = from.board[index];
                if (serializedPiece) {
                    const piece = pieceFactory(serializedPiece.pieceName, serializedPiece.color);
                    
                    board.board[index] = piece;
                    if (piece?.pieceName === 'k') {
                        board.kings[piece.color] = piece;
                    }
                    
                } else {
                    board.board[index] = null; // unsure if this is necessary in js.
                }
            }
        }

        board.castled = from.castled;
        board.curTurn = from.curTurn;
        board.inCheck = from.inCheck;

        return board;
    }
    
    // Currently only supports the standard chess board piece setup.
    static standardBoard() {
        const board = new Board(8, 8);

        board.standardBoardSetup();

        return board;
    }

    constructor(rows: number, cols: number) {
        const numSquares = rows * cols;
        this.board = new Array<Piece>(numSquares);
        this.rows = rows;
        this.cols = cols;
    }

    /**
     * Sets the board up with the standard chess setup.
     */
    private standardBoardSetup() {
        this.kings = [new King(Color.White), new King(Color.Black)];

        function pawnRow(row: number, color: Color, board: Board) {
            for (let i = 0; i < board.cols; ++i) {
                const square = {row: row, col: i};

                board.setPiece(square, new Pawn(color));
            }
        }

        function mainRow(row: number, color: Color, board: Board) {
            const pieces = [
                new Rook(color),
                new Knight(color),
                new Bishop(color),
                new Queen(color),
                board.kings[color],
                new Bishop(color),
                new Knight(color),
                new Rook(color),
            ];

            for (let i = 0; i < board.cols; ++i) {
                const square = {row: row, col: i};

                board.setPiece(square, pieces[i]);
            }
        }

        this.board.fill(null);

        mainRow(0, Color.White, this);
        pawnRow(1, Color.White, this);

        mainRow(7, Color.Black, this);
        pawnRow(6, Color.Black, this);

        

        /*
        this.castled = [false, false];
        this.curTurn = Color.White;
        this.inCheck = false;*/
    }

    private squareToIndex(square: Square) {
        return square.row * this.cols + square.col;
    }

    getPiece(row: number, col: number) {
        const index = row * this.cols + col;
        return this.board[index];
    }
    
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
        return piece && piece.color === color;
    }

    move(from: Square, to: Square) {
        // Move the piece.
        const toMove = this.getPiece(from.row, from.col);
        this.setPiece(from, null);
        this.setPiece(to, toMove);

        this.curTurn = Color.opposite(this.curTurn);

        // is other guy in check? checkmate? update status

        // Update control zones.
        // From row, col, do a raycast in every direction.
        // If hit a piece that has a raycast that would hit this square, update its control.
        // same for square moved to. might now be blocking ray pieces.

        // alternatively. loop thru a list of raycasters, normalize dist vector, check if could possibly hit (if not already blocked) would hit, update.

        // if toMove === king and to === a castle square, castle and update castling. 
    }

    canMove(from: Square, to: Square) {
        if (!this.inBoundsSquare(from) || !this.inBoundsSquare(to)) {
            return false;
        }

        const toMove = this.getPiece(from.row, from.col);

        console.log('canMove 1')

        if (!toMove) {
            return false;
        }
        console.log('canMove 2')

        const toCapture = this.getPiece(to.row, to.col);

        if (toMove.color === toCapture?.color) {
            return false;
        }
        console.log('canMove 3')

        // can optimize, check if 'to' is in piece moves before checking if it putsInCheck.
        // we don't need to do a inCheckMove for all its moves, just for 'to' if it is in piece moves
        const moves = toMove.getMoves(from, this);

        /*
        if (toMove === this.kings[this.curTurn]) {
            // Cgeck if can castle. This can be done in toMove.getMoves if we add qCastleColumn and kCastleColumn
        }*/

        console.log(from);
        console.log(to);

        // filter out moves that leave you in check. move to pi

        console.log(moves);

        return moves.some(move => move.row == to.row && move.col == to.col);
    }

    // rename inCheckAfterMove
    putsInCheck(from: Square, to: Square, color: Color) {
        // move
        const fromCopy = this.getPiece(from.row, from.col);
        const toCopy = this.getPiece(to.row, to.col);

        this.setPiece(from, null);
        this.setPiece(to, fromCopy);

        // get enemy control.

        const enemy = Color.opposite(color);
        const enemyControl = this.getControlSquares(enemy);

        const wouldBeInCheck = enemyControl.some(square => this.getPiece(square.row, square.col) === this.kings[color]);

        // reset move

        this.setPiece(to, toCopy);
        this.setPiece(from, fromCopy);

        return wouldBeInCheck;
    }

    getControlSquares(color: Color): Array<Square> {
        const controlled: Square[] = [];

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const piece = this.getPiece(i, j);

                if (piece?.color === color) {
                    const controls = piece.getControlArea({row: i, col: j}, this);
                    controls.map(square => controlled.push(square));
                }
            }
        }

        return controlled;
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
