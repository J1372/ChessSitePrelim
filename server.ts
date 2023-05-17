import mongoose from "mongoose"
await mongoose.connect('mongodb://127.0.0.1:27017/Chess');

import * as authentication from "./authentication.js"
import * as games from './games.js';
import * as users from './users.js'
import * as path from 'path';
import * as valid from './validation.js';

import { fileURLToPath } from 'url';

import express from 'express';
import sessions from 'express-session';
import MongoStore from "connect-mongo";

declare module "express-session" {
    interface SessionData {
      user: string;
      mongoId: string, // cannot use ObjectId due to way sessions work.
    }
  }

const app = express();
const port = 8080;

const jsonParser = express.json();
const urlParser = express.urlencoded({extended: true});

const secret = "HGHFFGHTUJFY";

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const gameplayPath = path.join(projectDir, 'gameplay');

const front_path = path.join(projectDir, 'frontend');
const stylePath = path.join(front_path, 'style', 'bin');
const scriptPath = path.join(front_path, 'script');

app.use(express.static(stylePath));
app.use(express.static(scriptPath));
app.use(express.static(gameplayPath));
app.use(sessions({
    secret: secret,
    saveUninitialized: true,
    resave: false,

    store: MongoStore.create({
        client: mongoose.connection.getClient(),
        ttl: 60 * 10,
    })
}));

app.set('views', './views');
app.set('view engine', 'pug');

process.on('SIGINT', async (code) => {
    console.log("Stopping server.");
    await mongoose.disconnect();
    console.log("Closed database.");
    process.exit();
});

/*

    End setup.

*/




app.get('/', (req: express.Request, res: express.Response) => {
    res.render('home', { sessionUser: req.session.user})
});

app.get('/home', (req: express.Request, res: express.Response) => {
    res.render('home', { sessionUser: req.session.user });
});

app.get('/login', (req: express.Request, res: express.Response) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.render('login_page');
    }
});

app.get('/create-account', (req: express.Request, res: express.Response) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.render('register_page');
    }
});

// users
app.post('/user/login', valid.notLoggedIn, urlParser, valid.loginRegBasicSchema, authentication.loginHandler);
app.get('/user/logout', valid.loggedIn, users.logoutHandler);
app.get('/user/:user', users.userPage);
app.post('/user/create-account', valid.notLoggedIn, urlParser, valid.loginRegBasicSchema, authentication.createAccountHandler);


// games
app.post('/game/create', valid.loggedIn, jsonParser, valid.createGameSchema, games.create);
app.get('/game/get-open-games', games.getOpenGames);
app.post('/game/:uuid/join', valid.loggedIn, games.join);
app.get('/game/:uuid', games.gamePage);
app.get('/game/:uuid/subscribe', games.subscribe);
app.get('/game/:uuid/waiting', valid.loggedIn, games.hostWaiting);
app.post('/game/:uuid/move', valid.loggedIn, jsonParser, valid.moveSchema, games.move);
app.post('/game/:uuid/resign', valid.loggedIn, games.resignGame);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
