import { Game } from "/game.js";
import {Board} from '/board.js';
import { pieceFactory } from '/pieces/piece_factory.js';
import { Color } from '/color.js';

export const gameResult = document.getElementById('game-result');

function setupClientGame() {
    const gameJsonElement = document.getElementById('gameJson');
    const game = Game.deserialize(JSON.parse(gameJsonElement.innerText));

    gameJsonElement.remove();
    return game;
}

const game = setupClientGame();

let perspective = Color.White;

function setPerspective(color) {
    perspective = color;
    renderBoard();
}

document.getElementById('switch-perspective').addEventListener('click', () => {
    setPerspective(Color.opposite(perspective));
});

const canvasBoard = document.getElementById('board');
canvasBoard.height = canvasBoard.width;
const ctx = canvasBoard.getContext('2d');

function renderSquare(square, color) {
    const size = canvasBoard.width / 8;
    const start = { x: square.col * size, y: square.row * size };
    ctx.fillStyle = color;
    ctx.fillRect(start.x, start.y, size, size);
}

function renderBoardBackground() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if ((i + j) % 2 == 0) {
                renderSquare({ col: j, row: i }, 'darkgrey');
            }
            else {
                renderSquare({ col: j, row: i }, 'grey');
            }
        }
    }
}

function renderPiece(square, piece) {
    const size = canvasBoard.width / 8;
    const start = { x: square.col * size + size / 4, y: square.row * size + (size * 0.75)};
    
    const pieceRep = piece.pieceName.toUpperCase();
    ctx.font = "32px Arial";
    ctx.lineWidth = 2;
    if (piece.color === Color.White) {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
    } else {
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'white';
    }

    ctx.strokeText(pieceRep, start.x, start.y);
    ctx.fillText(pieceRep, start.x, start.y);
}

function renderBoardForeground(board) {
    for (let i = 0; i < board.rows; i++) {
        for (let j = 0; j < board.cols; j++) {
            const piece = board.getPiece(i, j);
            if (piece) {
                renderPiece(convertSquare({ row: i, col: j }), piece);
            }
        }
    }
}

function renderBoard() {
    renderBoardBackground();
    renderBoardForeground(game.board);
}

renderBoard();

function convertSquare(square) {
    if (perspective === Color.White) {
        return { row: 7 - square.row, col: square.col};
    } else {
        return { row: square.row, col: 7 - square.col};
    }
}


function onGameMove(event) {
    const move = JSON.parse(event.data);
    console.log(move);

    const from = Board.convertFromNotation(move.from);
    const to = Board.convertFromNotation(move.to);

    const color = game.board.curTurn;
    const player = game.getCurPlayer();
    game.move(from, to);

    if (move.promotion) {
        const piece = pieceFactory(move.promotion, color);
        game.promote(to, piece);
    }

    if (move.ended === 'mate') {
        gameResult.innerText = 'Checkmate. ' + player.user + ' (' + Color.toString(color) +') has won.';
        sseListener.close();
    }
    
    renderBoard();
}

function onGameResign(event) {
    const data = JSON.parse(event.data);
    const colRep = Color.toString(game.getColor(data.resigned));
    gameResult.innerText = data.resigned + ' (' + colRep + ') resigned.';
    sseListener.close();
}

function updateClock() {

}


const sseURL = '/game/' + game.uuid + '/subscribe';
const sseListener = new EventSource(sseURL);
sseListener.addEventListener("move", onGameMove);
sseListener.addEventListener("resign", onGameResign);
sseListener.onerror = () => sseListener.close();

// alternatively, look at the pagehide event
window.addEventListener('visibilitychange', event => {
    console.log(window.visibilityState);
    if (window.visibilityState === 'hidden') {
        // close the event source.
        sseListener.close();
    } else {
        // reopen the event source.
    }
});


export {
    game, canvasBoard, ctx, renderSquare, renderPiece, renderBoard, sseListener, setPerspective, perspective, convertSquare
}
