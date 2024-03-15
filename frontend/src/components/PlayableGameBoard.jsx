import { useState, useRef, useContext } from "react";
import { SessionUserContext } from "../contexts/SessionUserContext";
import GameBoard from './GameBoard';

// doesnt expose gameboard clickhandler.
// Allows sessionUser to play moves using a board if they are a member in the game and it is their turn.
// moveUpdate - update the board if an external move was played.
export default function PlayableGameBoard({ game, perspective, moveUpdate, onPlayerValidMoveAttempt }) {

    const sessionUser = useContext(SessionUserContext);
    const [moveForcedPromotions, setMoveForcedPromotions] = useState([]);

    // keep copy of user's clicked move if promotionlist opened.
    const moveCopy = useRef(null);
    const [selected, setSelected] = useState(null);

    function promotionListOpen() {
        return moveForcedPromotions.length > 0;
    }

    function closePromotionList() {
        setMoveForcedPromotions([]);
    }

    function openPromotionList(x, y, forcedPromotions) {
        setMoveForcedPromotions(forcedPromotions);
    }

    function handlePromotionListClick(e) {
        onPlayerValidMoveAttempt({ from: selected, to: moveCopy.current, promotedTo: e.target.innerText });
        setSelected(null);
        closePromotionList();
    }


    function playerClickHandler(clicked, canvasBoard) {
        // promotion list was opened for previous move attempt, and the player clicked oon the board instead.
        // close list and deselect.
        if (promotionListOpen()) {
            closePromotionList();
            setSelected(null);
            return;
        }
    
        if (selected) {
            if (clicked.row === selected.row && clicked.col === selected.col) {
                // player clicked currently selected square, deselect.
                setSelected(null);
            } else if (game.owns(sessionUser, clicked)) {
                // player clicked on one of their other pieces. select that piece.
                setSelected(clicked);
            } else {
                const move = { from: selected, to: clicked, promotedTo: '' };

                if (game.canMove(sessionUser, move)) {
                    // player attempted to make a valid move.
                    // If a promotion is forced, open promotion list for selection.
                    // Otherwise, notify parent of player's valid move attempt and deselect.
                    const forcedPromotions = game.getForcedPromotions(move);
                    if (forcedPromotions.length > 0) {
                        moveCopy.current = clicked;
                        openPromotionList(0, 0, forcedPromotions);
                    } else {
                        onPlayerValidMoveAttempt(move, canvasBoard);
                        setSelected(null);
                    }
                } else {
                    // Player attempted invalid move, deselect.
                    setSelected(null);
                }
            }
    
        } else {
            // no current selection, select piece if it is player's turn and they own this piece.
            if (game.owns(sessionUser, clicked) && game.isTurn(sessionUser)) {
                setSelected(clicked);
            }
        }
    }

    return (
        <>
            <GameBoard 
                board={game.board}
                perspective={perspective}
                moveUpdate={moveUpdate}
                clickHandler={playerClickHandler}
                selected={selected}
            />
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
        </>
    )
}
