import {db, getUserStats, userExists} from "./database.js"
import * as authentication from "./authentication.js"

import { GamePost } from './gameplay/game_post.js'
import { Game } from './gameplay/game.js'
import { TimeControl } from './gameplay/time_control.js'
import { Color } from './gameplay/color.js'

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

const projectDir = path.dirname(fileURLToPath(import.meta.url));

const port = 8080;

const jsonParser = express.json();


const front_path = path.join(projectDir, 'frontend');
const login_path = path.join(projectDir, 'frontend', 'login', 'login.html');
const homePath = path.join(projectDir, 'frontend', 'home', 'home.html');

const secret = "HGHFFGHTUJFY";

app.use(express.static(front_path));
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
    
    req.session.destroy(err => {
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


function makeid(length: number) {
    const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

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

        let uuid = makeid(16);
        /*
        while (! await isUniqueGameId(uuid)) {
            uuid = makeid(16);
        }*/

        const created = new GamePost(uuid, user, timeControl, hostPrefer);

        openGames.set(uuid, created);
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }


});

app.get('/get-open-games', (req: express.Request, res: express.Response) => {
    res.send(JSON.stringify(openGames));
});


app.post('/join-game', jsonParser, (req: express.Request, res: express.Response) => {
    const uuid = req.body.uuid;

    if (uuid) {
        const openGame = openGames.get(uuid);

        if (openGame) {
            // join player to game. move to activeGames. update game through socket to host to notify player joined. start game.
            
            // still looking for player, return status ok
            // client check this in a fetch. if OK -> redirect self to game/:uuid.
            res.sendStatus(200);
        } else {
            // Game not joinable.
            res.sendStatus(403); // client should notify that the game is not joinable.
        }
    }
});

app.get('/game/:uuid', async (req: express.Request, res: express.Response) => {
    // send current board page to client.
    const uuid = req.params.uuid;

    const activeGame = activeGames.get(uuid);

    if (activeGame) {
        const user = req.session.user;

        let userPlaying = null;
       
        // if session == player, allow client-side to move their pieces (which will post moves to us)

        res.render('game_page', {
            gameExists: true,

        });

        return;
    }
    
    // no active game with uuid, check database for finished game.

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
    }


    // handle move for session user.
    // if valid active game, game needs to handle chess logic
    // if game ends as a result of move, update activegames and user games.

    // if  move valid, setTimeout for next user for rest of their time. clear current user timeout.
    // on this timeout, other player timed out.


    // move can be offer_draw, resign as well.
});

app.post('/game-move', jsonParser, (req: express.Request, res: express.Response) => {
    const game = activeGames.get(req.body.uuid);
    const user = req.session.user;

    if (!game) {
        return;
    }

    //user === game.white.user || user === game.black.user)
    // Only allow making a move if logged in and the user is a player in the game.
    if (!user || !game.isPlayer(user)) {
        return;
    }

    // There is a game with uuid, and the user is a player in the game.

    // Players can resign at any time, even if it is not their turn.
    if (req.body.resign) {
        // handle resignation
        return;
    }

    // Other moves: Need to verify that it is the user's turn.

    if (!game.isTurn(user)) {
        return;
    }

    // It is also the player's turn.
    // Should be able to move if the move is valid.

    // Malformed post request.
    if (!req.body.to || !req.body.from) {
        return;
    }


    const from = req.body.from as string;
    const to = req.body.to as string;

    const fromSquare = Board.convertNotation(from);
    const toSquare = Board.convertNotation(to);

    if (!fromSquare || !toSquare) {
        return;
    }

    if (game.canMove(fromSquare, toSquare)) {
        game.move(fromSquare, toSquare);
        // Notify other players, viewers.

        // Check if game is over, notify players, viewers.
        // if player checkmated other player or 50 move rule or 3-fold repetition, to be exact

        // update timeouts, timers, etc.
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
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
