import {db, getUserStats, userExists} from "./database.js"
import * as authentication from "./authentication.js"

import { GamePost } from './gameplay/game_post.js'
import { Game } from './gameplay/game.js'
import { TimeControl } from './gameplay/time_control.js'
import { Color } from './gameplay/color.js'
import { pieceFactory } from './gameplay/pieces/piece_factory.js'

// http used since server and client ran on localhost.

import * as path from 'path';

import sqlite3 from 'sqlite3';

import express from 'express';
import sessions from 'express-session';

declare module "express-session" {
    interface SessionData {
      user: string;
    }
  }

import sqliteStoreFactory from "express-session-sqlite";

const sqliteStore = sqliteStoreFactory.default(sessions);

const app = express();

import { fileURLToPath } from 'url';
import { Board } from "./gameplay/board.js"
import { Piece } from "./gameplay/pieces/piece.js"

const projectDir = path.dirname(fileURLToPath(import.meta.url));

const port = 8080;

const jsonParser = express.json();


const front_path = path.join(projectDir, 'frontend');
const login_path = path.join(projectDir, 'frontend', 'login', 'login.html');
const homePath = path.join(projectDir, 'frontend', 'home', 'home.html');

const secret = "HGHFFGHTUJFY";

app.use(express.static(front_path));
app.use(express.static(path.join(projectDir, 'gameplay')));
app.use(sessions({
    secret: secret,
    saveUninitialized: true,
    resave: false,

    store: new sqliteStore({
        driver: sqlite3.Database,
        path: './db/chessDB.db',
        ttl: 1000 * 60 * 10,
    })
}));

app.set('views', './views');
app.set('view engine', 'pug');


process.on('SIGINT', async (code) => {
    console.log("Stopping server.");
    await db.close();
    console.log("Closed database.");
    process.exit();
});



/*

    End setup.

*/

const parserMy = express.urlencoded({extended: true});


app.get('/', (req: express.Request, res: express.Response) => {
    res.render('home', { sessionUser: req.session.user})
});

app.get('/login', (req: express.Request, res: express.Response) => {
    res.sendFile(login_path);
});

app.get('/home', (req: express.Request, res: express.Response) => {
    const session = req.session;

    console.log(`Session ID: ${session.id}`)
    console.log(`User: ${session.user}`);

    res.render('home', { sessionUser: session.user });

});

app.post('/login-attempt', parserMy, authentication.loginHandler);

app.post('/create-account', parserMy, (req: express.Request, res: express.Response) => {
    res.sendFile(login_path);
});


app.get('/logout', parserMy, (req: express.Request, res: express.Response) => {
    // alternatively, could do this maybe ? req.session.user = undefined;
    
    req.session.destroy(_ => {
        console.log("Logged out.");
        res.redirect('/home'); // todo should return a redirect to home / the page where user logged out instead.
    });
});


app.get('/user/:user', parserMy, async (req: express.Request, res: express.Response) => {
    const user = req.params.user;
    const getPageOf = user; // the user we are getting the profile page of.
    const sessionUser = req.session.user; // current session's user

    //const profileExists = await userExists(user);
    //const stats = await getUserStats(user);

    Promise.all([userExists(user), getUserStats(user)]).then((promises) => {
        const profileExists = promises[0];
        const stats = promises[1];

        if (profileExists) {
            res.render('user_page', 
            {
                pageUser: getPageOf,
                sessionUser: sessionUser,
                userExists: profileExists,
                profileWins: stats.wins,
                profileDraws: stats.draws,
                profileLosses: stats.losses,
            });
        } else {
            res.render('user_page', 
            {
                pageUser: getPageOf,
                sessionUser: sessionUser,
                userExists: profileExists
            });
        }

    });

    //res.render('user_page', {pageUser: getPageOf, sessionUser: sessionUser, userExists: profileExists});

});


/**
    Generates and returns a unique, but not crypto secure, random id.
    So, don't use it if need security (instead, use a crypto function).
*/
function makeUnsecureUUID(length: number): string {
    const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

    const chars = [...Array(length)].map(_ => base64.charAt(Math.floor(Math.random() * base64.length)));

    return chars.join('');
    let result = '';

    for (let i = 0; i < length; ++i) {
        result += base64.charAt(Math.floor(Math.random() * base64.length));
    }

    return result;
}



// Public games posted that can be joined by any user.
const openGames = new Map<string, GamePost>();

// no private challengeGames between two players.

// Games being played now.
const activeGames = new Map<string, Game>();

