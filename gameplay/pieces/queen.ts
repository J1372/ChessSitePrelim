import { Board } from "../board.js";
import { Color } from "../color.js";
import { Square } from "../square.js";
import { Piece, Ray } from "./piece.js";

export class Queen implements Piece {
    readonly color: Color;
    readonly pieceName = 'q';

    constructor(color: Color) {
        this.color = color;
    }
    getControlArea(pos: Square, board: Board): Square[] {
        return Ray.getControlMultiple(pos, Ray.everyDirection, board);
    }

    notifyMove(): void {}

    
    getMoves(pos: Square, board: Board): Square[] {
        const controls = this.getControlArea(pos, board);
        
        // remove squares where same color.
        const diffColor = controls.filter(square => !board.occupiedBy(square.row, square.col, this.color));
        console.log(diffColor);

        // remove squares that put self in check.
        const validMoves = diffColor.filter(square => !board.putsInCheck(pos, square, this.color));
        console.log(diffColor);

        return validMoves;
    }

    getPromotionsOnMove(onMoveTo: Square, board: Board): string[] {
        return [];
    }
    
}