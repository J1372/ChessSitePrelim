//const gameDownload = await fetch("http://localhost:8080/get-game/uuid")

import {game, canvasBoard, ctx, renderBoardBackground, renderBoardForeground} from './view_game.js'
import {Board} from '/board.js'
/*class GameClient {
    game: Game;

}*/
console.log('from play_game.js!')
console.log(game)

let selected = null;

const lastSlash = window.location.href.lastIndexOf('/');
const uuid = window.location.href.substring(lastSlash + 1);
const user = document.getElementById('to-user-page').innerText;

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

    console.log(clicked);
    console.log(clickedPiece);
    
    if (selected) {
        if (game.canMove(user, selected, clicked)) {
            // send move, then game.move();
            console.log(Board.convertToNotation(selected));
            console.log(Board.convertToNotation(clicked));
            game.move(selected, clicked);
            renderBoardBackground();
            renderBoardForeground(game.board);

            sendMove({from: Board.convertToNotation(selected), to: Board.convertToNotation(clicked)});
        }

        selected = null;
    } else {
        if (clickedPiece) { // is my piece
            // set selected. display possible moves.
            selected = clicked;
            const moves = clickedPiece.getMoves(clicked, game.board);
            console.log(moves);
        }
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

    fetch("http://localhost:8080/game-move/" + uuid,
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

function updateClock() {

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