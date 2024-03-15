import { Board } from "../board.js";
import { Color } from "../color.js";
import { Square } from "../square.js";
import { Piece } from "./piece.js";

export class Knight implements Piece {
    readonly color: Color;
    readonly pieceName = 'n';

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

    notifyMove(): void {}

    getControlArea(pos: Square, board: Board): Square[] {
        const squares = Knight.offsets.map(offset => { return { row: pos.row + offset[1], col: pos.col + offset[0] } });
        const inBounds = squares.filter(square => board.inBoundsSquare(square));

        return inBounds;
    }

    getMoves(pos: Square, board: Board): Square[] {
        const controls = this.getControlArea(pos, board);
        
        // remove squares where same color.
        const diffColor = controls.filter(square => !board.occupiedBy(square.row, square.col, this.color));

        // remove squares that put self in check.
        const validMoves = diffColor.filter(square => !board.putsInCheck(pos, square, this.color));

        return validMoves;
    }
}
