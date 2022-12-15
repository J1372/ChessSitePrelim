/*
    Represents a move on a chess board.
    Each number is in range of [0, 63] and represents a square on the board.
*/
export interface Move {
    from: number;
    to: number;

    // A one character representation of the piece that was moved.
    pieceMoved: string;

    // May be empty if move did not capture
    pieceCaptured: string;

    // A one-character representation of the promotion piece.
    // May be empty if no promotion occurred.
    promotedTo: string;

    // function to get a string rep of the move.

}
