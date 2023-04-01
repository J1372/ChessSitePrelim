import { Board } from "../board.js";
import { Color } from "../color.js";
import { Square } from "../square.js";
import { Piece, Ray } from "./piece.js";

export class Rook implements Piece {
    readonly color: Color;
    readonly pieceName = 'r';

    constructor(color: Color) {
        this.color = color;
    }

    notifyMove(): void {}

    getMoves(pos: Square, board: Board): Square[] {
        return Ray.getMovesMultiple(pos, Ray.laterals, board, this.color);
    }
    
    getPromotionsOnMove(onMoveTo: Square, board: Board): string[] {
        return [];
    }
    
}