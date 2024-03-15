import { Board } from "../board.js";
import { Color } from "../color.js";
import { Square } from "../square.js";
import { Piece, Ray } from "./piece.js";

export class Bishop implements Piece {
    readonly color: Color;
    readonly pieceName = 'b';

    constructor(color: Color) {
        this.color = color;
    }
    
    getControlArea(pos: Square, board: Board): Square[] {
        return Ray.getControlMultiple(pos, Ray.diagonals, board);
    }
    
    notifyMove(): void {}
    
    getMoves(pos: Square, board: Board): Square[] {
        const controls = this.getControlArea(pos, board);
        
        // remove squares where same color.
        const diffColor = controls.filter(square => !board.occupiedBy(square.row, square.col, this.color));

        // remove squares that put self in check.
        const validMoves = diffColor.filter(square => !board.putsInCheck(pos, square, this.color));

        return validMoves;
    }
}
