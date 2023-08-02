import express from 'express';
import { Game } from './gameplay/game.js';
import { GamePost } from './gameplay/game_post.js';
import { Board } from './gameplay/board.js';
import { pieceFactory } from './gameplay/pieces/piece_factory.js';
import { TimeControl } from './gameplay/time_control.js';
import { Color } from './gameplay/color.js';
import { randomUUID } from 'crypto';
import { MongoGame } from './mongo/mongo_game.js'
import { User } from './mongo/user.js';
import { UsersGameHistory } from './mongo/users_game_history.js'
import { matchedData, validationResult } from 'express-validator';

// Public games posted that can be joined by any user.
const openGames = new Map<string, GamePost>();
const openGamesList = new Array<GamePost>();

// Games being played now.
const activeGames = new Map<string, Game>();

// SSE game observers
const gameObservers = new Map<string, Array<Observer>>();

export function getOpenGames(req: express.Request, res: express.Response) {
    res.send(JSON.stringify(openGamesList));
}

function endGame(game: Game) {
    activeGames.delete(game.uuid);
    const observers = gameObservers.get(game.uuid);

    // maybe also send a 'end' event.
    observers?.forEach(o => o.res.end());
    gameObservers.delete(game.uuid);

    // await store to db.
}

function tryMove(req: express.Request): boolean {
    const data = matchedData(req);

    const game = activeGames.get(req.params.uuid);

    // No game with uuid that is currently being played.
    if (!game) {
        return false;
    }

    const user = req.session.user!;

    // Only allow making a move if logged in and the user is a player in the game.
    if (!game.isPlayer(user)) {
        return false;
    }

    // There is a game with uuid, and the user is a player in the game.

    // It is also the player's turn.
    // Should be able to move if the move is well-formed valid.

    const from = data.from;
    const to = data.to;

    const fromSquare = Board.convertFromNotation(req.body.from);
    const toSquare = Board.convertFromNotation(req.body.to);

    // Move notation invalid for board size.
    if (!fromSquare || !toSquare) {
        return false;
    }

    if (game.canMove(user, fromSquare, toSquare)) {
        const forcedPromotions = game.getPromotions(fromSquare, toSquare);
        const userSelectedPromotion = data.promotion as string | undefined;

        // if game.mustPromote(move) then game.tryPromote(square, pieceString) and if fail then return.

        if (forcedPromotions.length > 0) {
            // Move requires promotion, user request does not specify a promotion.
            if (!userSelectedPromotion) {
                return false;
            }

            // User-specified promotion is invalid.
            if (!forcedPromotions.includes(userSelectedPromotion)) {
                return false;
            }

            // Create new piece.
            const promotedTo = pieceFactory(userSelectedPromotion, game.getColor(user));

            // Factory failed to produce a Piece. Should only happen if piece string is invalid.
            if (!promotedTo) {
                return false;
            }

            game.move(fromSquare, toSquare);
            game.promote(toSquare, promotedTo); // will double update control areas.
        } else {
            game.move(fromSquare, toSquare);
        }

        if (game.userWon(user)) {
            const ended = new Date();
            notifyObservers(game.uuid, 'move', { from: from, to: to, promotion: userSelectedPromotion, ended: 'mate' });
            endGame(game);
            storeGame(game, game.getColor(user), 'M', ended);
        } else {
            notifyObservers(game.uuid, 'move', { from: from, to: to, promotion: userSelectedPromotion });
        }

        return true;
        
    } else {
        return false;
    }
}

export function move(req: express.Request, res: express.Response) {
    if (validationResult(req).isEmpty() && tryMove(req)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }
}

async function storeGame(game: Game, winner: Color, dueTo: string, ended: Date) {
    // Get necessary info about players.
    const selectStr = '_id wins losses gameHistory';
    const [white, black] = await Promise.all([User.findOne({name: game.white.user}).select(selectStr).exec(),
                                              User.findOne({name: game.black.user}).select(selectStr).exec()]);
    
    // If game was actually played, neither should ever be null.
    if (!white || !black) {
        return;
    }

    let result = '';
    let winnerUpdate;
    let loserUpdate;
    if (winner === Color.White) {
        result = 'W';
        winnerUpdate = white;
        loserUpdate = black;
    } else {
        result = 'B';
        winnerUpdate = black;
        loserUpdate = white;
    }


    // Update actual user wins
    ++winnerUpdate.wins;
    ++loserUpdate.losses;
    

    // Update players' history with each other.
    const winnerId = winnerUpdate._id;
    const key = UsersGameHistory.key(white._id, black._id);
    UsersGameHistory.findById(key).select('user1Wins user2Wins').exec()
    .then(history => {
        // Create a new history if players have never played together before.
        if (!history) {
            history = new UsersGameHistory({
                _id: key,
                user1Wins: 0,
                draws: 0,
                user2Wins: 0,
            });
        }
        
        if (key.a.equals(winnerId)) {
            ++history.user1Wins;
        } else {
            ++history.user2Wins;
        }
    
        history.save()
        .then(_ => console.log('Updated player histories.'))
        .catch(console.log);
    })
    .catch(console.log);



    // Create the actual game.
    const newGame = new MongoGame({
        uuid: game.uuid,
        white: white._id,
        black: black._id,
        result: result,
        dueTo: dueTo,
        started: game.started,
        ended: ended
    });

    newGame.save()
    .then(savedGame => {
        console.log('Saved game to db.')
        
        // Add game to players' histories.
        white.gameHistory.push(savedGame._id);
        black.gameHistory.push(savedGame._id);

        Promise.all([white.save(), black.save()])
        .then(_ => console.log('Updated player info.'))
        .catch(console.log);
    })
    .catch(console.log);

}

