
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

export class TimeControl {
    startingMins: number;
    startingSecs: number;

    // in seconds.
    increment: number;
    delay: number;

    constructor(startingMins: number, startingSecs: number, increment: number, delay: number) {
        this.startingMins = startingMins;
        this.startingSecs = startingSecs;
        this.increment = increment;
        this.delay = delay;
    }
}

export class Player {
    user: string;
    timeRemaining: number[];

    constructor(user: string, startTime: number[]) {
        this.user = user;
        this.timeRemaining = startTime.slice();
    }
}


export enum Color {
    White,
    Black,
}

// This is a game currently being played.
export class Game {
    uuid: string; // length = 16
    white: Player;
    black: Player;
    board: Board;
    moves: Move[]; // move history.

    // Date the game actually started (both users could make moves).
    started: Date;
    timeControl: TimeControl;

    curTurn: Color;

    drawOffer?: string; // user who offered a draw, if any. if other user offers draw, accepts draw.

    constructor(description: GamePost, otherUser: string) {
        this.uuid = description.uuid;
        this.timeControl = description.timeControl;
        this.started = new Date(); // could use Date.now instead

        if (!description.hostPlayAs) {
            description.hostPlayAs = Math.random() <= 0.5 ? Color.White : Color.Black;
        }

        if (description.hostPlayAs === Color.White) {
            this.white = new Player(description.host, [this.timeControl.startingMins, this.timeControl.startingSecs]);
            this.black = new Player(otherUser, [this.timeControl.startingMins, this.timeControl.startingSecs]);
        } else {
            this.white = new Player(otherUser, [this.timeControl.startingMins, this.timeControl.startingSecs]);
            this.black = new Player(description.host, [this.timeControl.startingMins, this.timeControl.startingSecs]);
        }

        this.curTurn = Color.White;

        this.board = new Board(8, 8);
        this.moves = new Array<Move>();

    }

    genPgn(): string {
        return '';
    }
}



// A posting for a game that is looking for another player.
export class GamePost {
    uuid: string; // length = 16

    host: string; // user that wants to create the game.
    timeControl: TimeControl;

    // Date that the game was made available for joining.
    posted: Date;

    // Color that the host will play as.
    hostPlayAs?: Color;

    constructor(uuid: string, host: string, timeControl: TimeControl, hostPlayAs?: Color) {
        this.host = host;
        this.uuid = uuid;
        this.timeControl = timeControl;
        this.posted = new Date(); // could use Date.now instead
        this.hostPlayAs = hostPlayAs;
    }

}

interface Square {
    row: number;
    col: number;
}

interface Piece {
    color: Color;

    /**
     * Get a list of squares that the piece can move to.
     * @param pos Square the ppiece is currently on.
     * @param board The board the piece is on.
     */
    getMoves(pos: Square, board: Board): Array<Square>;

    /**
     * Get possible piece promotions for this piece if it were to move to a square on the given board.
     * @param onMoveTo Square to move to on the board.
     * @param board The board the piece is on.
     */
    getPromotionsOnMove(onMoveTo: Square, board: Board): Array<Piece>;
}

class Board {
    board: Array<Piece | null>;

    rows: number;
    cols: number;

    // Currently only supports the standard chess board piece setup.
    constructor(rows: number, cols: number /*config?: Array<[Square, Piece]>*/) {
        this.rows = rows;
        this.cols = cols;
        this.board = new Array<Piece>(rows * cols);

        // if config -> do config setup else do standard setup

        this.standardBoardSetup()
    }

    /**
     * Sets the board up with the standard chess setup.
     */
    standardBoardSetup() {
        function pawnRow(row: number, color: Color, board: Board) {
            for (let i = 0; i < board.cols; ++i) {
                board.board[i] = null;
            }
        }

        pawnRow(1, Color.White, this);
        pawnRow(6, Color.White, this);

        // knights, bishops, rooks, queen, and king.
    }

    /**
     * Gets the piece at a square on the board.
     * @param row 
     * @param col 
     * @returns The piece at the given position or null.
     */
    getPiece(row: number, col: number) {
        const index = row * this.cols + col; // 0 index
        return this.board[index];
    }
}
