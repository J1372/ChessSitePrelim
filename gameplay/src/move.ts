import { Square } from "./square.js";

/*
    Represents a move on a chess board.
    Each number is in range of [0, 63] and represents a square on the board.
*/
export interface Move {
    from: Square;
    to: Square;

    // A one-character representation of the promotion piece.
    // May be empty if no promotion occurred.
    promotedTo: string;

    // function to get a string rep of the move.
}
