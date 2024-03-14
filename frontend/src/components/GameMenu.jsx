import React from "react";
import UserLink from "./UserLink";

export default function GameMenu({ isPlayer, white, black, result, onResign, onSwitchPerspective}) {
    return (
        <div id='game-menu'>
            <h3 className='game-menu-header'>
                <UserLink user={white}/> vs <UserLink user={black}/>
            </h3>


            {result.length !== 0 &&
                <p id='game-result'>{result}</p>
            }
            
            <button type="button" className='button' onClick={onSwitchPerspective}>Switch perspective</button>
            {isPlayer && result.length === 0 &&
                <button type="button" className='button' onClick={onResign}>Resign</button>
            }
        </div>
    )
}