// Map of users to games they are currently playing.
const playingGames = new Map<string, Game>();

// SSE game observers
const gameObservers = new Map<string, Array<Observer>>();


app.post('/create-account-attempt', parserMy, authentication.createAccountHandler);


function validateTimeControl(timeControl: TimeControl): string | null {
    for (const entry of Object.entries(timeControl)) {
        if (isNaN(entry[1])) {
            return `${entry[0]} is not a number.`;
        }
    }

    if (timeControl.startingMins > 120) {
        return "Starting time was longer than 2 hours";
    }

    if (timeControl.increment > 60) {
        return "Increment was longer than 60 seconds";
    }

    if (timeControl.delay > 60) {
        return "Delay was longer than 60 seconds";
    }
    
    if (timeControl.startingMins <= 0) {
        return "Starting time is too low";
    }

    if (timeControl.increment < 0) {
        return "Negative increment";
    }

    if (timeControl.delay < 0) {
        return "Negative delay";
    }

    return null;
}

app.post('/create-game', jsonParser, (req: express.Request, res: express.Response) => {
    const user = req.session.user;
    if (user) {

        console.log(req.body);

        const timeControl: TimeControl = {
            startingMins: Number(req.body.startingMins),
            increment: Number(req.body.increment),
            delay: Number(req.body.delay),
        }

        console.log(timeControl);

        const errMsg = validateTimeControl(timeControl);
        if (errMsg) {
            console.log(errMsg);
            res.sendStatus(403);
            return;
        }

        const hostPrefer: Color | undefined = req.body.color;

        let uuid = makeUnsecureUUID(16);
        /*
        while (! await isUniqueGameId(uuid)) {
            uuid = makeUnsecureUUID(16);
        }*/

        const created = new GamePost(uuid, user, timeControl, hostPrefer);

        openGames.set(uuid, created);
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }


});

app.get('/get-open-games', (_, res: express.Response) => {
    res.send(JSON.stringify(Array.from(openGames.values())));
});


app.post('/join-game', jsonParser, (req: express.Request, res: express.Response) => {
    const uuid = req.body.uuid;

    if (!uuid) {
        res.sendStatus(404);
        return;
    }

    const gamePost = openGames.get(uuid);
    const userJoining = req.session.user;

    if (gamePost && userJoining) {
        if (userJoining === gamePost.host) {
            // Host trying to join their own game.
            res.sendStatus(403);
            return;
        }

        // join player to game. move to activeGames. update game through socket to host to notify player joined. start game.
        
        // still looking for player, return status ok
        // client check this in a fetch. if OK -> redirect self to game/:uuid.
        openGames.delete(uuid);
        const newGame = Game.fromPost(gamePost, userJoining);
        activeGames.set(uuid, newGame);
        gameObservers.set(uuid, []); // could merge obserevrs with activeGames.
        res.sendStatus(200); // or res.redirect here.
    } else {
        // Game not joinable, or user not signed in.
        res.sendStatus(403); // client should notify that the game is not joinable.
    }
});

app.get('/game/:uuid', async (req: express.Request, res: express.Response) => {
    // send current board page to client.
    const user = req.session.user;

    const uuid = req.params.uuid;
    const activeGame = activeGames.get(uuid);

    if (activeGame) {
        let userPlaying = null;
       
        // if session == player, allow client-side to move their pieces (which will post moves to us)


        res.render('game_page', {
            sessionUser: user,
            whitePlayer: activeGame.white.user,
            blackPlayer: activeGame.black.user,
            gameExists: true,
            gameJson: JSON.stringify(activeGame),
        });


    } else {
        res.render('game_page', {
            sessionUser: user,
            gameExists: false,
        });
    }
    
    // no active game with uuid, check database for finished game.


    /*
    const finishedGame = await db.get("SELECT white, black, result, resultDueTo, gameEnded, pgn FROM game WHERE uuid = ?", [uuid]);

    if (finishedGame) {
        const whitePromise = db.get("SELECT name FROM user WHERE id = ?", [finishedGame.white]);
        const blackPromise = db.get("SELECT name FROM user WHERE id = ?", [finishedGame.black]);

        Promise.all([whitePromise, blackPromise]).then(users => {

        });

        res.render('game_page', {
            gameExists: false
        });

    }
    else {
        // No game being played nor game in database.
        res.render('game_page', {
            gameExists: false
        });
    }*/


    // handle move for session user.
    // if valid active game, game needs to handle chess logic
    // if game ends as a result of move, update activegames and user games.

    // if  move valid, setTimeout for next user for rest of their time. clear current user timeout.
    // on this timeout, other player timed out.


    // move can be offer_draw, resign as well.
});

