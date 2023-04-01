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

    notifyMove(): void {}

    
    getMoves(pos: Square, board: Board): Square[] {
        return Ray.getMovesMultiple(pos, Ray.everyDirection, board, this.color);
    }

    getPromotionsOnMove(onMoveTo: Square, board: Board): string[] {
        return [];
    }
    
}