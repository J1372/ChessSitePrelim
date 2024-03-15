import { useEffect, useState, useRef } from "react";
import PlayableGameBoard from "./PlayableGameBoard";
import { io } from 'socket.io-client';
import { Game, Color } from "chessgameplay";

// externalMoveNotify - move made by something other than clicking the board (text, button)
export default function SocketGameBoard({ uuid, perspective, _gameBoardComponentType, setGameEndedResult, returnGameAfterLoad, externalMoveNotify }) {

    // used to notify board component of a move.
    const [moveUpdate, setMoveUpdate] = useState(null);
    // loaded only once on every uuid change.
    const [game, setGame] = useState(null);
    const [validMoveHandler, setValidMoveHandler] = useState(() => (_move, _canvas) => {});

    // So the below useEffect can call correct handlers if updated without triggering socket reconnect.
    // new react versions have useEffectEvent maybe
    const setGameEndedResultRef = useRef(setGameEndedResult);
    setGameEndedResultRef.current = setGameEndedResult
    const returnGameAfterLoadRef = useRef(returnGameAfterLoad);
    returnGameAfterLoadRef.current = returnGameAfterLoad;

    // would be better to somehow moveNotify the underlying board from the external service. By passing in the board.
    // decouple playable board from socket.
    const validMoveHandlerRef = useRef(validMoveHandler);
    validMoveHandlerRef.current = validMoveHandler;
    useEffect(() => {
        console.log(`External move handling: ${externalMoveNotify}`);
        if (validMoveHandlerRef.current && externalMoveNotify) { // todo resign need to emit to resign event
            console.log('Called validMoveHandler.');
            validMoveHandlerRef.current(externalMoveNotify, null);
        }
    }, [externalMoveNotify]);

    // socket connect and set up event handlers.
    useEffect(() => {
        // window.location.host default
        const socket = io(`http://localhost:4000`, { query: { gameUUID: uuid }, withCredentials: true });
        socket.on('connect_error', err => {
            console.log(err.message);
            console.log(err.description);
            console.log(err.context);
        });


        socket.on('game-state', onInitialGameState);

        let deserialized = null;
        let gameMoveHandler = () => {};
        let gameResignHandler = () => {};
        function onInitialGameState(gameJSONString) {
            const initialGameJson = JSON.parse(gameJSONString);
            deserialized = Game.deserialize(initialGameJson);
            returnGameAfterLoadRef.current(deserialized);

            setGame(deserialized);
            setValidMoveHandler(() => (move, _) => { sendMove(move) });
            
            gameMoveHandler = (moveString) => {
                const moveMessage = JSON.parse(moveString);
                const move = moveMessage.move;

                const color = deserialized.board.curTurn;
                const player = deserialized.getCurPlayer();
                deserialized.move(move);

                setMoveUpdate(move); //this will call setGameEndedResult if mated.
                
                if (moveMessage.ended === 'mate') {
                    const loser = deserialized.getCurPlayer()
                    setGameEndedResultRef.current({ winner: player, loser: loser, winnerColor: color, reason: 'mate' });
                }
            }

            gameResignHandler = (resigner) => {
                const color = Color.opposite(deserialized.getColor(resigner));
                const winner = deserialized.getPlayer(color);
                setGameEndedResultRef.current({ winner: winner, loser: resigner, winnerColor: color, reason: 'resign' });
                //setMoveUpdate({ resigned: resigner });
            }

            socket.off('game-state', onInitialGameState);
            socket.on('move', gameMoveHandler);
            socket.on('resign', gameResignHandler);
        }

        function sendMove(move) {
            socket.emit('move', JSON.stringify(move));
        }

        return () => {
            if (deserialized) {
                console.log('Removing socket handlers');
                socket.off('move', gameMoveHandler);
                socket.off('resign', gameResignHandler);
            }
            console.log('Disconnecting socket');
            socket.disconnect();
        }}, [uuid]);

    //const GameBoardComponentType = () => gameBoardComponentType;
    return (
        <>
            { game ?
                    <PlayableGameBoard
                        game={game}
                        perspective={perspective}
                        moveUpdate={moveUpdate}
                        onPlayerValidMoveAttempt={validMoveHandler}
                    />
            :
                <p>Connecting...</p>
            }
        </>
    )
}
