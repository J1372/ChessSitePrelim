
import { Game } from "../gameplay/game.js"
import { Piece } from "../gameplay/pieces/piece.js";
import { Square } from "../gameplay/square.js";

interface Move {
    move: string,
    promotion?: string
}


//const gameDownload = await fetch("http://localhost:8080/get-game/uuid")

const gameJson = JSON.parse(document.getElementById('gameJson')!.innerText);
console.log('Json:');
console.log(gameJson);

const game = Game.deserialize(gameJson);
console.log('Game:');
console.log(game);

/*class GameClient {
    game: Game;

}*/

let selected: Square | null = null;

// handles user's click on the board.
function handleClick(event: MouseEvent) {
    /*if (!game.isTurn(me)) {
        return;
    }


    // translate click coords to square.
    const squareSize = gameDisplay.width / game.board.cols;
    const file = event.offsetX / squareSize;
    const rank = event.offsetY / squareSize;

    const clicked : Square = {
        row: file,
        col: rank
    };

    const clickedPiece = game.board.getPiece(clicked.row, clicked.col);

    if (selected) {
        if (game.canMove(selected, clicked)) {
            // send move, then game.move();
            sendMove("___");
            game.move(selected, clicked);
        }

        selected = null;
    } else {
        if (clickedPiece?.color) { // is my piece
            // set selected. display possible moves.
            selected = clicked;
        }
    }*/

}

const gameDisplay = document.getElementById("board") as HTMLCanvasElement;
//gameDisplay.onclick = handleClick;


function updateClock() {

}

// update clock every second based on time elapsed from start.
//setInterval(updateClock, 1000);

/*
    Moves:

    d: draw offer / accept draw
    r: resign

    {fromSquare}-{toSquare}: normal move
*/
async function sendMove(move: string) {
    // disable canvas interaction.
    // send ajax post 

    const response = await fetch("http://localhost:8080/game-move",
    {
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },

        method: "post",
        body: JSON.stringify({move: move}), // later, add a promotion attribute if needed
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
function onOpponentMove(event: MessageEvent<Move>) {
    // enable canvas interaction if game still ongoing.

}

//'http://localhost:8080/game/' + uuid;
//const opponentListener = new EventSource("", {withCredentials: true});
//opponentListener.addEventListener("move", onOpponentMove);

// could also separate move event from timeout event.
