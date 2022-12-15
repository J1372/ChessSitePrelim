import { Board } from "../board";
import { Color } from "../color";
import { Square } from "../square";
import { Piece } from "./piece";

export class Pawn implements Piece {
    readonly color: Color;
    readonly hasMoved: boolean;

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

        // Can move (diagonally by 1 if enemy piece present).
        const enemyColor = Color.opposite(this.color);

        const leftSide = pos.col - 1;
        if (board.inBounds(nextRow, leftSide) && board.occupiedBy(nextRow, leftSide, enemyColor)) {
            moves.push({row: nextRow, col: leftSide});
        }

        const rightSide = pos.col + 1;
        if (board.inBounds(nextRow, rightSide) && board.occupiedBy(nextRow, rightSide, enemyColor)) {
            moves.push({row: nextRow, col: rightSide});
        }

        return moves;
    }

    getPromotionsOnMove(onMoveTo: Square, board: Board): Piece[] {
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
