import { Board } from "../board.js";
import { Color } from "../color.js";
import { Square } from "../square.js";
import { Piece, Ray } from "./piece.js";

export class Bishop implements Piece {
    color: Color;

    constructor(color: Color) {
        this.color = color;
    }
    
    getMoves(pos: Square, board: Board): Square[] {
        return Ray.getMovesMultiple(pos, Ray.diagonals, board, this.color);
    }
    getPromotionsOnMove(onMoveTo: Square, board: Board): string[] {
        return [];
    }
    
}