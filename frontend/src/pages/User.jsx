import React, { useContext } from 'react'
import { useLoaderData, useParams } from 'react-router-dom';

import '../user_page.css'

import { SessionUserContext } from '../contexts/SessionUserContext';
import { queryClient } from '../App';
import { fetchThrow } from '../util/fetch_throw';
import { useQuery } from 'react-query';

import PastGameList from '../components/PastGameList'

const baseUserPageStaleTime = 1000 * 60 * 5; // 5 mins.

export const userLoader = async ({ params }) => {
    // these queries should be invalidated after game ends,
    // so viewers and players after game always get updated stats if go to profile.
    // for players, the history query with opponent should also be invalidated.
    return Promise.all([
        queryClient.fetchQuery(['user', params.user, 'stats'], 
            () => fetchThrow('/users/' + params.user + '/stats').then(res => res.json()),
            {
                staleTime: baseUserPageStaleTime
            }
        ),
        queryClient.fetchQuery(['user', params.user, 'recent-games'],
            () => fetchThrow('/users/' + params.user + '/recent-games?max=10')
                .then(res => res.json())
                .then(games => {
                    for (const game of games) {
                        game.started = new Date(game.started);
                        game.ended = new Date(game.ended);
                    }
                    return games;
                }),
            {
                staleTime: baseUserPageStaleTime
            }
        )
    ]);
}


function User() {
    const params = useParams();
    const pageOf = params.user;
    const sessionUser = useContext(SessionUserContext);

    const [stats, games] = useLoaderData();

    const history = useQuery(['user', sessionUser, 'history', pageOf], async () => {
        if (sessionUser !== '' && sessionUser !== pageOf) {
            const res = await fetch('/users/' + sessionUser + '/history/' + pageOf);
            if (res.ok) {
                return res.json();
            } else {
                return null;
            }
        } else {
            return null;
        }
    },
    {
        staleTime: baseUserPageStaleTime
    });
    

    return (
        <div className='profile-detailed'>
            {stats !== null ? 
                <>
                    <div className='profile-header'>
                        {history.isSuccess && history.data !== null &&
                            <div className='history-with-you'>
                                <h2>Your history with {pageOf}</h2>
                                <ul>
                                    <li className='game-victory'>Wins: {history.data.wins}</li>
                                    <li>Draws: {history.data.draws}</li>
                                    <li className='game-defeat'>Losses: {history.data.losses}</li>
                                </ul>
                            </div>
                        }
                        <div className='profile-header-main'>
                            <h1>{pageOf}</h1>
                            <table className='user-table'>
                                <thead>
                                    <tr>
                                        <th>Wins</th>
                                        <th>Draws</th>
                                        <th>Losses</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className='game-victory'>{stats.wins}</td>
                                        <td>{stats.draws}</td>
                                        <td className='game-defeat'>{stats.losses}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <section className='game-history'>
                        <h1>Game History</h1>
                        {games && <PastGameList games={games} perspective={pageOf}/>}
                    </section>
                </>
                :
                <p>No profile found for {pageOf}!</p>
            }            
            
        </div>
    );
}

export default User;