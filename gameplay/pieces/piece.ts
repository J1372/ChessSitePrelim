import { Board } from "../board.js";
import { Color } from "../color.js";
import { Square } from "../square.js";


// could have piece be a class so that we can implement a default getMoves.
// pawn is currently the only unique getMoves.
// is this a bad use case, inheriting just for code reuse?
// dont think so, each piece has a common interface, and differences that aren't data.
export interface Piece {
    readonly color: Color;
    readonly pieceName: string;

    /**
     * Get a list of squares that the piece can move to.
     * most pieces, this is just a more constrained getControlArea
     * pawn is an exception.
     * additional constraints:
     *      to square must not be same color.
     *      move must not place piece in check.
     * 
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
    getPromotionsOnMove(onMoveTo: Square, board: Board): Array<string>;

    notifyMove(): void;
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


    export function getControl(pos: Square, vector: Ray.vector, board: Board): Array<Square> {
        const controls: Array<Square> = [];

        let curRow = pos.row + vector[1];
        let curCol = pos.col + vector[0];

        while (board.inBounds(curRow, curCol)) {
            controls.push({row: curRow, col: curCol});

            if (board.isOccupied(curRow, curCol)) {
                // stop early because hit a piece.
                return controls;
            }

            curRow += vector[1];
            curCol += vector[0];
        }

        // went to edge of board

        return controls;
    }
    
    export function getControlMultiple(pos: Square, vectors: Array<Ray.vector>, board: Board): Array<Square> {
        const controls: Array<Square> = [];

        // Could be more efficient.
        vectors.forEach(vector => {
            const directionMoves = getControl(pos, vector, board);
            controls.push(...directionMoves);
        });

        return controls;
    }
}
