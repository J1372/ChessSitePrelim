import { Board } from "../board";
import { Color } from "../color";
import { Square } from "../square";
import { Piece } from "./piece";

export class King implements Piece {
    color: Color;

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

    getPromotionsOnMove(onMoveTo: Square, board: Board): Piece[] {
        return [];
    }
    
}
