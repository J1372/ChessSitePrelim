import { Board, Color, Game, pieceFactory } from 'chessgameplay';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLoaderData, useParams } from 'react-router-dom';
import GameMenu from '../components/GameMenu';

import '../game_page.css'
import { SessionUserContext } from '../contexts/SessionUserContext';
import { queryClient } from '../App';
import { fetchThrow } from '../util/fetch_throw';

export const gameLoader = async ({ params }) => {
    return queryClient.fetchQuery(['game', params.gameId, 'game-state'], 
        () => fetchThrow('/games/' + params.gameId + '/game-state').then(res => res.json()),
        {
            staleTime:0 // default=0, but explicitly do not want to cache game state.
        }
    );
}

function GamePage() {
    const sessionUser = useContext(SessionUserContext);

    const params = useParams();
    const initialGameJson = useLoaderData();
    const game = useMemo(() => { // in order to use same Game class logic frontend and backend.
        if (initialGameJson) {
            return Game.deserialize(initialGameJson);
        } else {
            return null;
        }
    }, [initialGameJson]);

    const [gameStatus, setGameStatus] = useState('');
    const [moveForcedPromotions, setMoveForcedPromotions] = useState([]);
    
    // using refs because state is needed but the majority of rendering is done on a canvas.
    const moveCopy = useRef(null);
    const selected = useRef(null);
    const perspective = useRef(Color.White);
    const sse = useRef(null);

    const canvas = useRef(null);

    function renderSquare(square, color) {
        const canvasBoard = canvas.current;
        const ctx = canvasBoard.getContext('2d');

        const size = canvasBoard.width / 8;
        const start = { x: square.col * size, y: square.row * size };
        ctx.fillStyle = color;
        ctx.fillRect(start.x, start.y, size, size);
    }
    
    function renderBoardBackground() {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if ((i + j) % 2 === 0) {
                    renderSquare({ col: j, row: i }, 'darkgrey');
                }
                else {
                    renderSquare({ col: j, row: i }, 'grey');
                }
            }
        }
    }
    
    function renderPiece(square, piece) {
        const canvasBoard = canvas.current;
        const ctx = canvasBoard.getContext('2d');

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
    
    function convertSquare(square) {
        if (perspective.current === Color.White) {
            return { row: 7 - square.row, col: square.col};
        } else {
            return { row: square.row, col: 7 - square.col};
        }
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

    function onGameMove(event) {
        const move = JSON.parse(event.data);

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
            setGameStatus('Checkmate. ' + player + ' (' + Color.toString(color) +') has won.');
            sse.current?.close();
        }
        
        renderBoard();
    }

    function onGameResign(event) {
        const data = JSON.parse(event.data);
        const colRep = Color.toString(game.getColor(data.resigned));
        setGameStatus(data.resigned + ' (' + colRep + ') resigned.');

        sse.current?.close();
    }

    useEffect(() => {
        const canvasBoard = canvas.current;
        const ctx = canvasBoard.getContext('2d');

        if (ctx !== null && game !== null) {
            canvasBoard.height = canvasBoard.width;
            
            renderBoard();

            if (sessionUser === game.black) {
                setPerspective(Color.Black);
            }

            sse.current = new EventSource('/games/' + params.gameId + '/subscriptions');
            sse.current.addEventListener("move", onGameMove);
            sse.current.addEventListener("resign", onGameResign);
            sse.current.onerror = () => sse.current?.close();

            return () => {
                if (sse.current && sse.current.readyState !== EventSource.CLOSED) {
                    sse.current.close()};
                }
        }
    }, [])

    
    function renderMoves(moves) {
        const canvasBoard = canvas.current;
        const ctx = canvasBoard.getContext('2d');
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

    function selectSquare(toSelect) {
        selected.current = toSelect;
    
        // will not be null as we check for ownership in the click handler.
        const piece = game.board.getPiece(selected.current.row, selected.current.col);
        const moves = piece.getMoves(selected.current, game.board).map(convertSquare);
        const renderSelected = convertSquare(selected.current);
        
        renderSquare(renderSelected, 'green');
        renderPiece(renderSelected, piece);
        renderMoves(moves);
    }

    function setPerspective(color) {
        perspective.current = color;
        renderBoard();
        if (selected.current) {
            selectSquare(selected.current);
        }
    }
    function switchPerspective() {
        setPerspective(Color.opposite(perspective.current));
    }

    /*
    Moves:

    d: draw offer / accept draw
    r: resign

    {fromSquare}-{toSquare}: normal move
    */
    async function sendMove(move) {
        // disable canvas interaction.
        // send ajax post

        fetch("/games/" + game.uuid + "/moves",
        {
            headers: {
                "Content-Type": "application/json"
            },

            method: "post",
            body: JSON.stringify(move)
        });

        // if sending failed, undo move and enable interaction.

    }

    function promotionListOpen() {
        return moveForcedPromotions.length > 0;
    }

    function closePromotionList() {
        setMoveForcedPromotions([]);
    }

    function openPromotionList(x, y, forcedPromotions) {
        setMoveForcedPromotions(forcedPromotions);
    }

    // handles user's click on the board.
    function handleClick(event) {
        if (promotionListOpen()) {
            closePromotionList();
            renderBoard();
            selected.current = null;
            return;
        }

        const canvasBoard = canvas.current;
    
        // translate click coords to square.
        const squareSize = canvasBoard.width / game.board.cols;
        const file = Math.floor(event.nativeEvent.offsetX / squareSize);
        const rank = Math.floor(event.nativeEvent.offsetY / squareSize);
    
        const clickedGraphical = {
            row: rank,
            col: file
        };
    
        const clicked = convertSquare(clickedGraphical);
    
        if (selected.current) {
            if (clicked.row === selected.current.row && clicked.col === selected.current.col) {
                renderBoard();
                selected.current = null;
            } else if (game.owns(sessionUser, clicked)) {
                renderBoard();
                selectSquare(clicked);
            } else if (game.canMove(sessionUser, selected.current, clicked)) {
                const forcedPromotions = game.getPromotions(selected.current, clicked);
                if (forcedPromotions.length > 0) {
                    moveCopy.current = clicked;
                    openPromotionList(event.offsetX, event.offsetY, forcedPromotions);
                } else {
                    sendMove({from: Board.convertToNotation(selected.current), to: Board.convertToNotation(clicked)});
                    selected.current = null;
                }
                
            } else {
                renderBoard();
                selected.current = null;
            }
    
        } else {
            if (game.owns(sessionUser, clicked) && game.isTurn(sessionUser)) { // is my piece
                // set selected. display possible moves.
                selectSquare(clicked);
            }
        }
    
    }

    function handlePromotionListClick(e) {
        sendMove({ from: Board.convertToNotation(selected.current), to: Board.convertToNotation(moveCopy.current), promotion: e.target.innerText });
        selected.current = null;
        closePromotionList();
        renderBoard();
    }

    return (
        <>
            <title>Game</title>
            <div id='mainBody'>
                {game ?
                    <div id='game-div'>
                        <canvas id='board' ref={canvas} onClick={(gameStatus.length === 0 && game.isPlayer(sessionUser)) ? handleClick : undefined}></canvas>
                        {promotionListOpen() && 
                            <ul id='promotion-list'>
                                {
                                    moveForcedPromotions.map(choice => (
                                        <li key={choice} onClick={handlePromotionListClick}>
                                            {choice}
                                        </li>
                                    ))}
                            </ul>
                        }
                        <GameMenu
                            gameId={game.uuid}
                            white={game.white}
                            black={game.black}
                            result={gameStatus}
                            isPlayer={game.isPlayer(sessionUser)}
                            onSwitchPerspective={switchPerspective}
                            />

                    </div>
                    :
                    <p>Game not found.</p>
                }
            </div>
        </>
    );
}

export default GamePage;