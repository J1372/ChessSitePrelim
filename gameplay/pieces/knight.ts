import { Board } from "../board.js";
import { Color } from "../color.js";
import { Square } from "../square.js";
import { Piece } from "./piece.js";

export class Knight implements Piece {
    readonly color: Color;

    private static offsets: Array<[number, number]> = [
        // Top
        [-1, 2],
        [1, 2],

        // Right
        [2, 1],
        [2, -1],

        // Bottom
        [-1, -2],
        [1, -2],

        // Left
        [-2, 1],
        [-2, -1],
    ];

    constructor(color: Color) {
        this.color = color;
    }

    getControlArea(pos: Square, board: Board): Square[] {
        throw new Error("Method not implemented.");
    }

    getMoves(pos: Square, board: Board): Square[] {
        let moves = this.getInBoundsSquares(pos, Knight.offsets, board).filter(square =>{
            !board.occupiedBy(square.row, square.col, this.color);
        });


        return moves;
    }

    getPromotionsOnMove(onMoveTo: Square, board: Board): string[] {
        return [];
    }

    private getInBoundsSquares(pos: Square, offsets: Array<[number, number]>, board: Board): Square[] {
        let moves: Square[] = [];

        offsets.forEach(offset => {
            const potentialMove: Square = {row: pos.row + offset[1], col: pos.col + offset[0]};

            if (board.inBoundsSquare(potentialMove)) {
                moves.push(potentialMove);
            }
        });
        
        return moves;
    }
    
}