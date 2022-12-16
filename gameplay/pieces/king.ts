import { Board } from "../board.js";
import { Color } from "../color.js";
import { Square } from "../square.js";
import { Piece } from "./piece.js";

export class King implements Piece {
    color: Color = Color.White;

    private static offsets: Array<[number, number]> = [
        [-1, 1],
        [0, 1],
        [1, 1],
        [-1, 0],
        [1, 0],
        [-1, -1],
        [0, -1],
        [1, -1],
    ];

    
    constructor(color: Color) {
        this.color = color;
    }

    getMoves(pos: Square, board: Board): Square[] {
        let moves: Square[] = [];

        King.offsets.forEach(offset => {
            const potentialMove: Square = {row: pos.row + offset[1], col: pos.col + offset[0]};

            // Must check that king can not be captured after move as well.
            if (board.inBoundsSquare(potentialMove) && !board.occupiedBy(potentialMove.row, potentialMove.col, this.color)) {
                moves.push(potentialMove);
            }
        });
        
        return moves;
    }

    getPromotionsOnMove(onMoveTo: Square, board: Board): string[] {
        return [];
    }
    
}
