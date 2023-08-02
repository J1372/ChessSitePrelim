import React, { useContext, useRef, useState } from 'react';
import '../home.css';
import { Color } from 'chessgameplay';
import { clientsideDateString } from '../util/clientside_date_converter';
import { useNavigate } from 'react-router-dom';
import { SessionUserContext } from '../contexts/SessionUserContext';
import { fetchThrow } from '../util/fetch_throw';
import { useQuery } from 'react-query';
import { queryClient } from '../App';

const getGames = async () => {
    return fetchThrow("/games/open-games")
        .then(res => res.json())
        .then(games => {
            for (const game of games) {
                game.posted = new Date(game.posted);
            }
            return games;
        });
}

export const homeLoader = async () => {
    return queryClient.fetchQuery('open-games', getGames);
}

function Home() {
    const sessionUser = useContext(SessionUserContext);

    const { isLoading, isError, data: games } = useQuery('open-games', getGames, {
        refetchOnMount: false,
        refetchInterval: 1000 * 30 // refetch every 30s
    });
    const [creatingGame, setCreatingGame] = useState(false);
    const [playAs, setPlayAs] = useState('e');

    const sse = useRef(null);

    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (sse.current) {
            return;
        }

        const res = await fetch('/games', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({color: playAs})
        });

        if (!res.ok) {
            return;
        }

        const uuid = await res.text();


        const toGameURL = '/games/' + uuid;
        const sseURL = toGameURL + '/waiting';
        const listener = new EventSource(sseURL);
        sse.current = listener;
        listener.onmessage = _ => {
            listener.close();
            navigate(toGameURL);
        };
        listener.onerror = () => listener.close();

        refreshGameList();
        setCreatingGame(false);
    }

    async function refreshGameList() {
        queryClient.fetchQuery('open-games', getGames);
    }

    function toggleCreatorVisibility() {
        setCreatingGame(!creatingGame);
    }

    async function attemptJoinGame(e) {
        const trNode = e.target.parentNode;
        const uuid = trNode.getAttribute('data-uuid');

        const response = await fetch('/games/' + uuid, { method: 'put' });
        if (response.ok) {
            navigate('/games/' + uuid);
        } else {
            // host atempt join or game no longer joinable.
        }
    }

    let gameLoadContent = <p></p>;
    if (isLoading) {
        gameLoadContent = <p>Loading games...</p>;
    } else if (isError) {
        gameLoadContent = <p>Could not load games!</p>;
    } else {
        gameLoadContent = (
            <table id='openGamesTable' className='game-table'>
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Time Created</th>
                        <th>Host Plays</th>
                    </tr>
                </thead>
                <tbody>
                    {games.map((game) => {
                        const localPostDate = clientsideDateString(game.posted);
                        let hostPlaysAs = Color.toString(game.hostPlayAs);
                        if (!hostPlaysAs) {
                            hostPlaysAs = 'Either';
                        }

                        return (
                        <tr className='button' key={game.uuid} data-uuid={game.uuid} onClick={attemptJoinGame}>
                            <td>{game.host}</td>
                            <td>{localPostDate}</td>
                            <td>{hostPlaysAs}</td>
                        </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    }

    return (
        <>
            {creatingGame &&
                <form className='common-form' action="/games" method="post" onSubmit={handleSubmit}>
                    <h1>Game details</h1>
                    <p>Play as:</p>
                    <ul className='args'>
                        <li>
                            <label htmlFor="no-pref">No preference</label>
                            <input type="radio" name="hostPrefer" id="no-pref" value='e' checked={playAs === 'e'} onChange={_ => setPlayAs('e')}/>
                        </li>
                        <li>
                            <label htmlFor="white">White</label>
                            <input type="radio" name="hostPrefer" id="white" value='w' checked={playAs === 'w'} onChange={_ => setPlayAs('w')}/>
                        </li>
                        <li>
                            <label htmlFor="black">Black</label>
                            <input type="radio" name="hostPrefer" id="black" value='b' checked={playAs === 'b'} onChange={_ => setPlayAs('b')}/>
                        </li>
                    </ul>
                    <button className='button' type="submit">Create game</button>
                </form>
            }
            
            <div id='mainBody'>
                <section id='openGames'>
                    <h1>Games</h1>
                    {gameLoadContent}
                </section>

                {sessionUser.length !== 0 && <button type='button' className='button' onClick={toggleCreatorVisibility}>Create game</button>}
                <button type="button" className='button' onClick={refreshGameList}>Refresh list</button>

            </div>
        </>
    );
}

export default Home;