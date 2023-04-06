import { Game } from "/game.js";
import {Board} from '/board.js';
import { pieceFactory } from '/pieces/piece_factory.js';
import { Color } from '/color.js';

function setupClientGame() {
    const gameJsonElement = document.getElementById('gameJson');
    const game = Game.deserialize(JSON.parse(gameJsonElement.innerText));

    gameJsonElement.remove();
    return game;
}

const game = setupClientGame();
const uuid = game.uuid;

let perspective = Color.White;

function setPerspective(color) {
    perspective = color;
    renderBoardBackground();
    renderBoardForeground(game.board);
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
                renderSquare({ col: j, row: i }, 'grey');
            }
            else {
                renderSquare({ col: j, row: i }, 'darkgrey');
            }
        }
    }
}

function renderPiece(square, piece) {
    const size = canvasBoard.width / 8;
    const start = { x: square.col * size + size / 3, y: square.row * size + size / 2};

    ctx.fillStyle = 'red';
    ctx.font = "16px Arial";
    ctx.fillText(piece.pieceName + piece.color, start.x, start.y);
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



renderBoardBackground();
renderBoardForeground(game.board);

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
        if (color === Color.White) {
            console.log(player.user + ' (White) has won');
        } else {
            console.log(player.user + ' (Black) has won');
        }

        sseListener.close();
    }
    
    renderBoardBackground();
    renderBoardForeground(game.board);

}

function onGameResign(event) {
    const data = JSON.parse(event.data);
    console.log(data.resigned + ' resigned.');
    // in playgame : canvasBoard.removeEventListener('click');
    sseListener.close();
}

function onGameTimeout(event) {
    // should send user who time out.
    // can't rely on client-side game object if is player.
    // client may move, then timeout, display
    // actually, server should not respond to send movem so it should be fine.
    const data = JSON.parse(event.data);
    console.log(data);
    console.log(game.getCurPlayer().name + ' timed out.');

    // in playgame : canvasBoard.removeEventListener('click');
    sseListener.close();
}

function updateClock() {

}


const sseURL = 'http://localhost:8080/game/' + uuid + '/subscribe';
const sseListener = new EventSource(sseURL/*, {withCredentials: true}*/);
sseListener.addEventListener("move", onGameMove);
sseListener.addEventListener("resign", onGameResign);
sseListener.addEventListener("timeout", onGameTimeout);
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




// could also separate move event from timeout event.

export { // just for now exporrting funcs as well
    game, canvasBoard, ctx, renderSquare, renderPiece, renderBoardBackground, renderBoardForeground, sseListener, setPerspective, perspective, convertSquare
}
