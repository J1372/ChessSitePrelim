import { Board } from "../board.js";
import { Color } from "../color.js";
import { Square } from "../square.js";
import { Piece } from "./piece.js";

export class Pawn implements Piece {
    readonly color: Color;
    readonly pieceName = 'p';
    private hasMoved: boolean;

    constructor(color: Color) {
        this.color = color;
        this.hasMoved = false;
    }
    
    notifyMove(): void {
        this.hasMoved = true;
    }

    getControlArea(pos: Square, board: Board): Square[] {
        const rowDirection = this.getMoveDirection();

        const nextRow = pos.row + rowDirection;

        let area: Square[] = [];
        
        const leftSide = pos.col - 1;
        if (board.inBounds(nextRow, leftSide)) {
            area.push({row: nextRow, col: leftSide});
        }

        const rightSide = pos.col + 1;
        if (board.inBounds(nextRow, rightSide)) {
            area.push({row: nextRow, col: rightSide});
        }

        return area;

    }

    getMoves(pos: Square, board: Board): Square[] {
        const rowDirection = this.getMoveDirection();

        const nextRow = pos.row + rowDirection;

        let moves: Square[] = [];

        // Assume nextRow, same column is in bounds.
        // Otherwise, pawn would already be promoted.

        if (!board.isOccupied(nextRow, pos.col)) {
            moves.push({row: nextRow, col: pos.col});

            const doubleMove = nextRow + rowDirection;

            if (!this.hasMoved && board.inBounds(doubleMove, pos.col) && !board.isOccupied(doubleMove, pos.col)) {
                moves.push({row: doubleMove, col: pos.col});
            }

        }

        const enemyColor = Color.opposite(this.color);
        const controls = this.getControlArea(pos, board);
        // add control squares (diagonals) to moves if occupied by enemy.
        const enemyDiagonals = controls.filter(square => board.occupiedBy(square.row, square.col, enemyColor));
        enemyDiagonals.map(square => moves.push(square));

        return moves.filter(square => !board.putsInCheck(pos, square, this.color));
    }

    getPromotionsOnMove(onMoveTo: Square, board: Board): string[] {
        if (this.color == Color.White) {
            if (onMoveTo.row === board.topRow()) {
                return []; // knight, bishop, rook, queen.
            } else {
                return []; // nothing
            }
        } else {
            if (onMoveTo.row === 0) {
                return []; // knight, bishop, rook, queen.
            } else {
                return []; // nothing
            }
        }
    }

    private getMoveDirection() {
        const increment = this.color == Color.White ? 1 : -1;
        return increment;
    }

}