function tryResign(req: express.Request) {
    const received = new Date();
    const user = req.session.user!;

    const game = activeGames.get(req.params.uuid);

    if (!game) {
        return false;
    }

    if (game.isPlayer(user)) {
        // set game status.
        notifyObservers(game.uuid, 'resign', { resigned: user });
        endGame(game);

        const winner = Color.opposite(game.getColor(user));
        storeGame(game, winner, 'R', received);
        
        return true;
    } else {
        return false;
    }
}

export function resignGame(req: express.Request, res: express.Response) {
    if (tryResign(req)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }
}

export function join(req: express.Request, res: express.Response) {
    const uuid = req.params.uuid;

    const gamePost = openGames.get(uuid);
    const userJoining = req.session.user!;

    if (gamePost) {
        if (userJoining === gamePost.host) {
            // Host trying to join their own game.
            res.sendStatus(403);
            return;
        }

        // join player to game. move to activeGames. update game through socket to host to notify player joined. start game.
        
        // still looking for player, return status ok
        // client check this in a fetch. if OK -> redirect self to game/:uuid.
        openGames.delete(uuid);
        openGamesList.splice(openGamesList.findIndex(post => post.uuid === uuid), 1)

        const newGame = Game.fromPost(gamePost, userJoining);
        activeGames.set(uuid, newGame);
        gameObservers.set(uuid, []); // could merge obserevrs with activeGames.
        const hostNotify = joinObservers.get(uuid);
        if (hostNotify) {
            hostNotify.res.write('event: message\ndata:\n\n'); // on req.end, we close res.
        }
        res.sendStatus(200); // or res.redirect here.
    } else {
        // Game not joinable
        res.sendStatus(404);
    }
}

export function create(req: express.Request, res: express.Response) {
    if (!validationResult(req).isEmpty()) {
        res.sendStatus(403);
        return;
    }

    const data = matchedData(req);
    const user = req.session.user!;

    let hostPrefer: Color | undefined = undefined;
    if (data.color === 'w') {
        hostPrefer = Color.White;
    } else if (data.color === 'b') {
        hostPrefer = Color.Black;
    }

    
    const timeControl: TimeControl = {
        startingMins: 0,
        increment: 0,
        delay: 0,
    }
    const uuid = randomUUID();
    const created = new GamePost(uuid, user, timeControl, hostPrefer);

    openGames.set(uuid, created);
    openGamesList.push(created);
    res.send(uuid);
}

export function subscribe(req: express.Request, res: express.Response) {
    addGameObserver(req, res, req.params.uuid);
}

// Notify host when player joins their open game.
export function hostWaiting(req: express.Request, res: express.Response) {
    addJoinObserver(req, res, req.params.uuid);
}








interface Observer {
    id: string;
    res: express.Response;
}

const joinObservers = new Map<string, Observer>();

function createObserver(res: express.Response): Observer {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };

    res.writeHead(200, headers);
    return { id: randomUUID(), res: res };
}

function addJoinObserver(req: express.Request, res: express.Response, uuid: string) {
    const observer = createObserver(res);
    joinObservers.set(uuid, observer);

    req.on('close', () => {
        // could use index in array as an id and swap-pop
        console.log(`${observer.id} closed sse connection.`);

        observer.res.write('data:\n\n');
        observer.res.end();
        joinObservers.delete(uuid);
    })
}

function addGameObserver(req: express.Request, res: express.Response, uuid: string) {
    const observer = createObserver(res);
    gameObservers.get(uuid)?.push(observer);

    req.on('close', () => {
        // could use index in array as an id and swap-pop
        console.log(`${observer.id} closed sse connection.`);

        const currObservers = gameObservers.get(uuid);
        if (currObservers) {
            gameObservers.set(uuid, currObservers.filter(o => o.id !== observer.id));
        }
    })
}

function notifyObservers(uuid: string, event: string, data: any) {
    const observerList = gameObservers.get(uuid);

    if (!observerList) {
        return;
    }

    const message = 'event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n';
    observerList.forEach(o => o.res.write(message));
}

export function getGameState(req: express.Request, res: express.Response) {
    const uuid = req.params.uuid;
    const activeGame = activeGames.get(uuid);

    if (activeGame) {
        res.send(JSON.stringify(activeGame));
    } else {
        res.sendStatus(404);
    }
}

