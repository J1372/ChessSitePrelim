import { Piece } from './piece.js'
import { Queen } from './queen.js'
import { Rook } from './rook.js'
import { Bishop } from './bishop.js'
import { Knight } from './knight.js'
import { Color } from '../color.js';
import { King } from './king.js'
import { Pawn } from './pawn.js'

// Used for piece promotions.
export function pieceFactory(name: string, color: Color): Piece | null {
    switch (name) {
        case 'p': return new Pawn(color);
        case 'n': return new Knight(color);
        case 'b': return new Bishop(color);
        case 'q': return new Queen(color);
        case 'k': return new King(color);
        case 'r': return new Rook(color);

        default: return null;
    }
}

