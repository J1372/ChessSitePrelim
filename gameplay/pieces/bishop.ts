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
    
    notifyMove(): void {}

    
    getMoves(pos: Square, board: Board): Square[] {
        return Ray.getMovesMultiple(pos, Ray.diagonals, board, this.color);
    }
    getPromotionsOnMove(onMoveTo: Square, board: Board): string[] {
        return [];
    }
    
}