import {db, getUserStats, userExists} from "./database.js"
import * as authentication from "./authentication.js"


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
                profileWins: stats.gamesWon,
                profileDraws: stats.gamesDrawn,
                profileLosses: stats.gamesLost,
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

app.post('/create-account-attempt', parserMy, authentication.createAccountHandler);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
