import React from "react";
import { Link } from "react-router-dom";


const toUrl = (user) => <Link to={'/users/' + user} className='button'>{user}</Link>;

export default function GameMenu({ gameId, white, black, result, isPlayer, onSwitchPerspective}) {

    function sendResign(_) {
        fetch('/games/' + gameId + '/resign', { method: 'post' });
    }

    return (
        <div id='game-menu'>
            <h3 className='game-menu-header'>
                {toUrl(white)} vs {toUrl(black)}
            </h3>


            {result.length !== 0 &&
                <p id='game-result'>{result}</p>
            }
            
            <button type="button" className='button' onClick={onSwitchPerspective}>Switch perspective</button>
            {isPlayer && result.length === 0 &&
                <button type="button" className='button' onClick={sendResign}>Resign</button>
            }
        </div>
    )
}
