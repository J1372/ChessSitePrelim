import { Piece } from './piece.js'
import { Queen } from './queen.js'
import { Rook } from './rook.js'
import { Bishop } from './bishop.js'
import { Knight } from './knight.js'
import { Color } from '../color.js';

// Used for piece promotions.
export function pieceFactory(name: string, color: Color): Piece | null {
    switch (name) {
        case 'queen': return new Queen(color);
        case 'knight': return new Knight(color);
        case 'bishop': return new Bishop(color);
        case 'rook': return new Rook(color);

        default: return null;
    }
}

