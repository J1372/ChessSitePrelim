import { Board } from "../board.js";
import { Color } from "../color.js";
import { Square } from "../square.js";

export interface Piece {
    readonly color: Color;

    /**
     * Get a list of squares that the piece can move to.
     * @param pos Square the piece is currently on.
     * @param board The board the piece is on.
     */
    getMoves(pos: Square, board: Board): Array<Square>;

    
    /**
     * Get a list of squares that the piece can move to.
     * @param pos Square the piece is currently on.
     * @param board The board the piece is on.
     */
    //getControlArea(pos: Square, board: Board): Array<Square>;

    /**
     * Get possible piece promotions for this piece if it were to move to a square on the given board.
     * @param onMoveTo Square to move to on the board.
     * @param board The board the piece is on.
     */
    getPromotionsOnMove(onMoveTo: Square, board: Board): Array<Piece>;
}


export namespace Ray {
    export type vector = [number, number];

    export const up: vector = [0, 1];
    export const down: vector = [0, -1];
    export const left: vector = [-1, 0];
    export const right: vector = [1, 0];


    export const upLeft: vector = [-1, 1];
    export const upRight: vector = [1, 1];
    export const downLeft: vector = [-1, -1];
    export const downRight: vector = [1, -1];

    export const diagonals: Array<vector> = [upLeft, upRight, downLeft, downRight];
    export const laterals: Array<vector> = [up, right, down, left];


    export const everyDirection: Array<vector> = [up, right, down, left, upLeft, upRight, downLeft, downRight];


    export function getMoves(pos: Square, vector: Ray.vector, board: Board, forColor: Color): Array<Square> {
        const moves: Array<Square> = [];

        let curRow = pos.row + vector[1];
        let curCol = pos.col + vector[0];

        while (board.inBounds(curRow, curCol) && !board.isOccupied(curRow, curCol)) {
            moves.push({row: curRow, col: curCol});
            
            curRow += vector[1];
            curCol += vector[0];
        }

        if (board.inBounds(curRow, curCol)) {
            // Stopped because collided with a piece.

            // If that piece is a different color from the provided color, add that capture as a move.
            if (board.occupiedBy(curRow, curCol, Color.opposite(forColor))) {
                moves.push({row: curRow, col: curCol});
            }
        }

        return moves;
    }
    
    export function getMovesMultiple(pos: Square, vectors: Array<Ray.vector>, board: Board, forColor: Color): Array<Square> {
        const moves: Array<Square> = [];

        // Could be more efficient.
        vectors.forEach(vector => {
            const directionMoves = getMoves(pos, vector, board, forColor);
            moves.push(...directionMoves);
        });

        return moves;
    }
}
