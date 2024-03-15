import { Board } from "./board.js";
import BoardFactory from "./board_factory.js";
import { Color } from "./color.js";
import { GamePost } from "./game_post.js";
import { Move } from "./move.js";
import { Square } from "./square.js";

// Two player game metadata and board, which handles the actual game rules.
export class Game {
    private constructor(
        public readonly uuid: string,
        public readonly white: string,
        public readonly black: string,
        private board: Board,
        public readonly gameType: string,
        public readonly moves: Move[],
        public readonly started: Date)
    {}
    
    static fromPost(description: GamePost, otherUser: string) {
        let hostPlayAs = description.hostPlayAs;

        if (!hostPlayAs) {
            hostPlayAs = Math.random() <= 0.5 ? Color.White : Color.Black;
        }

        const gameType = 'standard';
        const board = BoardFactory.create(gameType);

        if (!board) {
            throw new Error('Failed to construct a board from GamePost.');
        }

        let white = ''
        let black = ''
        if (hostPlayAs === Color.White) {
            white = description.host;
            black = otherUser;
        } else {
            white = otherUser;
            black = description.host;
        }

        return new Game(description.uuid, white, black, board, gameType, [], new Date()); // could use Date.now instead
    }

    static deserialize(object: any) {
        const board = BoardFactory.deserialize(object.gameType, object.board);

        if (!board) {
            throw new Error('Failed to deserialize board.');
        }

        return new Game(object.uuid, object.white, object.black, board, object.gameType, object.moves, object.started);
    }
    
    public getCurPlayer() {
        if (this.board.curTurn === Color.White) {
            return this.white;
        } else {
            return this.black;
        }
    }

    public isPlayer(user: string): boolean {
        return this.white === user || this.black === user;
    }

    public isTurn(player: string): boolean {
        return this.getColor(player) === this.board.curTurn;
    }

    public hasWon(color: Color) {
        return this.board.hasWon(color);
    }

    public userWon(user: string) {
        return this.hasWon(this.getColor(user));
    }

    public owns(player: string, square: Square): boolean {
        const piece = this.board.getPiece(square.row, square.col);
        return this.board.occupiedBy(square.row, square.col, this.getColor(player));
    }

    public canMove(user: string, move: Move): boolean {
        return this.isPlayer(user) && this.isTurn(user) && this.board.canMove(move);
    }

    public move(move: Move): void {
        this.board.move(move);
        this.moves.push(move);
    }

    public getColor(user: string): Color {
        return user === this.white ? Color.White : Color.Black;
    }
    
    public getForcedPromotions(move: Move): string[] {
        return this.board.getForcedPromotions(move);
    }

    /*genPgn(): string {
        return '';
    }*/
}
