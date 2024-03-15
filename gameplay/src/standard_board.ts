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
import { Board } from "./board.js";
import { Move } from "./move.js";

interface CastleAvailability {
    kingside: boolean;
    queenside: boolean;
}

// All boards are 8x8 for now.
export class StandardBoard extends Board {
    kingsideCastleCol = 6;
    queensideCastleCol = 2;

    // Indexed by Color enum.
    // 0 = White, 1 = black.
    kings!: [Piece, Piece];

    // if castling is still available to the player.
    // set to false whenever rooks / king moved.
    castleAvailable: [CastleAvailability, CastleAvailability] = [{kingside: true, queenside: true}, {kingside: true, queenside: true}];
    inCheck: boolean = false;

    static deserialize(from: any): Board {
        const board = new StandardBoard(); // this constructs a default board that gets overwritten.

        for (let i = 0; i < board.rows; i++) {
            for (let j = 0; j < board.cols; j++) {
                const index = i * from.rows + j;

                const serializedPiece = from.board[index];
                if (serializedPiece) {
                    const piece = pieceFactory(serializedPiece.pieceName, serializedPiece.color);
                    
                    board.board[index] = piece;
                    if (piece?.pieceName === 'k') {
                        board.kings[piece.color] = piece;
                    }
                    
                } else {
                    board.board[index] = null;
                }
            }
        }

        board.castleAvailable = from.castleAvailable;
        board.curTurn = from.curTurn;
        board.inCheck = from.inCheck;

        return board;
    }

    constructor() {
        super(8, 8)
        this.standardBoardSetup();
    }

    public override getForcedPromotions(move: Move): Array<string> {
        const piece = this.getPiece(move.from.row, move.from.col);
        if (!piece || piece.pieceName !== 'p') {
            return [];
        }

        const toSquare = move.to;

        // knight, bishop, rook, queen.
        const available = ['n', 'b', 'r', 'q'];

        if (piece.color === Color.White) {
            if (toSquare.row === this.topRow()) {
                return available;
            } else {
                return [];
            }
        } else {
            if (toSquare.row === 0) {
                return available;
            } else {
                return [];
            }
        }
    }

    /**
     * Sets the board up with the standard chess setup.
     */
    private standardBoardSetup() {
        this.kings = [new King(Color.White), new King(Color.Black)];

        const pawnRow = (row: number, color: Color) => {
            for (let i = 0; i < this.cols; ++i) {
                const square = {row: row, col: i};

                this.setPiece(square, new Pawn(color));
            }
        }

        const mainRow = (row: number, color: Color) => {
            const pieces = [
                new Rook(color),
                new Knight(color),
                new Bishop(color),
                new Queen(color),
                this.kings[color],
                new Bishop(color),
                new Knight(color),
                new Rook(color),
            ];

            for (let i = 0; i < this.cols; ++i) {
                const square = {row: row, col: i};

                this.setPiece(square, pieces[i]);
            }
        }

        this.board.fill(null);

        mainRow(0, Color.White);
        pawnRow(1, Color.White);

        mainRow(7, Color.Black);
        pawnRow(6, Color.Black);
    }

    public override hasWon(color: Color) {
        const enemy = Color.opposite(color);

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const piece = this.getPiece(i, j);

                if (piece && piece.color === enemy) {
                    // could have a piece.canMove that would be optimized (doesn't generate every move, stops on first valid move).
                    const moves = piece.getMoves({ row: i, col: j }, this);
                    if (moves.length > 0) {
                        return false;
                    }
                }
            }
        }

        return true;
    }
    
    public override move(move: Move) {
        // Move the piece.
        const [from, to] = [move.from, move.to];
        const toMove = this.getPieceSquare(from);


        this.setPiece(from, null);
        this.setPiece(to, toMove);

        toMove?.notifyMove()

        if (move.promotedTo) {
            this.setPiece(to, pieceFactory(move.promotedTo, this.curTurn));
        }

        const castleRow = this.curTurn === Color.White ? 0 : 7;
        const castleFlags = this.castleAvailable[this.curTurn];
        
        if (toMove === this.kings[this.curTurn]) {
            if (castleFlags.kingside) {
                const kCastleSquare = { row: castleRow, col: this.kingsideCastleCol };
                if (to.row === kCastleSquare.row && to.col === kCastleSquare.col) {
                    const rookSquare = { row: kCastleSquare.row, col: 7};
                    const rook = this.getPiece(rookSquare.row, rookSquare.col);

                    this.setPiece(rookSquare, null);
                    this.setPiece({ row: kCastleSquare.row, col: 5}, rook);
                }
            }

            if (castleFlags.queenside) {
                const qCastleSquare = { row: castleRow, col: this.queensideCastleCol};
                if (to.row === qCastleSquare.row && to.col === qCastleSquare.col) {
                    const rookSquare = { row: qCastleSquare.row, col: 0};
                    const rook = this.getPiece(rookSquare.row, rookSquare.col);

                    this.setPiece(rookSquare, null);
                    this.setPiece({ row: qCastleSquare.row, col: 3}, rook);
                }
            }

            castleFlags.kingside = false;
            castleFlags.queenside = false;
        }

        if (from.row === castleRow && from.col === 0) {
            castleFlags.queenside = false;
        } else if (from.row === castleRow && from.col === 7) {
            castleFlags.kingside = false;
        }

        if (to.row === 0 && to.col === 0) {
            this.castleAvailable[Color.White].queenside = false;
        } else if (to.row === 0 && to.col === 7) {
            this.castleAvailable[Color.White].kingside = false;
        } else if (to.row === 7 && to.col === 0) {
            this.castleAvailable[Color.Black].queenside = false;
        } else if (to.row === 7 && to.col === 7) {
            this.castleAvailable[Color.Black].kingside = false;
        }


        this.curTurn = Color.opposite(this.curTurn);
    }

    public override canMove(move: Move) {
        const [from, to] = [move.from, move.to];

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

        if (move.promotedTo) {
            return toMove.pieceName == 'p' && ['q', 'b', 'n', 'r'].includes(move.promotedTo);
        }

        // can optimize, check if 'to' is in piece moves before checking if it putsInCheck.
        // we don't need to do a inCheckMove for all its moves, just for 'to' if it is in piece moves
        const moves = toMove.getMoves(from, this);
        return moves.some(move => move.row == to.row && move.col == to.col);
    }

    public override getCastleMoves(color: Color): Square[] {
        const castleFlags = this.castleAvailable[color];
        const castleRow = color === Color.White ? 0 : 7;

        const moves = [];
        if (castleFlags.kingside) {
            if (!this.isOccupied(castleRow, 5) && !this.isOccupied(castleRow, this.kingsideCastleCol)) {
                moves.push({row: castleRow, col: this.kingsideCastleCol});
            }
        }

        if (castleFlags.queenside) {
            if (!this.isOccupied(castleRow, 1) && !this.isOccupied(castleRow, this.queensideCastleCol) && !this.isOccupied(castleRow, 3)) {
                moves.push({row: castleRow, col: this.queensideCastleCol});
            }
        }

        return moves;
    }

    // rename inCheckAfterMove
    public override putsInCheck(from: Square, to: Square, color: Color) {
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

    public override getControlSquares(color: Color): Array<Square> {
        const controlled: Square[] = [];

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const piece = this.getPiece(i, j);

                if (piece?.color === color) {
                    const controls = piece.getControlArea({row: i, col: j}, this);
                    controls.forEach(square => controlled.push(square));
                }
            }
        }

        return controlled;
    }
}
