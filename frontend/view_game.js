import { Game } from "/game.js";
import {Board} from '/board.js';

const gameJson = JSON.parse(document.getElementById('gameJson').innerText);
console.log('Json:');
console.log(gameJson);

const game = Game.deserialize(gameJson);
const uuid = game.uuid;

console.log('Game:');
console.log(game);

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
        for (let j = 0; j < board.rows; j++) {
            const piece = board.getPiece(i, j);
            if (piece) {
                renderPiece({ row: i, col: j }, piece);
            }
        }
    }
}



renderBoardBackground();
renderBoardForeground(game.board);

function onGameMove(event) {
    console.log(event);

    const move = JSON.parse(event.data);
    const from = Board.convertFromNotation(move.from);
    const to = Board.convertFromNotation(move.to);

    game.move(from, to);
    renderBoardBackground();
    renderBoardForeground(game.board);

    // check for checkmate, check.
    // remember to close sse if checkmmate !
}

function onGameResign(event) {
    const data = JSON.parse(event.data);
    console.log(data);
    console.log(data.user + ' resigned.');
    // in playgame : canvasBoard.removeEventListener('click');
    moveListener.close();
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
    moveListener.close();
}

function updateClock() {

}


const sseURL = 'http://localhost:8080/game/' + uuid + '/subscribe';
const moveListener = new EventSource(sseURL/*, {withCredentials: true}*/);
moveListener.addEventListener("move", onGameMove);
moveListener.addEventListener("resign", onGameResign);
moveListener.addEventListener("timeout", onGameTimeout);
moveListener.onerror = () => moveListener.close();

// alternatively, look at the pagehide event
window.addEventListener('visibilitychange', event => {
    console.log(window.visibilityState);
    if (window.visibilityState === 'hidden') {
        // close the event source.
        moveListener.close();
    } else {
        // reopen the event source.
    }
});


// could also separate move event from timeout event.

export { // just for now exporrting funcs as well
    game, canvasBoard, ctx, renderSquare, renderPiece, renderBoardBackground, renderBoardForeground
}