app.get('/game/:uuid/subscribe', async (req: express.Request, res: express.Response) => {
    addGameObserver(req, res, req.params.uuid);
});

function tryMove(req: express.Request): boolean {
    const game = activeGames.get(req.params.uuid);
    console.log('hi 1');

    // No game with uuid that is currently being played.
    if (!game) {
        return false;
    }

    console.log('hi 2');


    const user = req.session.user;

    // Only allow making a move if logged in and the user is a player in the game.
    if (!user || !game.isPlayer(user)) {
        return false;
    }

    console.log('hi 3');

    // There is a game with uuid, and the user is a player in the game.

    // Players can resign at any time, even if it is not their turn.
    if (req.body.resign) {
        // handle resignation
        // send events.
        return true;
    }

    console.log('hi 4');

    // It is also the player's turn.
    // Should be able to move if the move is well-formed valid.

    // Malformed post request.
    if (!req.body.to || !req.body.from) {
        return false;
    }

    console.log('hi 5');

    const from = req.body.from as string;
    const to = req.body.to as string;

    const fromSquare = Board.convertFromNotation(from);
    const toSquare = Board.convertFromNotation(to);

    console.log(from);
    console.log(to);
    
    // Move notation invalid for board size.
    if (!fromSquare || !toSquare) {
        return false;
    }

    console.log('hi 6');


    if (game.canMove(user, fromSquare, toSquare)) {
        const forcedPromotions = game.getPromotions(fromSquare, toSquare);
        console.log('hi 7');

        // if game.mustPromote(move) then game.tryPromote(square, pieceString) and if fail then return.

        if (forcedPromotions.length > 0) {
            const userSelectedPromotion = req.body.promotion as string | null;

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

        // Currently just checks if player won by this move.
        // Does not check more obscure rules (50 move rule, 3-fold repetition.
        /*if (game.hasWon(user)) {
            // send event that cur player won.
        } else {
            // send move event to players, visitors.
            // update timeouts, timers, etc.
        }*/


        if (game.userWon(user)) {
            notifyObservers(game.uuid, 'move', { from: from, to: to, ended: 'mate' });
            endGame(game);
        } else {
            notifyObservers(game.uuid, 'move', { from: from, to: to });
        }

        return true;
        
    } else {
        return false;
    }

    // Invalid move, do nothing.
    // In this case, client board was modified to allow sending the move despite clientside verification.

    
    /*

    Body {
        game uuid
        from
        to
    }

    no need to send response if move successful.
    client side will do their own check. if they mess with it, it only can affect them.

    Need to update opponent as well as clients who are viewing the game (send the move)
   
    */
}

app.post('/game-move/:uuid', jsonParser, (req: express.Request, res: express.Response) => {
    if (tryMove(req)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }
});

function tryResign(req: express.Request) {
    const user = req.session.user;
    if (!user) {
        return false;
    }

    const game = activeGames.get(req.params.uuid);

    if (!game) {
        return false;
    }

    if (game.isPlayer(user)) {
        // set game status.
        notifyObservers(game.uuid, 'resign', { resigned: user });
        endGame(game);
        return true;
    } else {
        return false;
    }
}

function endGame(game: Game) {
    activeGames.delete(game.uuid);
    const observers = gameObservers.get(game.uuid);

    // maybe also send a 'end' event.
    observers?.forEach(o => o.res.end());
    gameObservers.delete(game.uuid);

    // await store to db.
}

app.post('/game-resign/:uuid', (req: express.Request, res: express.Response) => {
    if (tryResign(req)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }
});

interface Observer {
    id: string;
    res: express.Response;
}


function addGameObserver(req: express.Request, res: express.Response, uuid: string) {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };

    res.writeHead(200, headers);

    const observer = { id: makeUnsecureUUID(16), res: res };
    gameObservers.get(uuid)?.push(observer);

    req.on('close', () => {
        // could use index in array as an id and swap-pop
        console.log(`${observer.id} closed sse connection.`);

        const currObservers = gameObservers.get(uuid);
        if (currObservers) {
            gameObservers.set(uuid, currObservers.filter(o => o.id !== observer.id));
        }

        // todo when game is finished, remember to delete gameObservers.uuid list.
        // in some other func, not here.

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






app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});









