import {game, canvasBoard, ctx, renderSquare, renderPiece, renderBoard, sseListener, setPerspective, convertSquare} from './view_game.js';
import {Board} from '/board.js';

import { Color } from '/color.js'

let selected = null;

const user = document.getElementById('to-user-page').innerText;
const player = game.getPlayer(user);

const resignButton = document.getElementById('resign-button');

if (player === game.black) {
    setPerspective(Color.Black);
}

document.getElementById('switch-perspective').addEventListener('click', () => {
    // re-render the selected piece's moves on the board after flip.
    if (selected) {
        selectSquare(selected);
    }
});

function selectSquare(toSelect) {
    selected = toSelect;

    // will not be null as we check for ownership in the click handler.
    const piece = game.board.getPiece(selected.row, selected.col);
    const moves = piece.getMoves(selected, game.board).map(convertSquare);
    const renderSelected = convertSquare(selected);
    
    renderSquare(renderSelected, 'green');
    renderPiece(renderSelected, piece);
    renderMoves(moves);
}

let moveCopy = null;
const promotionList = document.getElementById('promotion-list');

function promotionListOpen() {
    return promotionList.children.length > 0;
}

function openPromotionList(x, y, choices) {
    // set css for promotionList x, y
    promotionList.style.left = x + 'px';
    promotionList.style.top = y + 'px';

    // add choices to list.
    choices.forEach(choice => {
        const li = document.createElement('li');
        li.innerText = choice;
        li.addEventListener('click', _ => {
            sendMove({ from: Board.convertToNotation(selected), to: Board.convertToNotation(moveCopy), promotion: choice });
            selected = null;
        
            closePromotionList();
            renderBoard();
        });
        promotionList.appendChild(li);
    });
}

function closePromotionList() {
    promotionList.replaceChildren();
}

// handles user's click on the board.
function handleClick(event) {
    if (promotionListOpen()) {
        closePromotionList();
        renderBoard();
        selected = null;
        return;
    }

    // translate click coords to square.
    const squareSize = canvasBoard.width / game.board.cols;
    const file = Math.floor(event.offsetX / squareSize);
    const rank = Math.floor(event.offsetY / squareSize);

    const clickedGraphical = {
        row: rank,
        col: file
    };

    const clicked = convertSquare(clickedGraphical);

    if (selected) {
        if (clicked.row === selected.row && clicked.col === selected.col) {
            renderBoard();
            selected = null;
        } else if (game.owns(player, clicked)) {
            renderBoard();
            selectSquare(clicked);
        } else if (game.canMove(user, selected, clicked)) {
            const forcedPromotions = game.getPromotions(selected, clicked);
            if (forcedPromotions.length > 0) {
                moveCopy = clicked;
                openPromotionList(event.offsetX, event.offsetY, forcedPromotions);
            } else {
                sendMove({from: Board.convertToNotation(selected), to: Board.convertToNotation(clicked)});
                selected = null;
            }
            
        } else {
            renderBoard();
            selected = null;
        }

    } else {
        if (game.owns(player, clicked) && game.isTurn(player)) { // is my piece
            // set selected. display possible moves.
            selectSquare(clicked);
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

resignButton.addEventListener('click', () => {
    fetch("http://localhost:8080/game-resign/" + game.uuid,
    {
        method: "post",
    });
})

function disableInteraction() {
    resignButton.remove();
    canvasBoard.removeEventListener('click', handleClick);

    if (selected) {
        selected = null;
        renderBoard();
    }
}

function onGameMove(event) {
    const move = JSON.parse(event.data);
    if (move.ended === 'mate') {
        disableInteraction();
    }
}

sseListener.addEventListener("move", onGameMove);
sseListener.addEventListener("resign", disableInteraction);
