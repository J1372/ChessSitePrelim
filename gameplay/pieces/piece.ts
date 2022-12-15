import { Board } from "../board";
import { Color } from "../color";
import { Square } from "../square";

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
    getControlArea(pos: Square, board: Board): Array<Square>;

    /**
     * Get possible piece promotions for this piece if it were to move to a square on the given board.
     * @param onMoveTo Square to move to on the board.
     * @param board The board the piece is on.
     */
    getPromotionsOnMove(onMoveTo: Square, board: Board): Array<Piece>;
}


export namespace Ray {
    export const up: [number, number] = [0, 1];
    export const down: [number, number] = [0, -1];
    export const left: [number, number] = [-1, 0];
    export const right: [number, number] = [1, 0];


    export const upLeft: [number, number] = [-1, 1];
    export const upRight: [number, number] = [1, 1];
    export const downLeft: [number, number] = [-1, -1];
    export const downRight: [number, number] = [1, -1];

    export const diagonals: Array<[number, number]> = [upLeft, upRight, downLeft, downRight];
    export const laterals: Array<[number, number]> = [up, right, down, left];


    export const everyDirection: Array<[number, number]> = [up, right, down, left, upLeft, upRight, downLeft, downRight];


    export function getMoves(pos: Square, vector: [number, number], board: Board, forColor: Color): Array<Square> {
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
    
    export function getMovesMultiple(pos: Square, vectors: Array<[number, number]>, board: Board, forColor: Color): Array<Square> {
        const moves: Array<Square> = [];

        // Could be more efficient.
        vectors.forEach(vector => {
            const directionMoves = getMoves(pos, vector, board, forColor);
            moves.push(...directionMoves);
        });

        return moves;
    }
}
