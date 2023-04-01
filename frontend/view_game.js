import { Game } from "/game.js"

const gameJson = JSON.parse(document.getElementById('gameJson').innerText);
console.log('Json:');
console.log(gameJson);

const game = Game.deserialize(gameJson);
console.log('Game:');
console.log(game);

const canvasBoard = document.getElementById('board');
canvasBoard.height = canvasBoard.width;
const ctx = canvasBoard.getContext('2d');

function renderBoardBackground() {
    const size = canvasBoard.width / 8;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if ((i + j) % 2 == 0) {
                ctx.fillStyle = 'grey';
            }
            else {
                ctx.fillStyle = 'darkgrey';
            }
            const start = { x: j * size, y: i * size };
            ctx.fillRect(start.x, start.y, size, size);
        }
    }
}

function renderBoardForeground(board) {
    ctx.fillStyle = 'red';
    ctx.font = "16px Arial";
    const size = canvasBoard.width / 8;

    for (let i = 0; i < board.rows; i++) {
        for (let j = 0; j < board.rows; j++) {
            const piece = board.getPiece(i, j);
            
            const start = { x: j * size + size / 3, y: i * size + size / 2};

            if (piece) {
                ctx.fillText(piece.pieceName + piece.color, start.x, start.y);
            }
        }
    }
}



renderBoardBackground();
renderBoardForeground(game.board);

function onGameEvent(event) {

}

/*
'http://localhost:8080/game/' + uuid;
const opponentListener = new EventSource("", {withCredentials: true});
opponentListener.addEventListener("move", onOpponentMove);
*/
// could also separate move event from timeout event.

export { // just for now exporrting funcs as well
    game, canvasBoard, ctx, renderBoardBackground, renderBoardForeground
}