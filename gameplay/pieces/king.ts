import { Board } from "../board.js";
import { Color } from "../color.js";
import { Square } from "../square.js";
import { Piece } from "./piece.js";

export class King implements Piece {
    readonly color: Color = Color.White;
    readonly pieceName = 'k';
    

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

    
    constructor(color: Color) {
        this.color = color;
    }
    getControlArea(pos: Square, board: Board): Square[] {
        let moves: Square[] = [];

        King.offsets.forEach(offset => {
            const potentialMove: Square = {row: pos.row + offset[1], col: pos.col + offset[0]};

            if (board.inBoundsSquare(potentialMove)) {
                moves.push(potentialMove);
            }
        });
        
        return moves;
    }
    
    notifyMove(): void {}


    getMoves(pos: Square, board: Board): Square[] {
        const controls = this.getControlArea(pos, board);
        
        // remove squares where same color.
        const diffColor = controls.filter(square => !board.occupiedBy(square.row, square.col, this.color));
        console.log(diffColor);

        console.log(diffColor);


        const castleFlags = board.castleAvailable[this.color];
        const castleRow = this.color === Color.White ? 0 : 7;

        if (castleFlags.kingside) {
            if (!board.isOccupied(castleRow, 5) && !board.isOccupied(castleRow, 6)) {
                diffColor.push({row: castleRow, col: 6});
            }
        }

        if (castleFlags.queenside) {
            if (!board.isOccupied(castleRow, 1) && !board.isOccupied(castleRow, 2) && !board.isOccupied(castleRow, 3)) {
                diffColor.push({row: castleRow, col: 2});
            }
        }

        // remove squares that put self in check.
        const validMoves = diffColor.filter(square => !board.putsInCheck(pos, square, this.color));

        return validMoves;
    }

    getPromotionsOnMove(onMoveTo: Square, board: Board): string[] {
        return [];
    }
    
}
