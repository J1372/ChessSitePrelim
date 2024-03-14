import React, { useContext, useState } from 'react'
import { useParams } from 'react-router-dom';
import GameMenu from '../components/GameMenu';

import '../game_page.css'
import { SessionUserContext } from '../contexts/SessionUserContext';
import PlayableGameBoard from '../components/PlayableGameBoard';
import SocketGameBoard from '../components/SocketGameBoard';
import { Color } from 'chessgameplay'

function GamePage() {
    const sessionUser = useContext(SessionUserContext);
    const params = useParams();

    const [perspective, setPerspective] = useState(Color.White);
    const [game, setGame] = useState(null);
    const [gameEndedResult, setGameEndedResult] = useState('');
    const [boardExternalMove, setBoardExternalMove] = useState(null);

    function afterSocketGameLoad(deserialized) {
        if (sessionUser === deserialized.black) {
            setPerspective(Color.Black);
        }

        setGame(deserialized);
    }

    function switchPerspective() {
        setPerspective(Color.opposite(perspective));
    }

    function menuResignHandler() {
        setBoardExternalMove({ resigned: sessionUser });
    }

    function onGameEnded(message) {
        const winColRep = Color.toString(message.winnerColor);
        if (message.reason === 'mate') {
            setGameEndedResult(`Checkmate. ${message.winner} (${winColRep}) has won.`);
        } else if (message.reason === 'resign') {
            setGameEndedResult(`${message.loser} (${winColRep}) resigned.`);
        }
    }

    return (
        <>
            <title>Game</title>
            <div id='mainBody'>
                <div id='game-div'>
                    <SocketGameBoard
                        uuid={params.gameId}
                        perspective={perspective}
                        gameBoardComponentType={PlayableGameBoard}
                        setGameEndedResult={onGameEnded}
                        returnGameAfterLoad={afterSocketGameLoad}
                        externalMoveNotify={boardExternalMove}
                    />
                    { game && 
                        <GameMenu
                            isPlayer={game.isPlayer(sessionUser)}
                            white={game.white}
                            black={game.black}
                            result={gameEndedResult}
                            onResign={menuResignHandler}
                            onSwitchPerspective={switchPerspective}
                        />
                    }
                </div>
            </div>
        </>
    );
}

export default GamePage;
