//const gameDownload = await fetch("http://localhost:8080/get-game/uuid")

import {game, canvasBoard, ctx, renderSquare, renderPiece, renderBoardBackground, renderBoardForeground} from './view_game.js';
import {Board} from '/board.js';
/*class GameClient {
    game: Game;

}*/
console.log('from play_game.js!')
console.log(game)

let selected = null;

const user = document.getElementById('to-user-page').innerText;

const player = game.getPlayer(user);

function selectSquare(toSelect, piece) {
    selected = toSelect;
    const moves = piece.getMoves(selected, game.board);
    console.log(moves);
    
    renderSquare(selected, 'green');
    renderPiece(selected, piece);
    renderMoves(moves);
}

// handles user's click on the board.
function handleClick(event) {
    /*if (!game.isTurn(me)) {
        return;
    }*/

    // translate click coords to square.
    const squareSize = canvasBoard.width / game.board.cols;
    const file = Math.floor(event.offsetX / squareSize);
    const rank = Math.floor(event.offsetY / squareSize);

    const clicked = {
        row: rank,
        col: file
    };

    const clickedPiece = game.board.getPiece(clicked.row, clicked.col);

    if (selected) {
        if (game.canMove(user, selected, clicked)) {

            sendMove({from: Board.convertToNotation(selected), to: Board.convertToNotation(clicked)});
            selected = null;
        } else if (game.owns(player, clicked)) {
            renderBoardBackground();
            renderBoardForeground(game.board);
            selectSquare(clicked, clickedPiece);
        } else {
            renderBoardBackground();
            renderBoardForeground(game.board);
            selected = null;
        }

    } else {
        if (game.owns(player, clicked) && game.isTurn(player)) { // is my piece
            // set selected. display possible moves.
            selectSquare(clicked, clickedPiece);
        }
    }

}


function renderMoves(moves) {
    const squareSize = canvasBoard.width / 8;
    const radius = squareSize / 4;

    for (const square of moves) {
        const center = { x: square.col * squareSize + squareSize/2, y: square.row * squareSize + squareSize/2 };

        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, 2* Math.PI, false);
        ctx.fill();
    }
}

canvasBoard.addEventListener('click', handleClick);


// update clock every second based on time elapsed from start.
//setInterval(updateClock, 1000);

/*
    Moves:

    d: draw offer / accept draw
    r: resign

    {fromSquare}-{toSquare}: normal move
*/
async function sendMove(move) {
    // disable canvas interaction.
    // send ajax post 

    fetch("http://localhost:8080/game-move/" + game.uuid,
    {
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },

        method: "post",
        body: JSON.stringify(move), // later, add a promotion attribute if needed
    });

    // if sending failed, undo move and enable interaction.

}

/*
    Moves:

    d: draw offer / accept draw
    r: resign
    t: timeout

    {fromSquare}-{toSquare}: normal move
*/
function onOpponentMove(event) {
    // enable canvas interaction if game still ongoing.

}

//'http://localhost:8080/game/' + uuid;
//const opponentListener = new EventSource("", {withCredentials: true});
//opponentListener.addEventListener("move", onOpponentMove);

// could also separate move event from timeout event.


/*
    Moves:

    d: draw offer / accept draw
    r: resign
    t: timeout

    {fromSquare}-{toSquare}: normal move

function onOpponentMove(event: MessageEvent<Move>) {
    // enable canvas interaction if game still ongoing.

}*/