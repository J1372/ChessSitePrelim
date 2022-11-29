import {db, getUserStats, userExists} from "./database.js"
import * as authentication from "./authentication.js"

import {Game, GamePost, TimeControl, Color} from './games.js';


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

const projectDir = path.dirname(fileURLToPath(import.meta.url));

const port = 8080;


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
const openGames = new Array<GamePost>();

// no private challengeGames between two players.

// Games being played now.
const activeGames = new Array<Game>();

// Map of users to games they are currently playing.
const playingGames = new Map<string, Game>();



app.post('/create-account-attempt', parserMy, authentication.createAccountHandler);

app.post('/create-game', parserMy, (req: express.Request, res: express.Response) => {
    const user = req.session.user;
    if (user) {

        // verify types!!!

        const timeControl: TimeControl = {
            startingMins: req.body.startMins,
            startingSecs: req.body.startSecs,
            increment: 0,
            delay: 0,
        }

        const hostPrefer: Color | undefined = req.body.color;

        let uuid = makeid(16);
        /*
        while (! await isUniqueGameId(uuid)) {
            uuid = makeid(16);
        }*/

        const created = new GamePost(uuid, user, timeControl, hostPrefer);

        openGames.push(created);
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }


});

app.get('/get-open-games', parserMy,  (req: express.Request, res: express.Response) => {
    res.send(JSON.stringify(openGames));
});


app.post('/join-game', parserMy, (req: express.Request, res: express.Response) => {
    // if still looking for player, return status ok

    // request has game uuid.

    const uuid = '';
    const stillActive = false; // any in opengames == uuid. race condition if two try to join.

    if (stillActive) {
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }

});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});


app.post('game/:uuid', (req: express.Request, res: express.Response) => {

    // handle move for session user.
    // if valid active game, game needs to handle chess logic
    // if game ends as a result of move, update activegames and user games.

    // if  move valid, setTimeout for next user for rest of their time. clear current user timeout.
    // on this timeout, other player timed out.


    // move can be offer_draw, resign as well.
});