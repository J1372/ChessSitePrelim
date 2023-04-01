import { Board } from '../gameplay/board.js';
import { Game } from '../gameplay/game.js'


const canvasBoard = document.getElementById('board') as HTMLCanvasElement;
canvasBoard.height = canvasBoard.width;
const ctx = canvasBoard.getContext('2d') as CanvasRenderingContext2D;


function renderBoardBackground(board: Board | null) {
    const size = canvasBoard.width / 8;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if ((i + j) % 2 == 0) {
                ctx.fillStyle = 'grey';
            } else {
                ctx.fillStyle = 'darkgrey';
            }

            const start = {x: j * size, y: i * size};
            ctx.fillRect(start.x, start.y, size, size);
        }
    }
}

renderBoardBackground(null);

//const gameJSON = fetch('http://localhost:8080/get-game/' + uuid);