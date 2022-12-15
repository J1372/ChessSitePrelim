import { Board } from "../board";
import { Color } from "../color";
import { Square } from "../square";
import { Piece, Ray } from "./piece";

export class Rook implements Piece {
    color: Color;

    getMoves(pos: Square, board: Board): Square[] {
        return Ray.getMovesMultiple(pos, Ray.laterals, board, this.color);
    }
    getPromotionsOnMove(onMoveTo: Square, board: Board): Piece[] {
        return [];
    }
    
}